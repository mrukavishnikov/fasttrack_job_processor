# Fast Track Job Processor - Terraform Infrastructure
# Hybrid Cloud: Hetzner Cloud (App Server) + Azure (OpenAI Service)
#
# Architecture Note:
# - Hetzner Cloud: Cost-effective for compute (€4-8/month for small VMs)
# - Azure: OpenAI Service for AI capabilities (pay-per-use)
# - This setup demonstrates multi-cloud architecture

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure for production
  # backend "azurerm" {
  #   resource_group_name  = "terraform-state-rg"
  #   storage_account_name = "tfstatefasttrack"
  #   container_name       = "tfstate"
  #   key                  = "fasttrack.tfstate"
  # }
}

# ============================================
# Variables
# ============================================

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "azure_subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "azure_location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "hetzner_location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1" # Nuremberg
}

variable "ssh_public_key" {
  description = "SSH public key for server access"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "webhook_secret" {
  description = "Secret for webhook authentication"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-minimum-16-characters"

  validation {
    condition     = length(var.webhook_secret) >= 16
    error_message = "Webhook secret must be at least 16 characters."
  }
}

# ============================================
# Provider Configuration
# ============================================

provider "hcloud" {
  token = var.hcloud_token
}

provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
}

# ============================================
# Hetzner Cloud Resources
# ============================================

# SSH Key for server access
resource "hcloud_ssh_key" "fasttrack" {
  name       = "fasttrack-key"
  public_key = var.ssh_public_key
}

# Firewall rules
resource "hcloud_firewall" "fasttrack" {
  name = "fasttrack-firewall"

  # SSH access
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Outbound traffic
  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

# Application Server
resource "hcloud_server" "fasttrack" {
  name        = "fasttrack-app"
  image       = "ubuntu-22.04"
  server_type = "cx21" # 2 vCPU, 4GB RAM - ~€6/month
  location    = var.hetzner_location
  
  ssh_keys = [hcloud_ssh_key.fasttrack.id]
  
  firewall_ids = [hcloud_firewall.fasttrack.id]

  # Cloud-init script for initial setup
  user_data = <<-EOF
    #cloud-config
    package_update: true
    package_upgrade: true
    
    packages:
      - docker.io
      - docker-compose
      - git
      - curl
    
    runcmd:
      - systemctl enable docker
      - systemctl start docker
      - usermod -aG docker ubuntu
      # Create app directory
      - mkdir -p /opt/fasttrack
      - chown ubuntu:ubuntu /opt/fasttrack
    
    # Swap file for small servers
    swap:
      filename: /swapfile
      size: 2G
  EOF

  labels = {
    app         = "fasttrack"
    environment = "production"
  }
}

# ============================================
# Azure Resources
# ============================================

# Resource Group
resource "azurerm_resource_group" "fasttrack" {
  name     = "fasttrack-rg"
  location = var.azure_location

  tags = {
    app         = "fasttrack"
    environment = "production"
  }
}

# Cognitive Services Account for OpenAI
# Note: Azure OpenAI requires separate application for access
resource "azurerm_cognitive_account" "openai" {
  name                = "fasttrack-openai"
  location            = var.azure_location
  resource_group_name = azurerm_resource_group.fasttrack.name
  kind                = "OpenAI"
  sku_name            = "S0"

  # Network restrictions (optional - for enhanced security)
  # public_network_access_enabled = false

  tags = {
    app         = "fasttrack"
    environment = "production"
  }
}

# OpenAI Deployment (GPT-4 or GPT-3.5-turbo)
# Note: Model availability depends on your Azure region and access
resource "azurerm_cognitive_deployment" "gpt4" {
  name                 = "gpt-4"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "0613"
  }

  scale {
    type     = "Standard"
    capacity = 10 # Tokens per minute (in thousands)
  }
}

# ============================================
# Outputs
# ============================================

output "app_server_ip" {
  description = "Public IP of the application server"
  value       = hcloud_server.fasttrack.ipv4_address
}

output "app_server_ipv6" {
  description = "IPv6 address of the application server"
  value       = hcloud_server.fasttrack.ipv6_address
}

output "azure_openai_endpoint" {
  description = "Azure OpenAI endpoint URL"
  value       = azurerm_cognitive_account.openai.endpoint
}

output "azure_openai_key" {
  description = "Azure OpenAI API key (primary)"
  value       = azurerm_cognitive_account.openai.primary_access_key
  sensitive   = true
}

output "deployment_instructions" {
  description = "Next steps for deployment"
  value       = <<-EOT
    
    ✅ Infrastructure provisioned successfully!
    
    Next steps:
    1. SSH into the server: ssh ubuntu@${hcloud_server.fasttrack.ipv4_address}
    2. Clone your repository
    3. Copy docker-compose.yml and set environment variables
    4. Run: docker-compose up -d
    
    Azure OpenAI:
    - Endpoint: ${azurerm_cognitive_account.openai.endpoint}
    - Get key: terraform output azure_openai_key
    
    Estimated monthly cost:
    - Hetzner CX21: ~€6
    - Azure OpenAI: Pay per usage (~$0.03/1K tokens for GPT-4)
  EOT
}


# 🚀 Fast Track Job Processor

> A production-ready Job Processor system that demonstrates async AI workflow patterns (user → queue → worker → UI).

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Architecture Decisions](#architecture-decisions)
- [Scaling Guide](#scaling-guide)
- [Deployment](#deployment)

## Overview

This project implements a **Modular Monolith** architecture for a Job Processing system. Key features:

- **Async Job Processing**: Submit prompts → background processing → webhook callback
- **Real-time UI**: Polling-based updates with TanStack Query
- **Type Safety**: End-to-end TypeScript with strict mode
- **Production Ready**: Docker multi-stage builds, health checks, graceful shutdown

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│    MongoDB      │
│   (React/Vite)  │     │   (Express)     │     │                 │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ enqueue
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │   MockJobQueue  │
                        │  (setTimeout)   │
                        │                 │
                        └────────┬────────┘
                                 │
                                 │ 5s delay
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  POST /webhook  │
                        │   /callback     │
                        │                 │
                        └─────────────────┘
```

### Backend Layered Architecture

```
Controller → Service → Repository → MongoDB
     ↓
  JobQueue (Interface)
     ↓
MockJobQueue (Implementation)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | npm workspaces |
| **Backend** | Node.js, Express, TypeScript |
| **Validation** | Zod |
| **Database** | MongoDB (Mongoose ODM) |
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | TailwindCSS |
| **State** | TanStack Query v5 |
| **Infrastructure** | Docker, Terraform (Hetzner + Azure) |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Docker)
- npm 9+

### Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd fasttrack_job_processor
npm install

# Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Configure environment
cd backend
cp .env.example .env  # Edit with your values

# Start development servers
npm run dev:backend   # Terminal 1
npm run dev:frontend  # Terminal 2
```

### Environment Variables

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fasttrack_jobs
WEBHOOK_SECRET=your-super-secret-key-minimum-16-chars
BASE_URL=http://localhost:3001
```

## API Reference

### Create Job

```http
POST /jobs
Content-Type: application/json

{
  "prompt": "Your AI prompt here"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "prompt": "Your AI prompt here",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### List Jobs

```http
GET /jobs?status=PENDING
```

### Get Job by ID

```http
GET /jobs/:id
```

### Webhook Callback (Internal)

```http
POST /webhook/callback
X-Shared-Secret: <WEBHOOK_SECRET>
Content-Type: application/json

{
  "jobId": "507f1f77bcf86cd799439011",
  "result": "AI response here"
}
```

### Simulate Hallucination

```http
POST /jobs/:id/hallucinate
```

## Architecture Decisions

### 1. Modular Monolith Pattern

**Decision**: Use a Modular Monolith instead of microservices.

**Rationale**:
- Simpler development and debugging
- No network overhead between services
- Easy to extract into microservices later
- Clear module boundaries via layered architecture

### 2. Job Queue Abstraction

**Decision**: Define `JobQueueInterface` with swappable implementations.

```typescript
interface JobQueueInterface {
  enqueue(jobId: string): Promise<void>;
  shutdown(): Promise<void>;
}
```

**Rationale**:
- `MockJobQueue` uses `setTimeout` for development
- Can replace with `BullMQJobQueue` (Redis) for production
- **No changes required** in controllers or services

### 3. Repository Pattern

**Decision**: Separate data access into Repository classes.

**Rationale**:
- Database-agnostic business logic
- Easy to switch from MongoDB to PostgreSQL
- Simplified unit testing with mocks

### 4. Polling over WebSockets

**Decision**: Use TanStack Query's `refetchInterval` instead of WebSockets.

**Rationale**:
- Simpler infrastructure (no WebSocket server needed)
- Automatic pause when tab is unfocused
- Built-in retry and error handling
- Sufficient for job status updates

### 5. Webhook-based Completion

**Decision**: Workers call back via HTTP webhook instead of direct DB update.

**Rationale**:
- Works with external services (n8n, actual AI APIs)
- Decouples worker from database
- Enables future distributed processing
- Maintains audit trail of external calls

## Scaling Guide

### Current Limitations (Mock Implementation)

⚠️ **Important**: The `MockJobQueue` has these trade-offs:

1. **Jobs lost on restart**: `setTimeout` timers don't persist
2. **Single server only**: In-memory queue can't scale horizontally
3. **No retry mechanism**: Failed jobs stay failed

### Production Upgrade Path

#### Step 1: Replace MockJobQueue with BullMQ

```typescript
// src/queue/bullmq-job-queue.ts
import { Queue, Worker } from 'bullmq';

export class BullMQJobQueue implements JobQueueInterface {
  private queue: Queue;
  
  constructor(config: JobQueueConfig) {
    this.queue = new Queue('jobs', {
      connection: { host: 'redis', port: 6379 }
    });
  }
  
  async enqueue(jobId: string): Promise<void> {
    await this.queue.add('process', { jobId });
  }
}
```

#### Step 2: Add Redis

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

#### Step 3: Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Database Scaling

For MongoDB:
1. Add replica set for high availability
2. Use Atlas for managed scaling
3. Add indexes for common queries (already included)

## Deployment

### Docker Compose (Recommended)

```bash
cd infra
docker-compose up -d
```

### Terraform (Hetzner + Azure)

```bash
cd infra/terraform

# Copy and configure variables
cp terraform.tfvars.template terraform.tfvars
# Edit terraform.tfvars with your values

# Deploy
terraform init
terraform plan
terraform apply
```

**Infrastructure Created**:
- Hetzner CX21 server (~€6/month)
- Azure OpenAI Service (pay-per-use)

### Manual Deployment

1. Build backend: `cd backend && npm run build`
2. Build frontend: `cd frontend && npm run build`
3. Copy `backend/dist` and `frontend/dist` to server
4. Configure nginx reverse proxy
5. Run with PM2 or systemd

## Development

### Project Structure

```
fasttrack_job_processor/
├── backend/
│   ├── src/
│   │   ├── config/      # Environment & database config
│   │   ├── controllers/ # HTTP layer
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Mongoose schemas
│   │   ├── queue/       # Job queue abstraction
│   │   ├── repositories/# Data access layer
│   │   ├── routes/      # Express routes
│   │   ├── schemas/     # Zod validation
│   │   ├── services/    # Business logic
│   │   ├── app.ts       # Express app setup
│   │   └── index.ts     # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── infra/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── terraform/
│       ├── main.tf
│       └── terraform.tfvars.template
├── package.json         # Root workspace config
└── README.md
```

### Commands

```bash
# Root level
npm install             # Install all workspaces
npm run dev             # Run all dev servers
npm run build           # Build all packages

# Backend specific
npm run dev:backend     # Start backend dev server
npm run typecheck -w backend

# Frontend specific
npm run dev:frontend    # Start frontend dev server
npm run typecheck -w frontend
```

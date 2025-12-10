import express, { Express } from 'express';
import cors from 'cors';

import { JobRepository } from './repositories/job.repository.js';
import { JobService } from './services/job.service.js';
import { JobController } from './controllers/job.controller.js';
import type { JobQueueInterface } from './queue/index.js';
import { MockJobQueue } from './queue/index.js';
import { MockAIProcessor } from './processors/index.js';
import { createJobRoutes } from './routes/job.routes.js';
import { createWebhookRoutes } from './routes/webhook.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { env } from './config/env.js';

/**
 * Application Container
 * 
 * Architecture Note: This file sets up dependency injection manually.
 * For larger applications, consider using a DI container like tsyringe or InversifyJS.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    DEPENDENCY INJECTION SETUP                          │
 * │                                                                         │
 * │  To integrate real AI, replace MockAIProcessor with:                   │
 * │  • N8NProcessor        - n8n webhook integration                       │
 * │  • AzureOpenAIProcessor - Azure OpenAI Service                         │
 * │  • OpenAIProcessor     - Direct OpenAI API                             │
 * │                                                                         │
 * │  To scale the queue, replace MockJobQueue with:                        │
 * │  • BullMQJobQueue      - Redis-backed queue with persistence           │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export interface AppContainer {
  app: Express;
  jobQueue: JobQueueInterface;
}

export function createApp(): AppContainer {
  const app = express();

  // Middleware
  app.use(cors({
    origin: env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] // TODO: Configure for production
      : '*',
    credentials: true,
  }));
  app.use(express.json());

  // Request logging (simple, non-production logger)
  app.use((req, _res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DEPENDENCY INJECTION SETUP
  // ═══════════════════════════════════════════════════════════════════════

  // 1. Repository Layer (Data Access)
  const jobRepository = new JobRepository();

  // 2. AI Processor (EXTENSION POINT - replace for production)
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │  REPLACE THIS to integrate real AI:                                 │
  // │                                                                     │
  // │  const aiProcessor = new N8NProcessor({                             │
  // │    webhookUrl: 'https://n8n.example.com/webhook/process',           │
  // │    apiKey: env.N8N_API_KEY,                                         │
  // │  });                                                                │
  // │                                                                     │
  // │  OR:                                                                │
  // │                                                                     │
  // │  const aiProcessor = new AzureOpenAIProcessor({                     │
  // │    endpoint: env.AZURE_OPENAI_ENDPOINT,                             │
  // │    apiKey: env.AZURE_OPENAI_KEY,                                    │
  // │    deploymentName: 'gpt-4',                                         │
  // │  });                                                                │
  // └─────────────────────────────────────────────────────────────────────┘
  const aiProcessor = new MockAIProcessor({
    baseDelayMs: 5000,    // 5 seconds base delay (per spec)
    randomDelayMs: 1000,  // + 0-1s random variation
  });

  // 3. Job Queue (handles async processing flow)
  const jobQueue = new MockJobQueue(
    {
      webhookCallbackUrl: `${env.BASE_URL}/webhook/callback`,
      webhookSecret: env.WEBHOOK_SECRET,
      // Callback to fetch job prompt from database
      promptFetcher: async (jobId: string) => {
        const job = await jobRepository.findById(jobId);
        return job?.prompt ?? null;
      },
    },
    aiProcessor
  );

  // 4. Service Layer (Business Logic)
  const jobService = new JobService(jobRepository, jobQueue);

  // 5. Controller Layer (HTTP)
  const jobController = new JobController(jobService);

  // ═══════════════════════════════════════════════════════════════════════
  // ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/jobs', createJobRoutes(jobController));
  app.use('/webhook', createWebhookRoutes(jobController));

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, jobQueue };
}

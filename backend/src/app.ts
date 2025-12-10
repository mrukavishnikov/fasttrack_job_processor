import express, { Express } from 'express';
import cors from 'cors';

import { JobRepository } from './repositories/job.repository.js';
import { JobService } from './services/job.service.js';
import { JobController } from './controllers/job.controller.js';
import type { JobQueueInterface } from './queue/index.js';
import { MockJobQueue } from './queue/index.js';
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
 * The container pattern makes it easy to:
 * - Swap implementations (MockJobQueue -> BullMQJobQueue)
 * - Mock dependencies for testing
 * - Manage lifecycle of services
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

  // Dependency Injection Setup
  // Architecture Note: Replace MockJobQueue with BullMQJobQueue for production
  const jobQueue = new MockJobQueue({
    processingDelayMs: 5000, // 5 seconds as per spec
    webhookCallbackUrl: `${env.BASE_URL}/webhook/callback`,
    webhookSecret: env.WEBHOOK_SECRET,
  });

  const jobRepository = new JobRepository();
  const jobService = new JobService(jobRepository, jobQueue);
  const jobController = new JobController(jobService);

  // Routes
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


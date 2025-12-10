import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { validateBody } from '../middleware/validate.js';
import { webhookCallbackSchema } from '../schemas/job.schema.js';
import { webhookAuth } from '../middleware/webhook-auth.js';

/**
 * Creates webhook routes with authentication.
 * These routes are called by external services (n8n, mock worker).
 */
export function createWebhookRoutes(jobController: JobController): Router {
  const router = Router();

  // POST /webhook/callback - Receive job completion notification
  // Protected by X-Shared-Secret header
  router.post(
    '/callback',
    webhookAuth,
    validateBody(webhookCallbackSchema),
    jobController.webhookCallback
  );

  return router;
}


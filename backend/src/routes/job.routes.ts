import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createJobSchema, jobStatusQuerySchema } from '../schemas/job.schema.js';

/**
 * Creates job routes with the given controller.
 * Uses dependency injection for testability.
 */
export function createJobRoutes(jobController: JobController): Router {
  const router = Router();

  // GET /jobs/stats - Must be before /:id to avoid conflict
  router.get('/stats', jobController.getStats);

  // GET /jobs - List all jobs
  router.get(
    '/',
    validateQuery(jobStatusQuerySchema),
    jobController.getAllJobs
  );

  // POST /jobs - Create new job
  router.post(
    '/',
    validateBody(createJobSchema),
    jobController.createJob
  );

  // GET /jobs/:id - Get single job
  router.get('/:id', jobController.getJob);

  // DELETE /jobs/:id - Delete job
  router.delete('/:id', jobController.deleteJob);

  // POST /jobs/:id/hallucinate - Simulate hallucination
  router.post('/:id/hallucinate', jobController.simulateHallucination);

  return router;
}


import type { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service.js';
import type { CreateJobInput, WebhookCallbackInput } from '../schemas/job.schema.js';
import type { JobStatusType } from '../models/job.model.js';
import { ApiError } from '../middleware/error-handler.js';

/**
 * Job Controller - HTTP Layer
 * 
 * Architecture Note: Controllers are thin - they only:
 * 1. Extract data from the request
 * 2. Call the service
 * 3. Format the response
 * 
 * Business logic lives in services, not here.
 */
export class JobController {
  constructor(private jobService: JobService) {}

  /**
   * POST /jobs
   * Creates a new job and enqueues it for processing.
   */
  createJob = async (
    req: Request<unknown, unknown, CreateJobInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { prompt } = req.body;
      const job = await this.jobService.createJob(prompt);

      res.status(201).json({
        success: true,
        data: {
          _id: job._id,
          prompt: job.prompt,
          status: job.status,
          createdAt: job.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /jobs/:id
   * Retrieves a single job by ID.
   */
  getJob = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const job = await this.jobService.getJob(id);

      if (!job) {
        throw new ApiError(404, 'Job not found');
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /jobs
   * Retrieves all jobs, optionally filtered by status.
   */
  getAllJobs = async (
    req: Request<unknown, unknown, unknown, { status?: JobStatusType }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status } = req.query;
      const jobs = await this.jobService.getAllJobs(status);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /webhook/callback
   * Handles callback from the job worker.
   * Updates job status based on result or error.
   */
  webhookCallback = async (
    req: Request<unknown, unknown, WebhookCallbackInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { jobId, result, error } = req.body;
      const job = await this.jobService.handleWebhookCallback(jobId, result, error);

      if (!job) {
        throw new ApiError(404, 'Job not found');
      }

      res.json({
        success: true,
        data: {
          _id: job._id,
          status: job.status,
          updatedAt: job.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /jobs/:id/hallucinate
   * Simulates an AI hallucination (malformed response).
   * For testing frontend error handling.
   */
  simulateHallucination = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const job = await this.jobService.simulateHallucination(id);

      if (!job) {
        throw new ApiError(404, 'Job not found');
      }

      res.json({
        success: true,
        message: 'Hallucination simulated - job now has malformed result',
        data: job,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /jobs/stats
   * Returns job statistics.
   */
  getStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.jobService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /jobs/:id
   * Deletes a job.
   */
  deleteJob = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.jobService.deleteJob(id);

      if (!deleted) {
        throw new ApiError(404, 'Job not found');
      }

      res.json({
        success: true,
        message: 'Job deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}


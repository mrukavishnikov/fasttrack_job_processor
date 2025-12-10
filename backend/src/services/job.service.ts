import { JobRepository } from '../repositories/job.repository.js';
import type { JobQueueInterface } from '../queue/job-queue.interface.js';
import { type IJob, JobStatus, type JobStatusType, type JobMetadata } from '../models/job.model.js';

/**
 * Job Service - Business Logic Layer
 * 
 * Architecture Note: This service orchestrates job operations.
 * Uses dependency injection for repository and queue - easily mockable for tests.
 * 
 * The service doesn't know about Express or HTTP - it's framework-agnostic.
 * This allows reuse in CLI tools, scheduled tasks, or different web frameworks.
 */
export class JobService {
  constructor(
    private jobRepository: JobRepository,
    private jobQueue: JobQueueInterface
  ) {}

  /**
   * Creates a new job and enqueues it for processing.
   * Returns the created job (with PENDING status).
   */
  async createJob(prompt: string): Promise<IJob> {
    // Create job in database
    const job = await this.jobRepository.create(prompt);
    
    // Enqueue for async processing
    await this.jobQueue.enqueue(job._id.toString());
    
    return job;
  }

  /**
   * Retrieves a job by ID.
   * Returns null if not found.
   */
  async getJob(id: string): Promise<IJob | null> {
    return await this.jobRepository.findById(id);
  }

  /**
   * Retrieves all jobs, optionally filtered by status.
   */
  async getAllJobs(status?: JobStatusType): Promise<IJob[]> {
    return await this.jobRepository.findAll(status);
  }

  /**
   * Handles webhook callback from the worker.
   * Updates job status based on result or error.
   * 
   * Note: Only updates jobs that are still PENDING to avoid overwriting
   * manually triggered status changes (e.g., hallucination simulation).
   */
  async handleWebhookCallback(
    jobId: string,
    result?: string,
    error?: string
  ): Promise<IJob | null> {
    // Check if job is still pending before updating
    const existingJob = await this.jobRepository.findById(jobId);
    if (!existingJob) {
      return null;
    }
    
    // Don't overwrite if job was already processed (e.g., hallucination simulation)
    if (existingJob.status !== JobStatus.PENDING) {
      console.log(`⏭️ Job ${jobId} already processed (status: ${existingJob.status}), skipping callback`);
      return existingJob;
    }

    const status: JobStatusType = error ? JobStatus.FAILED : JobStatus.COMPLETED;
    
    // Mock metadata - in production, this would come from actual AI API response
    const metadata: JobMetadata = {
      promptTokens: Math.floor(Math.random() * 100) + 10,
      completionTokens: Math.floor(Math.random() * 200) + 50,
      totalTokens: 0,
      estimatedCost: 0,
    };
    metadata.totalTokens = (metadata.promptTokens || 0) + (metadata.completionTokens || 0);
    metadata.estimatedCost = metadata.totalTokens * 0.00002; // Mock cost calculation

    return await this.jobRepository.updateStatus(
      jobId,
      status,
      result || null,
      error || null,
      metadata
    );
  }

  /**
   * Simulates a "hallucination" - returns malformed data.
   * Used for testing frontend error handling.
   */
  async simulateHallucination(jobId: string): Promise<IJob | null> {
    return await this.jobRepository.updateStatus(
      jobId,
      JobStatus.COMPLETED,
      '{"invalid_json": this is not valid', // Intentionally malformed
      null
    );
  }

  /**
   * Gets statistics about jobs.
   */
  async getStats(): Promise<Record<JobStatusType, number>> {
    return await this.jobRepository.countByStatus();
  }

  /**
   * Deletes a job.
   */
  async deleteJob(id: string): Promise<boolean> {
    return await this.jobRepository.delete(id);
  }
}


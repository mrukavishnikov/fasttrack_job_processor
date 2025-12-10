import { z } from 'zod';
import { JobStatus } from '../models/job.model.js';

/**
 * Zod schemas for request validation.
 * Provides type-safe validation with helpful error messages.
 */

export const createJobSchema = z.object({
  prompt: z
    .string({ required_error: 'Prompt is required' })
    .min(1, 'Prompt cannot be empty')
    .max(10000, 'Prompt cannot exceed 10000 characters'),
});

export const webhookCallbackSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  result: z.string().optional(),
  error: z.string().optional(),
}).refine(
  (data) => data.result !== undefined || data.error !== undefined,
  { message: 'Either result or error must be provided' }
);

export const jobIdParamSchema = z.object({
  id: z.string().length(24, 'Invalid job ID format'),
});

export const jobStatusQuerySchema = z.object({
  status: z.enum([JobStatus.PENDING, JobStatus.COMPLETED, JobStatus.FAILED]).optional(),
});

// Type exports for use in controllers
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type WebhookCallbackInput = z.infer<typeof webhookCallbackSchema>;


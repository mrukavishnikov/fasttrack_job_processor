/**
 * Job status enum matching backend definition.
 */
export const JobStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus];

/**
 * Job metadata for cost tracking.
 */
export interface JobMetadata {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
}

/**
 * Job entity from API.
 */
export interface Job {
  _id: string;
  prompt: string;
  status: JobStatusType;
  result: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: JobMetadata;
}

/**
 * API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
}

/**
 * Create job input.
 */
export interface CreateJobInput {
  prompt: string;
}

/**
 * Job statistics.
 */
export interface JobStats {
  PENDING: number;
  COMPLETED: number;
  FAILED: number;
}


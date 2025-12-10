import { ApiResponse, Job, CreateJobInput, JobStats, JobStatusType } from '../types/job';

/**
 * API Base URL
 * Uses Vite proxy in development (/api -> backend)
 */
const BASE_URL = '/api';

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.details
    );
  }

  return data;
}

/**
 * Job API Client
 */
export const jobApi = {
  /**
   * Creates a new job.
   */
  async create(input: CreateJobInput): Promise<Job> {
    const response = await apiFetch<ApiResponse<Job>>('/jobs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  },

  /**
   * Retrieves all jobs.
   */
  async getAll(status?: JobStatusType): Promise<Job[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiFetch<ApiResponse<Job[]>>(`/jobs${params}`);
    return response.data;
  },

  /**
   * Retrieves a single job by ID.
   */
  async getById(id: string): Promise<Job> {
    const response = await apiFetch<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Retrieves job statistics.
   */
  async getStats(): Promise<JobStats> {
    const response = await apiFetch<ApiResponse<JobStats>>('/jobs/stats');
    return response.data;
  },

  /**
   * Deletes a job.
   */
  async delete(id: string): Promise<void> {
    await apiFetch<ApiResponse<null>>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Simulates AI hallucination (malformed response).
   */
  async simulateHallucination(id: string): Promise<Job> {
    const response = await apiFetch<ApiResponse<Job>>(`/jobs/${id}/hallucinate`, {
      method: 'POST',
    });
    return response.data;
  },
};


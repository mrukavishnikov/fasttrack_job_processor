import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi } from '../api/client';
import { CreateJobInput, JobStatusType } from '../types/job';
import toast from 'react-hot-toast';

/**
 * Query Keys for React Query cache management.
 */
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (status?: JobStatusType) => [...jobKeys.lists(), { status }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  stats: () => [...jobKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch all jobs with polling.
 * 
 * Architecture Note: Uses refetchInterval for polling which automatically
 * pauses when the browser tab is not focused (better UX and performance).
 * 
 * @param status - Optional filter by job status
 * @param pollingInterval - Interval in ms for polling (default: 3000)
 */
export function useJobs(status?: JobStatusType, pollingInterval = 3000) {
  return useQuery({
    queryKey: jobKeys.list(status),
    queryFn: () => jobApi.getAll(status),
    refetchInterval: pollingInterval, // Auto-polling
    refetchIntervalInBackground: false, // Pauses when tab is not focused
  });
}

/**
 * Hook to fetch a single job.
 */
export function useJob(id: string, enabled = true) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobApi.getById(id),
    enabled,
  });
}

/**
 * Hook to fetch job statistics.
 */
export function useJobStats(pollingInterval = 3000) {
  return useQuery({
    queryKey: jobKeys.stats(),
    queryFn: () => jobApi.getStats(),
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to create a new job.
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => jobApi.create(input),
    onSuccess: (job) => {
      toast.success(`Job created: ${job._id.slice(-6)}`);
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.stats() });
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a job.
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobApi.delete(id),
    onSuccess: () => {
      toast.success('Job deleted');
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.stats() });
    },
    onError: (error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });
}

/**
 * Hook to simulate AI hallucination.
 */
export function useSimulateHallucination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobApi.simulateHallucination(id),
    onSuccess: () => {
      toast('🤖 Hallucination simulated!', { icon: '⚠️' });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (error) => {
      toast.error(`Simulation failed: ${error.message}`);
    },
  });
}


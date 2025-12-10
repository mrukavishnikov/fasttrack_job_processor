import { useState } from 'react';
import clsx from 'clsx';
import { Job, JobStatus } from '../types/job';
import { useDeleteJob, useSimulateHallucination } from '../hooks/useJobs';

interface JobCardProps {
  job: Job;
}

/**
 * Job Card Component
 * 
 * Displays a single job with its status, prompt, and result.
 * Provides actions for simulation and deletion.
 */
export function JobCard({ job }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteJob = useDeleteJob();
  const simulateHallucination = useSimulateHallucination();

  const isPending = job.status === JobStatus.PENDING;
  const isCompleted = job.status === JobStatus.COMPLETED;
  const isFailed = job.status === JobStatus.FAILED;

  // Check if result appears to be malformed (hallucination)
  const hasHallucination = Boolean(job.result && job.result.includes('{') && !isValidJson(job.result));

  return (
    <div 
      className={clsx(
        'bg-surface-800 rounded-lg border transition-all duration-300 animate-slide-in',
        isPending && 'border-yellow-500/50',
        isCompleted && !hasHallucination && 'border-green-500/50',
        isCompleted && hasHallucination && 'border-orange-500/50',
        isFailed && 'border-red-500/50'
      )}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-surface-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Status Badge */}
            <StatusBadge status={job.status} hasHallucination={hasHallucination} />
            
            {/* Job ID */}
            <code className="text-xs text-gray-500 font-mono">
              #{job._id.slice(-6)}
            </code>
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 shrink-0">
            {formatDate(job.createdAt)}
          </span>
        </div>

        {/* Prompt Preview */}
        <p className="mt-3 text-sm text-gray-300 line-clamp-2">
          {job.prompt}
        </p>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-surface-600 p-4 space-y-4">
          {/* Full Prompt */}
          <div>
            <label className="text-xs text-neon-cyan uppercase tracking-wider">Prompt</label>
            <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">
              {job.prompt}
            </p>
          </div>

          {/* Result / Error */}
          {job.result && (
            <div>
              <label className="text-xs text-neon-cyan uppercase tracking-wider flex items-center gap-2">
                Result
                {hasHallucination && (
                  <span className="text-orange-400 text-[10px] bg-orange-400/20 px-2 py-0.5 rounded">
                    ⚠️ HALLUCINATION DETECTED
                  </span>
                )}
              </label>
              <pre className={clsx(
                'mt-1 text-sm whitespace-pre-wrap p-3 rounded bg-surface-900',
                hasHallucination ? 'text-orange-300' : 'text-green-300'
              )}>
                {job.result}
              </pre>
            </div>
          )}

          {job.error && (
            <div>
              <label className="text-xs text-red-400 uppercase tracking-wider">Error</label>
              <pre className="mt-1 text-sm text-red-300 whitespace-pre-wrap p-3 rounded bg-surface-900">
                {job.error}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {job.metadata && job.metadata.totalTokens && (
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Tokens: {job.metadata.totalTokens}</span>
              <span>Cost: ${job.metadata.estimatedCost?.toFixed(6)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isPending && (
              <button
                onClick={() => simulateHallucination.mutate(job._id)}
                disabled={simulateHallucination.isPending}
                className="px-3 py-1.5 text-xs bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              >
                🤖 Simulate Hallucination
              </button>
            )}
            <button
              onClick={() => deleteJob.mutate(job._id)}
              disabled={deleteJob.isPending}
              className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status, hasHallucination }: { status: string; hasHallucination: boolean }) {
  return (
    <span className={clsx(
      'px-2 py-1 text-xs font-bold rounded uppercase tracking-wider',
      status === JobStatus.PENDING && 'status-pending text-surface-900',
      status === JobStatus.COMPLETED && !hasHallucination && 'status-completed text-surface-900',
      status === JobStatus.COMPLETED && hasHallucination && 'bg-orange-500 text-surface-900',
      status === JobStatus.FAILED && 'status-failed text-white'
    )}>
      {hasHallucination ? '⚠️ HALLUCINATED' : status}
    </span>
  );
}

/**
 * Helper to format date.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Helper to check if string is valid JSON.
 */
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}


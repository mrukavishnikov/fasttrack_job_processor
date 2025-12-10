import { useState } from 'react';
import clsx from 'clsx';
import { useJobs, useJobStats } from '../hooks/useJobs';
import { JobCard } from './JobCard';
import { JobStatus, JobStatusType } from '../types/job';

/**
 * Job List Component
 * 
 * Displays all jobs with filtering and real-time polling.
 */
export function JobList() {
  const [filter, setFilter] = useState<JobStatusType | undefined>(undefined);
  const { data: jobs, isLoading, isError, error, isFetching } = useJobs(filter);
  const { data: stats } = useJobStats();

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard 
            label="Pending" 
            value={stats.PENDING} 
            color="yellow"
            isActive={filter === JobStatus.PENDING}
            onClick={() => setFilter(filter === JobStatus.PENDING ? undefined : JobStatus.PENDING)}
          />
          <StatCard 
            label="Completed" 
            value={stats.COMPLETED} 
            color="green"
            isActive={filter === JobStatus.COMPLETED}
            onClick={() => setFilter(filter === JobStatus.COMPLETED ? undefined : JobStatus.COMPLETED)}
          />
          <StatCard 
            label="Failed" 
            value={stats.FAILED} 
            color="red"
            isActive={filter === JobStatus.FAILED}
            onClick={() => setFilter(filter === JobStatus.FAILED ? undefined : JobStatus.FAILED)}
          />
        </div>
      )}

      {/* Header with Polling Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-gray-200">
          Job Queue
          {filter && (
            <span className="ml-2 text-sm text-gray-500">
              (filtered: {filter})
            </span>
          )}
        </h2>
        
        <div className="flex items-center gap-3">
          {filter && (
            <button
              onClick={() => setFilter(undefined)}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Clear filter
            </button>
          )}
          
          {/* Polling Indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={clsx(
              'w-2 h-2 rounded-full',
              isFetching ? 'bg-neon-cyan animate-pulse' : 'bg-gray-600'
            )} />
            {isFetching ? 'Syncing...' : 'Live'}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-400">Loading jobs...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">Error loading jobs: {error.message}</p>
        </div>
      )}

      {!isLoading && !isError && jobs && jobs.length === 0 && (
        <div className="bg-surface-800 rounded-lg border border-surface-600 p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400">
            {filter 
              ? `No ${filter.toLowerCase()} jobs found.`
              : 'No jobs yet. Create your first job above!'
            }
          </p>
        </div>
      )}

      {!isLoading && !isError && jobs && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string;
  value: number;
  color: 'yellow' | 'green' | 'red';
  isActive: boolean;
  onClick: () => void;
}

function StatCard({ label, value, color, isActive, onClick }: StatCardProps) {
  const colorClasses = {
    yellow: 'from-yellow-500 to-amber-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-rose-500',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'bg-surface-800 rounded-lg p-4 text-left transition-all duration-300',
        'hover:bg-surface-700',
        isActive 
          ? 'ring-2 ring-neon-cyan ring-offset-2 ring-offset-surface-900' 
          : 'border border-surface-600'
      )}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={clsx(
        'text-3xl font-display font-bold bg-gradient-to-r bg-clip-text text-transparent',
        colorClasses[color]
      )}>
        {value}
      </p>
    </button>
  );
}


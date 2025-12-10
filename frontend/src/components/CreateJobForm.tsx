import { useState, FormEvent } from 'react';
import { useCreateJob } from '../hooks/useJobs';

/**
 * Create Job Form Component
 * 
 * Allows users to submit new prompts for processing.
 */
export function CreateJobForm() {
  const [prompt, setPrompt] = useState('');
  const createJob = useCreateJob();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    createJob.mutate(
      { prompt: prompt.trim() },
      {
        onSuccess: () => {
          setPrompt('');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-800 rounded-lg neon-border p-6">
      <label htmlFor="prompt" className="block text-sm font-display text-neon-cyan mb-3">
        New Job Prompt
      </label>
      
      <div className="space-y-4">
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt for AI processing..."
          rows={4}
          className="w-full px-4 py-3 bg-surface-900 border border-surface-600 rounded-lg 
                     text-gray-200 placeholder-gray-500 resize-none
                     focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan
                     transition-all"
          disabled={createJob.isPending}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {prompt.length} / 10,000 characters
          </span>

          <button
            type="submit"
            disabled={!prompt.trim() || createJob.isPending}
            className="px-6 py-2.5 bg-gradient-to-r from-neon-cyan to-cyan-400 text-surface-900 
                       font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                       hover:shadow-lg hover:shadow-neon-cyan/25 transition-all duration-300
                       flex items-center gap-2"
          >
            {createJob.isPending ? (
              <>
                <Spinner />
                Processing...
              </>
            ) : (
              <>
                <span className="text-lg">⚡</span>
                Submit Job
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Loading Spinner
 */
function Spinner() {
  return (
    <svg 
      className="animate-spin h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}


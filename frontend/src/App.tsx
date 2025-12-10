import { CreateJobForm } from './components/CreateJobForm';
import { JobList } from './components/JobList';

/**
 * Main Application Component
 * 
 * Renders the Job Processor dashboard with form and job list.
 */
function App() {
  return (
    <div className="min-h-screen grid-pattern">
      {/* Header */}
      <header className="border-b border-surface-700 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white">
                  FAST TRACK
                </h1>
                <p className="text-xs text-gray-500 tracking-widest">
                  JOB PROCESSOR v1.0
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-gray-400">Connected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Create Job Section */}
        <section>
          <CreateJobForm />
        </section>

        {/* Job List Section */}
        <section>
          <JobList />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-700 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-600">
          <p>
            Built with React + TypeScript + TanStack Query • 
            Mock Worker simulates 5s async processing
          </p>
          <p className="mt-1">
            Architecture: Modular Monolith • Ready for Microservices Extraction
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;


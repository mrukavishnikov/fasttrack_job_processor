/**
 * Job Queue Interface
 * 
 * Architecture Note: This interface defines the contract for job processing.
 * The current implementation uses setTimeout (MockJobQueue).
 * 
 * TODO: Replace in-memory queue with Redis/BullMQ for production.
 * To scale:
 * 1. Create a new class implementing this interface (e.g., BullMQJobQueue)
 * 2. Use dependency injection to swap implementations
 * 3. No changes needed in controllers or services
 * 
 * Benefits of this abstraction:
 * - Easy testing with mock implementations
 * - Hot-swappable queue backends
 * - Clear separation of concerns
 */
export interface JobQueueInterface {
  /**
   * Enqueues a job for processing.
   * @param jobId - The MongoDB ObjectId of the job to process
   * @returns Promise that resolves when the job is enqueued (not completed)
   */
  enqueue(jobId: string): Promise<void>;

  /**
   * Gracefully shuts down the queue.
   * Cleans up any pending timers or connections.
   */
  shutdown(): Promise<void>;
}

/**
 * Configuration for job processing.
 */
export interface JobQueueConfig {
  /** URL to call when job processing completes */
  webhookCallbackUrl: string;
  /** Secret for webhook authentication */
  webhookSecret: string;
  /** Function to fetch job prompt by ID (for AI processing) */
  promptFetcher: (jobId: string) => Promise<string | null>;
}


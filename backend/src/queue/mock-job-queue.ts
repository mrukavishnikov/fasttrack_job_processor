import type { JobQueueInterface, JobQueueConfig } from './job-queue.interface.js';

/**
 * Mock Job Queue Implementation
 * 
 * Uses setTimeout to simulate async job processing.
 * After the delay, calls the webhook endpoint to report completion.
 * 
 * IMPORTANT LIMITATION (Trade-off of Mock approach):
 * If the backend restarts during the 5-second wait, pending jobs will be lost.
 * This is acceptable for development/demo purposes.
 * 
 * TODO: For production, implement BullMQJobQueue with Redis persistence:
 * - Jobs survive server restarts
 * - Horizontal scaling with multiple workers
 * - Built-in retry mechanisms
 * - Job progress tracking
 */
export class MockJobQueue implements JobQueueInterface {
  private pendingTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: JobQueueConfig;

  constructor(config: JobQueueConfig) {
    this.config = config;
    console.log('🔧 MockJobQueue initialized (in-memory, non-persistent)');
  }

  /**
   * Enqueues a job for processing.
   * Sets a timer that will call the webhook after processingDelayMs.
   */
  async enqueue(jobId: string): Promise<void> {
    console.log(`📥 Job ${jobId} enqueued, processing in ${this.config.processingDelayMs}ms`);

    const timer = setTimeout(async () => {
      await this.processJob(jobId);
      this.pendingTimers.delete(jobId);
    }, this.config.processingDelayMs);

    this.pendingTimers.set(jobId, timer);
  }

  /**
   * Processes a job by calling the webhook callback.
   * Simulates AI response generation.
   */
  private async processJob(jobId: string): Promise<void> {
    console.log(`⚙️ Processing job ${jobId}...`);

    try {
      // Simulate AI response (in real implementation, this would call Azure OpenAI)
      const mockResult = this.generateMockResponse(jobId);
      
      // Call the webhook to report completion
      const response = await fetch(this.config.webhookCallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shared-Secret': this.config.webhookSecret,
        },
        body: JSON.stringify({
          jobId,
          result: mockResult,
        }),
      });

      if (!response.ok) {
        console.error(`❌ Webhook callback failed for job ${jobId}: ${response.status}`);
      } else {
        console.log(`✅ Job ${jobId} completed successfully`);
      }
    } catch (error) {
      console.error(`❌ Error processing job ${jobId}:`, error);
      
      // Report failure to webhook
      try {
        await fetch(this.config.webhookCallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shared-Secret': this.config.webhookSecret,
          },
          body: JSON.stringify({
            jobId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        });
      } catch (webhookError) {
        console.error(`❌ Failed to report error for job ${jobId}:`, webhookError);
      }
    }
  }

  /**
   * Generates a mock AI response.
   * In production, this would be replaced by actual Azure OpenAI API call.
   */
  private generateMockResponse(jobId: string): string {
    const responses = [
      'Based on my analysis, here are the key insights...',
      'The data suggests multiple pathways forward. Consider these options...',
      'After processing your request, I recommend the following approach...',
      'Here is a comprehensive summary of the findings...',
      'The analysis reveals several important patterns that warrant attention...',
    ];
    
    const randomIndex = Math.floor(Math.random() * responses.length);
    return `${responses[randomIndex]} [Mock response for job: ${jobId.slice(-6)}]`;
  }

  /**
   * Gracefully shuts down the queue by canceling all pending timers.
   * Called during application shutdown.
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down MockJobQueue (${this.pendingTimers.size} pending jobs will be lost)`);
    
    for (const [jobId, timer] of this.pendingTimers) {
      clearTimeout(timer);
      console.log(`⚠️ Canceled pending job: ${jobId}`);
    }
    
    this.pendingTimers.clear();
  }
}


import type { JobQueueInterface, JobQueueConfig } from './job-queue.interface.js';
import type { AIProcessorInterface } from '../processors/ai-processor.interface.js';

/**
 * Mock Job Queue Implementation
 * 
 * Simulates the async job processing flow:
 * 
 * ┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────┐
 * │  Client  │───▶│   Queue   │───▶│ AI Processor │───▶│ Webhook │
 * │ (submit) │    │  (async)  │    │ (5s process) │    │(complete)│
 * └──────────┘    └───────────┘    └──────────────┘    └─────────┘
 * 
 * The delay/processing time is controlled by the AIProcessor, not the queue.
 * This allows different processors to have different latencies.
 * 
 * IMPORTANT LIMITATION (Trade-off of Mock approach):
 * If the backend restarts during processing, pending jobs will be lost.
 * This is acceptable for development/demo purposes.
 * 
 * TODO: For production, implement BullMQJobQueue with Redis persistence:
 * - Jobs survive server restarts
 * - Horizontal scaling with multiple workers
 * - Built-in retry mechanisms
 * - Job progress tracking
 */
export class MockJobQueue implements JobQueueInterface {
  private pendingJobs: Set<string> = new Set();
  private config: JobQueueConfig;
  private aiProcessor: AIProcessorInterface;

  constructor(config: JobQueueConfig, aiProcessor: AIProcessorInterface) {
    this.config = config;
    this.aiProcessor = aiProcessor;
    console.log('🔧 MockJobQueue initialized (in-memory, non-persistent)');
  }

  /**
   * Enqueues a job for processing.
   * 
   * Flow:
   * 1. Job enters queue (this method)
   * 2. Immediately starts async processing (non-blocking)
   * 3. AIProcessor handles the job (includes any delays/API calls)
   * 4. POST result to webhook callback
   */
  async enqueue(jobId: string): Promise<void> {
    console.log(`📥 Job ${jobId} enqueued, starting async processing...`);
    
    this.pendingJobs.add(jobId);

    // Process asynchronously (don't await - return immediately to client)
    this.processJob(jobId).finally(() => {
      this.pendingJobs.delete(jobId);
    });
  }

  /**
   * Processes a job:
   * 1. Fetches the prompt
   * 2. Calls AIProcessor
   * 3. Reports result via webhook
   */
  private async processJob(jobId: string): Promise<void> {
    console.log(`⚙️ Processing job ${jobId}...`);

    try {
      // Step 1: Fetch the prompt from database
      const prompt = await this.config.promptFetcher(jobId);
      if (!prompt) {
        throw new Error(`Job ${jobId} not found or has no prompt`);
      }

      // Step 2: Call AI Processor (this is the EXTENSION POINT)
      // Replace MockAIProcessor with real implementation for production
      console.log(`🤖 Calling AI Processor for job ${jobId}...`);
      const aiResult = await this.aiProcessor.process(jobId, prompt);

      // Step 3: Report completion via webhook
      const response = await fetch(this.config.webhookCallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shared-Secret': this.config.webhookSecret,
        },
        body: JSON.stringify({
          jobId,
          result: aiResult.result,
          metadata: aiResult.metadata,
        }),
      });

      if (!response.ok) {
        console.error(`❌ Webhook callback failed for job ${jobId}: ${response.status}`);
      } else {
        console.log(`✅ Job ${jobId} completed (${aiResult.metadata.processingTimeMs}ms, ${aiResult.metadata.totalTokens} tokens)`);
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
   * Gracefully shuts down the queue.
   * Note: In-flight jobs cannot be canceled, they will complete or fail.
   */
  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down MockJobQueue (${this.pendingJobs.size} jobs in progress)`);
    
    if (this.pendingJobs.size > 0) {
      console.log(`⚠️ Jobs still processing: ${[...this.pendingJobs].join(', ')}`);
    }
    
    this.pendingJobs.clear();
  }
}

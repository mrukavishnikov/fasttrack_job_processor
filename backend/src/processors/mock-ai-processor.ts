import type { AIProcessorInterface, AIProcessingResult } from './ai-processor.interface.js';

/**
 * Mock AI Processor Configuration
 */
export interface MockAIProcessorConfig {
  /** Base delay in milliseconds (default: 5000ms as per spec) */
  baseDelayMs?: number;
  /** Random additional delay range in ms (default: 0-1000ms) */
  randomDelayMs?: number;
}

/**
 * Mock AI Processor
 * 
 * Simulates AI processing with configurable delay and fake responses.
 * The delay simulates real AI API latency.
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  REPLACE THIS CLASS TO INTEGRATE REAL AI                       │
 * │                                                                 │
 * │  Options:                                                       │
 * │  • N8NProcessor      - Call n8n webhook workflow                │
 * │  • AzureOpenAIProcessor - Azure OpenAI Service                  │
 * │  • OpenAIProcessor   - Direct OpenAI API                        │
 * │  • AnthropicProcessor - Claude API                              │
 * │  • LangChainProcessor - LangChain orchestration                 │
 * └─────────────────────────────────────────────────────────────────┘
 */
export class MockAIProcessor implements AIProcessorInterface {
  private config: Required<MockAIProcessorConfig>;
  
  private responseTemplates = [
    'Based on my analysis, here are the key insights for your request...',
    'After careful consideration, I recommend the following approach...',
    'The data suggests multiple pathways forward. Consider these options...',
    'Here is a comprehensive summary of the findings based on your prompt...',
    'I have analyzed your request and prepared the following response...',
  ];

  constructor(config: MockAIProcessorConfig = {}) {
    this.config = {
      baseDelayMs: config.baseDelayMs ?? 5000,  // 5 seconds default (per spec)
      randomDelayMs: config.randomDelayMs ?? 1000,
    };
    
    console.log(`🤖 MockAIProcessor initialized (${this.config.baseDelayMs}ms + 0-${this.config.randomDelayMs}ms delay)`);
    console.log('   └── Replace with real processor in app.ts for production');
  }

  /**
   * Simulates AI processing with configurable delay and fake response.
   */
  async process(jobId: string, prompt: string): Promise<AIProcessingResult> {
    const startTime = Date.now();
    
    // Simulate AI processing time
    const totalDelay = this.config.baseDelayMs + Math.floor(Math.random() * this.config.randomDelayMs);
    console.log(`🤖 Processing job ${jobId.slice(-6)}... (simulating ${totalDelay}ms AI latency)`);
    await this.delay(totalDelay);

    // Generate mock response
    const templateIndex = Math.floor(Math.random() * this.responseTemplates.length);
    const template = this.responseTemplates[templateIndex];
    
    // Include some context from the prompt
    const promptPreview = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt;
    const result = `${template}\n\n[Processed prompt: "${promptPreview}"]\n[Job ID: ${jobId.slice(-6)}]`;

    // Calculate mock token counts (roughly 4 chars per token)
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(result.length / 4);
    const totalTokens = promptTokens + completionTokens;

    const processingTimeMs = Date.now() - startTime;

    console.log(`🤖 MockAIProcessor: Generated response for job ${jobId.slice(-6)} (${processingTimeMs}ms)`);

    return {
      result,
      metadata: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost: totalTokens * 0.00003, // ~$0.03 per 1K tokens (GPT-4 pricing)
        model: 'mock-gpt-4',
        processingTimeMs,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Example: N8N Processor (uncomment and modify for your setup)
 * 
 * export class N8NProcessor implements AIProcessorInterface {
 *   constructor(
 *     private webhookUrl: string,
 *     private apiKey: string
 *   ) {}
 * 
 *   async process(jobId: string, prompt: string): Promise<AIProcessingResult> {
 *     const response = await fetch(this.webhookUrl, {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Authorization': `Bearer ${this.apiKey}`,
 *       },
 *       body: JSON.stringify({ jobId, prompt }),
 *     });
 * 
 *     const data = await response.json();
 *     return {
 *       result: data.result,
 *       metadata: data.metadata || { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 },
 *     };
 *   }
 * }
 */


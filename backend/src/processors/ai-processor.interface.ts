/**
 * AI Processor Interface
 * 
 * Architecture Note: This interface defines the contract for AI processing.
 * The processor is responsible for the entire processing lifecycle including
 * any delays, retries, or API calls.
 * 
 * EXTENSION POINT: To integrate with real AI services, implement this interface:
 * 
 * 1. N8N Integration:
 *    class N8NProcessor implements AIProcessorInterface {
 *      async process(jobId, prompt) {
 *        return await fetch('https://n8n.example.com/webhook/ai', { body: { jobId, prompt } });
 *      }
 *    }
 * 
 * 2. Azure OpenAI:
 *    class AzureOpenAIProcessor implements AIProcessorInterface {
 *      async process(jobId, prompt) {
 *        const response = await openai.chat.completions.create({
 *          messages: [{ role: 'user', content: prompt }]
 *        });
 *        return { result: response.choices[0].message.content, metadata: {...} };
 *      }
 *    }
 * 
 * 3. Direct OpenAI:
 *    class OpenAIProcessor implements AIProcessorInterface { ... }
 * 
 * Then inject your implementation in app.ts instead of MockAIProcessor.
 */
export interface AIProcessorInterface {
  /**
   * Processes a prompt and returns AI response.
   * 
   * @param jobId - Job ID for tracking/logging
   * @param prompt - User's input prompt
   * @returns AI processing result
   */
  process(jobId: string, prompt: string): Promise<AIProcessingResult>;
}

/**
 * Result of AI processing.
 */
export interface AIProcessingResult {
  /** The AI-generated response text */
  result: string;
  /** Optional error message if processing failed */
  error?: string;
  /** Token usage metadata for cost tracking */
  metadata: AIProcessingMetadata;
}

/**
 * Metadata from AI processing (for cost tracking).
 */
export interface AIProcessingMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Model used for processing */
  model?: string;
  /** Processing duration in ms */
  processingTimeMs?: number;
}


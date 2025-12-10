import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variables schema with strict validation.
 * Fail fast: Application won't start if required env vars are missing or invalid.
 */
const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/fasttrack_jobs'),
  WEBHOOK_SECRET: z.string().min(16, 'WEBHOOK_SECRET must be at least 16 characters'),
  BASE_URL: z.string().url().default('http://localhost:3001'),
});

// Validate and parse environment variables
const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envParsed.error.format());
  process.exit(1);
}

/**
 * Validated environment configuration.
 * All values are type-safe and guaranteed to exist.
 */
export const env = envParsed.data;

export type Env = z.infer<typeof envSchema>;


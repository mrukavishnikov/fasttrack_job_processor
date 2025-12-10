import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Establishes connection to MongoDB.
 * Architecture Note: Uses Mongoose for ODM capabilities.
 * In production, consider connection pooling and replica sets.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Gracefully closes database connection.
 * Used during shutdown for clean exit.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('📤 Disconnected from MongoDB');
}


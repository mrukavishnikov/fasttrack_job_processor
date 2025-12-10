import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

/**
 * Main Entry Point
 * 
 * Initializes database connection and starts the Express server.
 * Handles graceful shutdown for clean exits.
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Fast Track Job Processor...');
  console.log(`📍 Environment: ${env.NODE_ENV}`);

  // Connect to database
  await connectDatabase();

  // Create application
  const { app, jobQueue } = createApp();

  // Start server
  const server = app.listen(env.PORT, () => {
    console.log(`✅ Server running on http://localhost:${env.PORT}`);
    console.log(`📋 API Documentation:`);
    console.log(`   POST /jobs         - Create a new job`);
    console.log(`   GET  /jobs         - List all jobs`);
    console.log(`   GET  /jobs/:id     - Get job by ID`);
    console.log(`   GET  /jobs/stats   - Get job statistics`);
    console.log(`   POST /webhook/callback - Webhook callback (internal)`);
  });

  // Graceful shutdown handler
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n📤 Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new requests
    server.close(() => {
      console.log('🔌 HTTP server closed');
    });

    // Shutdown job queue
    await jobQueue.shutdown();

    // Disconnect from database
    await disconnectDatabase();

    console.log('👋 Shutdown complete');
    process.exit(0);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});


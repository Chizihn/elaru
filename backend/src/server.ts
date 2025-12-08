import * as dotenv from 'dotenv';
import { createApp } from './app';
import { SyncService } from './services/SyncService';
import logger from './utils/logger';

import { taskDispatcher } from './services/TaskDispatcher';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Create Express app with Apollo Server
    const { app, apolloServer } = await createApp();

    // Start Sync Service
    const syncService = new SyncService();
    logger.info('Starting agent synchronization service...');
    // Run once on startup (in production, use cron or interval)
    syncService.syncAgents();

    // Start Task Dispatcher
    taskDispatcher.startDispatcher();

    // Start listening
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on http://localhost:${PORT}/graphql`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✅ Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

/**
 * Sourcegraph2API - Node.js Entry Point
 * OpenAI API to Sourcegraph AI proxy server
 */

import { startServer } from './app';
import { log, initializeLogger } from './utils/logger';
import { config, loadConfigFromDb } from './config';
import { initializeDatabase } from './services/database';
import dotenv from 'dotenv'; // Import dotenv

/**
 * Main function - start the server
 */
async function main(): Promise<void> {
  try {
    // Load .env file (must be at the very beginning)
    dotenv.config();

    // Initialize logger immediately with basic .env settings
    const debugMode = process.env.DEBUG?.toLowerCase() === 'true' || false;
    const logLevel = process.env.LOG_LEVEL || 'info';
    const nodeEnv = process.env.NODE_ENV || 'production';
    initializeLogger(debugMode, logLevel, nodeEnv);

    // ASCII banner
    log.info(`
╔═══════════════════════════════════════════════════════╗
║              SOURCEGRAPH2API                          ║
║                                                       ║
║                     1.1.4                             ║
║                                                       ║
║     Sourcegraph AI → OpenAI API Proxy Server          ║
║                                                       ║
║     Kerem Gok (hermesthecat)                          ║
║                                                       ║
║     https://github.com/hermesthecat/sourcegraph2api   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

    // Initialize database
    await initializeDatabase();

    // Load settings from database
    await loadConfigFromDb();

    log.info('🚀 Starting server...');

    // Start the server
    await startServer();

  } catch (error: any) {
    log.error(`❌ Startup error: ${error.message}`);
    // Also use console.error in cases where logger might not be working properly
    console.error(error);
    process.exit(1);
  }
}

// Call the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Critical error:', error);
    process.exit(1);
  });
} 
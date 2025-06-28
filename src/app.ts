/**
 * Main Application
 * Express server configuration and middleware setup
 */

import express, { Application, Request, Response } from 'express';
import { config } from './config';
import { log } from './utils/logger';
import { setupRoutes } from './routes';
import path from 'path'; // Import path module
import cookieParser from 'cookie-parser'; // Import cookie-parser
import session from 'express-session'; // Import express-session
import passport from './services/auth.service'; // Import our Passport configuration
import flash from 'connect-flash'; // Import connect-flash
import { sessionStore } from './services/database';

// Middleware imports
import {
  requestId,
  requestLogger,
  corsMiddleware,
  securityMiddleware,
  compressionMiddleware,
  rateLimitMiddleware,
  ipBlacklistMiddleware,
  errorHandler,
  notFoundHandler
} from './middleware';

/**
 * Create and configure the Express application
 */
export function createApp(): Application {
  const app = express();

  // ======================
  // View Engine Setup (EJS)
  // ======================
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'views'));

  // ======================
  // Static Files
  // ======================
  app.use(express.static(path.join(process.cwd(), 'public')));

  // ======================
  // Session & Auth Middleware
  // Order is very important: cookieParser -> session -> passport -> flash
  // ======================
  app.use(cookieParser(config.sessionSecret || 'a-super-secret-key-that-is-long-enough'));
  app.use(session({
    secret: config.sessionSecret || 'a-super-secret-key-that-is-long-enough',
    resave: false,
    saveUninitialized: false, // Don't create session until necessary
    store: sessionStore, // Store sessions in database
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  // Middleware to pass flash messages to all views (EJS)
  app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.user = req.user; // Also pass logged-in user info to views
    next();
  });

  // ======================
  // Trust proxy (for production)
  // ======================
  app.set('trust proxy', true);

  // ======================
  // Global Middleware Stack
  // ======================

  // 1. Request ID - Assigns a unique ID to each request
  app.use(requestId());

  // 2. Request Logging - Logs incoming requests
  app.use(requestLogger());

  // 3. Security - Helmet security headers
  app.use(securityMiddleware());

  // 4. CORS - Cross-origin resource sharing
  app.use(corsMiddleware());

  // 5. Body Parsing - JSON and URL-encoded
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 6. Compression - Response compression
  app.use(compressionMiddleware());

  // 7. IP Blacklist - IP blacklist check
  // @ts-ignore - Express middleware type conflict
  app.use(ipBlacklistMiddleware());

  // 8. Rate Limiting - Request rate control
  // @ts-ignore - Express middleware type conflict
  app.use(rateLimitMiddleware());

  // ======================
  // API Routes Setup
  // ======================
  setupRoutes(app);

  // ======================
  // Error Handling
  // ======================

  // 404 Not Found Handler
  // @ts-ignore - Express middleware type conflict
  app.use(notFoundHandler());

  // Global Error Handler (last)
  // @ts-ignore - Express middleware type conflict  
  app.use(errorHandler());

  return app;
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const port = config.port;
    const host = config.host || '0.0.0.0';

    // Start listening to the server
    const server = app.listen(port, host, () => {
      log.info(`🚀 Sourcegraph2API Server started!`);
      log.info(`📍 Host: ${host}:${port}`);
      log.info(`🌍 Environment: ${config.nodeEnv}`);
      log.info(`🔧 Route Prefix: ${config.routePrefix || 'none'}`);
      log.info(`🛡️  Rate Limit: ${config.requestRateLimit} requests/minute`);
      log.info(`🔍 Debug Mode: ${config.debug ? 'enabled' : 'disabled'}`);

      // List of API endpoints
      log.info(`
📋 Available Endpoints:`);
      log.info(`   GET  /                    - API information`);
      log.info(`   GET  /health              - Health check`);
      log.info(`   GET  /health/detailed     - Detailed health`);
      log.info(`   POST /v1/chat/completions - Chat completion`);
      log.info(`   GET  /v1/models           - Model list`);
      log.info(`   GET  /metrics             - Performance metrics`);
      log.info(`   GET  /metrics/dashboard   - Metrics dashboard\n`);
    });

    // Graceful shutdown handling
    setupGracefulShutdown(server);

  } catch (error: any) {
    log.error(`❌ Server startup error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Graceful shutdown setup
 */
function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    log.info(`
🛑 ${signal} signal received, shutting down server...`);

    server.close((err: any) => {
      if (err) {
        log.error(`❌ Server shutdown error: ${err.message}`);
        process.exit(1);
      }

      log.info('✅ Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      log.error('⏰ Forced shutdown - 30 second timeout');
      process.exit(1);
    }, 30000);
  };

  // Signal handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled errors
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  });

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    process.exit(1);
  });
} 
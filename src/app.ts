/**
 * Main Application
 * Express server konfigürasyonu ve middleware setup
 */

import express, { Application, Request, Response } from 'express';
import { config } from './config';
import { log } from './utils/logger';
import { setupRoutes } from './routes';

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
 * Express uygulamasını oluştur ve yapılandır
 */
export function createApp(): Application {
  const app = express();

  // ======================
  // Trust proxy (production için)
  // ======================
  app.set('trust proxy', true);

  // ======================
  // Global Middleware Stack
  // ======================
  
  // 1. Request ID - Her request'e unique ID atar
  app.use(requestId());
  
  // 2. Request Logging - Gelen istekleri loglar
  app.use(requestLogger());
  
  // 3. Security - Helmet güvenlik headers
  app.use(securityMiddleware());
  
  // 4. CORS - Cross-origin resource sharing
  app.use(corsMiddleware());
  
  // 5. Body Parsing - JSON ve URL-encoded
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // 6. Compression - Response compression
  app.use(compressionMiddleware());
  
  // 7. IP Blacklist - Yasaklı IP kontrolü
  // @ts-ignore - Express middleware type conflict
  app.use(ipBlacklistMiddleware());
  
  // 8. Rate Limiting - Request rate kontrolü
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
  
  // Global Error Handler (en son)
  // @ts-ignore - Express middleware type conflict  
  app.use(errorHandler());

  return app;
}

/**
 * Server'ı başlat
 */
export async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const port = config.port;
    const host = config.host || '0.0.0.0';

    // Server'ı dinlemeye başla
    const server = app.listen(port, host, () => {
      log.info(`🚀 Sourcegraph2API Server başlatıldı!`);
      log.info(`📍 Host: ${host}:${port}`);
      log.info(`🌍 Environment: ${config.env || config.nodeEnv}`);
      log.info(`🔧 Route Prefix: ${config.routePrefix || 'none'}`);
      log.info(`📊 Swagger: ${config.swaggerEnable ? 'enabled' : 'disabled'}`);
      log.info(`🛡️  Rate Limit: ${config.requestRateLimit} requests/minute`);
      log.info(`🔍 Debug Mode: ${config.debug ? 'enabled' : 'disabled'}`);
      
      // API endpoints listesi
      log.info(`\n📋 Available Endpoints:`);
      log.info(`   GET  /                    - API bilgileri`);
      log.info(`   GET  /health              - Sağlık kontrolü`);
      log.info(`   GET  /health/detailed     - Detaylı sağlık`);
      log.info(`   POST /v1/chat/completions - Chat completion`);
      log.info(`   GET  /v1/models           - Model listesi`);
      log.info(`   GET  /metrics             - Performance metrics`);
      log.info(`   GET  /metrics/dashboard   - Metrics dashboard\n`);
    });

    // Graceful shutdown handling
    setupGracefulShutdown(server);

  } catch (error: any) {
    log.error(`❌ Server başlatma hatası: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Graceful shutdown setup
 */
function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    log.info(`\n🛑 ${signal} sinyali alındı, server kapatılıyor...`);
    
    server.close((err: any) => {
      if (err) {
        log.error(`❌ Server kapatma hatası: ${err.message}`);
        process.exit(1);
      }
      
      log.info('✅ Server başarıyla kapatıldı');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      log.error('⏰ Zorla kapatma - 30 saniye timeout');
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
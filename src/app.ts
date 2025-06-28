/**
 * Main Application / Ana Uygulama
 * Express server konfigürasyonu ve middleware setup / Express server yapılandırması ve ara yazılım kurulumu
 */

import express, { Application, Request, Response } from 'express';
import { config } from './config';
import { log } from './utils/logger';
import { setupRoutes } from './routes';
import path from 'path'; // path modülünü import et
import cookieParser from 'cookie-parser'; // cookie-parser'ı import et
import session from 'express-session'; // express-session'ı import et
import passport from './services/auth.service'; // Passport yapılandırmamızı import et
import flash from 'connect-flash'; // connect-flash'ı import et
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
 * Express uygulamasını oluştur ve yapılandır / Create and configure the Express application
 */
export function createApp(): Application {
  const app = express();

  // ======================
  // View Engine Setup (EJS) / Görüntü Motoru Kurulumu (EJS)
  // ======================
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'views'));

  // ======================
  // Static Files / Statik Dosyalar
  // ======================
  app.use(express.static(path.join(process.cwd(), 'public')));

  // ======================
  // Session & Auth Middleware
  // Sıralama çok önemlidir: cookieParser -> session -> passport -> flash
  // ======================
  app.use(cookieParser(config.sessionSecret || 'a-super-secret-key-that-is-long-enough'));
  app.use(session({
    secret: config.sessionSecret || 'a-super-secret-key-that-is-long-enough',
    resave: false,
    saveUninitialized: false, // Gerekli olmayana kadar session oluşturma
    store: sessionStore, // Oturumları veritabanında sakla
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Sadece HTTPS üzerinden gönder
      maxAge: 1000 * 60 * 60 * 24 // 1 gün
    }
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  // Flash mesajlarını tüm view'lara (EJS) göndermek için middleware
  app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.user = req.user; // Oturum açmış kullanıcı bilgisini de view'lara gönderelim
    next();
  });

  // ======================
  // Trust proxy (production için) / Proxy'e güven (üretim için)
  // ======================
  app.set('trust proxy', true);

  // ======================
  // Global Middleware Stack / Global Ara Yazılım Yığını
  // ======================

  // 1. Request ID - Her request'e unique ID atar / Assigns a unique ID to each request
  app.use(requestId());

  // 2. Request Logging - Gelen istekleri loglar / Logs incoming requests
  app.use(requestLogger());

  // 3. Security - Helmet güvenlik headers / Güvenlik - Helmet güvenlik başlıkları
  app.use(securityMiddleware());

  // 4. CORS - Cross-origin resource sharing
  app.use(corsMiddleware());

  // 5. Body Parsing - JSON ve URL-encoded / Gövde Ayrıştırma - JSON ve URL kodlamalı
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 6. Compression - Response compression / Sıkıştırma - Yanıt sıkıştırma
  app.use(compressionMiddleware());

  // 7. IP Blacklist - Yasaklı IP kontrolü / IP Kara Listesi - Yasaklı IP kontrolü
  // @ts-ignore - Express middleware type conflict
  app.use(ipBlacklistMiddleware());

  // 8. Rate Limiting - Request rate kontrolü / Hız Sınırlama - İstek oranı kontrolü
  // @ts-ignore - Express middleware type conflict
  app.use(rateLimitMiddleware());

  // ======================
  // API Routes Setup / API Rotaları Kurulumu
  // ======================
  setupRoutes(app);

  // ======================
  // Error Handling / Hata Yönetimi
  // ======================

  // 404 Not Found Handler / 404 Bulunamadı Yöneticisi
  // @ts-ignore - Express middleware type conflict
  app.use(notFoundHandler());

  // Global Error Handler (en son) / Global Hata Yöneticisi (en son)
  // @ts-ignore - Express middleware type conflict  
  app.use(errorHandler());

  return app;
}

/**
 * Server'ı başlat / Start the server
 */
export async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const port = config.port;
    const host = config.host || '0.0.0.0';

    // Server'ı dinlemeye başla / Start listening to the server
    const server = app.listen(port, host, () => {
      log.info(`🚀 Sourcegraph2API Server başlatıldı! / Sourcegraph2API Server started!`);
      log.info(`📍 Host: ${host}:${port}`);
      log.info(`🌍 Environment / Ortam: ${config.nodeEnv}`);
      log.info(`🔧 Route Prefix / Rota Öneki: ${config.routePrefix || 'none / yok'}`);
      log.info(`📊 Swagger: ${config.swaggerEnable ? 'enabled / etkin' : 'disabled / devre dışı'}`);
      log.info(`🛡️  Rate Limit / Hız Limiti: ${config.requestRateLimit} requests/minute`);
      log.info(`🔍 Debug Mode / Hata Ayıklama Modu: ${config.debug ? 'enabled / etkin' : 'disabled / devre dışı'}`);

      // API endpoints listesi / API uç noktaları listesi
      log.info(`\n📋 Available Endpoints / Mevcut Uç Noktalar:`);
      log.info(`   GET  /                    - API bilgileri / API information`);
      log.info(`   GET  /health              - Sağlık kontrolü / Health check`);
      log.info(`   GET  /health/detailed     - Detaylı sağlık / Detailed health`);
      log.info(`   POST /v1/chat/completions - Chat completion / Sohbet tamamlama`);
      log.info(`   GET  /v1/models           - Model listesi / Model list`);
      log.info(`   GET  /metrics             - Performance metrics / Performans metrikleri`);
      log.info(`   GET  /metrics/dashboard   - Metrics dashboard / Metrik panosu\n`);
    });

    // Graceful shutdown handling / Düzgün kapatma yönetimi
    setupGracefulShutdown(server);

  } catch (error: any) {
    log.error(`❌ Server başlatma hatası: ${error.message} / Server startup error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Graceful shutdown setup / Düzgün kapatma kurulumu
 */
function setupGracefulShutdown(server: any): void {
  const shutdown = (signal: string) => {
    log.info(`\n🛑 ${signal} sinyali alındı, server kapatılıyor... / ${signal} signal received, shutting down server...`);

    server.close((err: any) => {
      if (err) {
        log.error(`❌ Server kapatma hatası: ${err.message} / Server shutdown error: ${err.message}`);
        process.exit(1);
      }

      log.info('✅ Server başarıyla kapatıldı / Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds / 30 saniye sonra zorla kapat
    setTimeout(() => {
      log.error('⏰ Zorla kapatma - 30 saniye timeout / Forced shutdown - 30 second timeout');
      process.exit(1);
    }, 30000);
  };

  // Signal handlers / Sinyal işleyicileri
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled errors / İşlenmemiş hatalar
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    log.error(`Unhandled Rejection at: ${promise}, reason: ${reason} / İşlenmemiş Reddetme, konum: ${promise}, neden: ${reason}`);
  });

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception: / Yakalanmamış İstisna:', error);
    process.exit(1);
  });
} 
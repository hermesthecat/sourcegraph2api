/**
 * Middleware Index / Ara Yazılım Dizini
 * Tüm middleware'leri içe aktarır ve yönetir / Imports and manages all middlewares
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { log } from '../utils/logger';

export { openaiAuth, apiAuth } from './auth';

/**
 * Request ID middleware / İstek ID Ara Yazılımı
 * Her request'e unique ID atar / Assigns a unique ID to each request
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  };
}

/**
 * Request logging middleware / İstek Günlüğü Ara Yazılımı
 * Gelen istekleri loglar / Logs incoming requests
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || 'unknown';
    const start = Date.now();

    // Response'a listener ekle / Add listener to response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

      log.request(
        requestId,
        logLevel,
        `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`
      );
    });

    log.request(requestId, 'debug', `${req.method} ${req.originalUrl} - ${req.ip}`);
    next();
  };
}

/**
 * CORS middleware / CORS Ara Yazılımı
 */
export function corsMiddleware() {
  return cors({
    origin: ['*'], // Tüm origin'lere izin ver / Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'proxy-secret'
    ],
    credentials: true
  });
}

/**
 * Security middleware (Helmet) / Güvenlik Ara Yazılımı (Helmet)
 */
export function securityMiddleware() {
  return helmet({
    contentSecurityPolicy: false, // API için CSP'yi devre dışı bırak / Disable CSP for API
    crossOriginEmbedderPolicy: false
  });
}

/**
 * Compression middleware / Sıkıştırma Ara Yazılımı
 */
export function compressionMiddleware() {
  return compression({
    filter: (req: Request, res: Response) => {
      // Server-sent events için compression kullanma / Do not use compression for server-sent events
      if (req.headers.accept?.includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    }
  });
}

/**
 * Rate limiting middleware / Hız Sınırlama Ara Yazılımı
 */
export function rateLimitMiddleware() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 dakika / 1 minute
    max: config.requestRateLimit, // config'den al / get from config
    message: {
      error: {
        message: 'Too many requests, please try again later / Çok fazla istek, lütfen daha sonra tekrar deneyin',
        type: 'rate_limit_exceeded',
        code: 'too_many_requests'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // IP adresini kullan / Use IP address
      return req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Health check endpoint'lerini atla / Skip health check endpoints
      return req.path === '/health' || req.path === '/';
    },
    // Rate limit aşıldığında loglama / Log when rate limit is exceeded
    handler: (req: Request, res: Response) => {
      const requestId = req.requestId || 'unknown';
      log.request(requestId, 'warn', `Rate limit exceeded for IP: ${req.ip} / IP için hız limiti aşıldı: ${req.ip}`);
      res.status(429).json({
        error: {
          message: 'Too many requests, please try again later / Çok fazla istek, lütfen daha sonra tekrar deneyin',
          type: 'rate_limit_exceeded',
          code: 'too_many_requests'
        }
      });
    }
  });
}

/**
 * IP blacklist middleware / IP Kara Liste Ara Yazılımı
 */
export function ipBlacklistMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || 'unknown';
    const requestId = req.requestId || 'unknown';

    if (clientIp !== 'unknown' && config.ipBlacklist.includes(clientIp)) {
      log.request(requestId, 'warn', `Blocked request from blacklisted IP: ${clientIp} / Kara listeye alınmış IP'den gelen istek engellendi: ${clientIp}`);
      res.status(403).json({
        error: {
          message: 'Access denied / Erişim reddedildi',
          type: 'access_denied',
          code: 'ip_blocked'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Error handling middleware / Hata Yönetimi Ara Yazılımı
 */
export function errorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || 'unknown';

    log.request(requestId, 'error', `Unhandled error: ${error.message} / İşlenmeyen hata: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    // Eğer response zaten gönderilmişse, default error handler'a bırak / If response has already been sent, delegate to the default error handler
    if (res.headersSent) {
      return next(error);
    }

    // Operational error mı kontrol et / Check if it's an operational error
    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'Internal server error / Dahili sunucu hatası';

    res.status(statusCode).json({
      error: {
        message,
        type: 'internal_error',
        code: 'server_error'
      }
    });
  };
}

/**
 * 404 Not Found middleware / 404 Bulunamadı Ara Yazılımı
 */
export function notFoundHandler() {
  return (req: Request, res: Response) => {
    const requestId = req.requestId || 'unknown';

    log.request(requestId, 'warn', `404 Not Found: ${req.method} ${req.originalUrl}`);

    res.status(404).json({
      error: {
        message: `Not found: ${req.method} ${req.originalUrl} / Bulunamadı: ${req.method} ${req.originalUrl}`,
        type: 'not_found',
        code: 'endpoint_not_found'
      }
    });
  };
} 
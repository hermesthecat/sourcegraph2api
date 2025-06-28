/**
 * Middleware Index
 * Imports and manages all middlewares
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
 * Request ID middleware
 * Assigns a unique ID to each request
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  };
}

/**
 * Request logging middleware
 * Logs incoming requests
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || 'unknown';
    const start = Date.now();

    // Add listener to response
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
 * CORS middleware
 */
export function corsMiddleware() {
  return cors({
    origin: ['*'], // Allow all origins
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
 * Security middleware (Helmet)
 */
export function securityMiddleware() {
  return helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false
  });
}

/**
 * Compression middleware
 */
export function compressionMiddleware() {
  return compression({
    filter: (req: Request, res: Response) => {
      // Do not use compression for server-sent events
      if (req.headers.accept?.includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    }
  });
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.requestRateLimit, // get from config
    message: {
      error: {
        message: 'Too many requests, please try again later',
        type: 'rate_limit_exceeded',
        code: 'too_many_requests'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use IP address
      return req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip health check endpoints
      return req.path === '/health' || req.path === '/';
    },
    // Log when rate limit is exceeded
    handler: (req: Request, res: Response) => {
      const requestId = req.requestId || 'unknown';
      log.request(requestId, 'warn', `Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: {
          message: 'Too many requests, please try again later',
          type: 'rate_limit_exceeded',
          code: 'too_many_requests'
        }
      });
    }
  });
}

/**
 * IP blacklist middleware
 */
export function ipBlacklistMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || 'unknown';
    const requestId = req.requestId || 'unknown';

    if (clientIp !== 'unknown' && config.ipBlacklist.includes(clientIp)) {
      log.request(requestId, 'warn', `Blocked request from blacklisted IP: ${clientIp}`);
      res.status(403).json({
        error: {
          message: 'Access denied',
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
 * Error handling middleware
 */
export function errorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId || 'unknown';

    log.request(requestId, 'error', `Unhandled error: ${error.message}`, {
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    // If response has already been sent, delegate to the default error handler
    if (res.headersSent) {
      return next(error);
    }

    // Check if it's an operational error
    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'Internal server error';

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
 * 404 Not Found middleware
 */
export function notFoundHandler() {
  return (req: Request, res: Response) => {
    const requestId = req.requestId || 'unknown';

    log.request(requestId, 'warn', `404 Not Found: ${req.method} ${req.originalUrl}`);

    res.status(404).json({
      error: {
        message: `Not found: ${req.method} ${req.originalUrl}`,
        type: 'not_found',
        code: 'endpoint_not_found'
      }
    });
  };
} 
/**
 * Authentication Middleware
 * API key doğrulama ve yetkilendirme
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { OpenAIErrorResponse } from '../types';
import { log } from '../utils/logger';

/**
 * Request'e custom property eklemek için interface genişletme
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      apiKey?: string;
    }
  }
}

/**
 * API secret'ının geçerli olup olmadığını kontrol et
 */
function isValidSecret(secret: string): boolean {
  if (!config.apiSecret) {
    return true; // API secret ayarlanmamışsa tüm isteklere izin ver
  }
  
  return config.apiSecrets.includes(secret);
}

/**
 * OpenAI uyumlu authentication middleware
 * Bearer token formatını destekler
 */
export function openaiAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.requestId || 'unknown';
    
    try {
      // Authorization header'ını al
      let authHeader = req.headers.authorization;
      
      if (!authHeader && !config.apiSecret) {
        // API secret ayarlanmamışsa devam et
        return next();
      }
      
      if (!authHeader) {
        log.request(requestId, 'warn', 'Missing Authorization header');
        res.status(401).json({
          error: {
            message: 'authorization(api-secret) validation failed',
            type: 'invalid_request_error',
            code: 'invalid_authorization'
          }
        } as OpenAIErrorResponse);
        return;
      }
      
      // Bearer token formatını kontrol et
      const token = authHeader.replace(/^Bearer\s+/i, '');
      
      if (!isValidSecret(token)) {
        log.request(requestId, 'warn', `Invalid API key provided: ${token.substring(0, 10)}...`);
        res.status(401).json({
          error: {
            message: 'authorization(api-secret) validation failed',
            type: 'invalid_request_error',
            code: 'invalid_authorization'
          }
        } as OpenAIErrorResponse);
        return;
      }
      
      // API key'i request'e ekle
      req.apiKey = token;
      
      // Authorization header'ını temizle (güvenlik için)
      if (!config.apiSecret) {
        req.headers.authorization = '';
      }
      
      log.request(requestId, 'debug', 'Authentication successful');
      next();
      
    } catch (error) {
      log.request(requestId, 'error', `Authentication error: ${error}`);
      res.status(500).json({
        error: {
          message: 'Internal authentication error',
          type: 'internal_error',
          code: 'auth_error'
        }
      } as OpenAIErrorResponse);
      return;
    }
  };
}

/**
 * Genel API authentication middleware
 * proxy-secret header'ını kullanır
 */
export function apiAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.requestId || 'unknown';
    
    try {
      const secret = req.headers['proxy-secret'] as string;
      
      if (!isValidSecret(secret)) {
        log.request(requestId, 'warn', 'Invalid proxy-secret provided');
        res.status(401).json({
          success: false,
          message: 'No permission for this operation, the correct api-secret was not provided'
        });
        return;
      }
      
      req.apiKey = secret;
      log.request(requestId, 'debug', 'API authentication successful');
      next();
      
    } catch (error) {
      log.request(requestId, 'error', `API authentication error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal authentication error'
      });
      return;
    }
  };
} 
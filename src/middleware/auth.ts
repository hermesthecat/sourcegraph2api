/**
 * Authentication Middleware / Kimlik Doğrulama Ara Yazılımı
 * API key doğrulama ve yetkilendirme / API key validation and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { OpenAIErrorResponse } from '../types';
import { log } from '../utils/logger';

/**
 * Request'e custom property eklemek için interface genişletme
 * Extending the Request interface to add custom properties
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
 * API secret'ının geçerli olup olmadığını kontrol et / Check if the API secret is valid
 */
function isValidSecret(secret: string): boolean {
  if (!config.apiSecret) {
    return true; // API secret ayarlanmamışsa tüm isteklere izin ver / If API secret is not set, allow all requests
  }

  return config.apiSecrets.includes(secret);
}

/**
 * OpenAI uyumlu authentication middleware / OpenAI compatible authentication middleware
 * Bearer token formatını destekler / Supports Bearer token format
 */
export function openaiAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.requestId || 'unknown';

    try {
      // Authorization header'ını al / Get Authorization header
      let authHeader = req.headers.authorization;

      if (!authHeader && !config.apiSecret) {
        // API secret ayarlanmamışsa devam et / If API secret is not set, continue
        return next();
      }

      if (!authHeader) {
        log.request(requestId, 'warn', 'Missing Authorization header / Authorization başlığı eksik');
        res.status(401).json({
          error: {
            message: 'authorization(api-secret) validation failed / yetkilendirme (api-secret) doğrulaması başarısız oldu',
            type: 'invalid_request_error',
            code: 'invalid_authorization'
          }
        } as OpenAIErrorResponse);
        return;
      }

      // Bearer token formatını kontrol et / Check Bearer token format
      const token = authHeader.replace(/^Bearer\s+/i, '');

      if (!isValidSecret(token)) {
        log.request(requestId, 'warn', `Invalid API key provided / Geçersiz API anahtarı sağlandı: ${token.substring(0, 10)}...`);
        res.status(401).json({
          error: {
            message: 'authorization(api-secret) validation failed / yetkilendirme (api-secret) doğrulaması başarısız oldu',
            type: 'invalid_request_error',
            code: 'invalid_authorization'
          }
        } as OpenAIErrorResponse);
        return;
      }

      // API key'i request'e ekle / Add API key to request
      req.apiKey = token;

      // Authorization header'ını temizle (güvenlik için) / Clear Authorization header (for security)
      if (!config.apiSecret) {
        req.headers.authorization = '';
      }

      log.request(requestId, 'debug', 'Authentication successful / Kimlik doğrulama başarılı');
      next();

    } catch (error) {
      log.request(requestId, 'error', `Authentication error / Kimlik doğrulama hatası: ${error}`);
      res.status(500).json({
        error: {
          message: 'Internal authentication error / Dahili kimlik doğrulama hatası',
          type: 'internal_error',
          code: 'auth_error'
        }
      } as OpenAIErrorResponse);
      return;
    }
  };
}

/**
 * Genel API authentication middleware / General API authentication middleware
 * proxy-secret header'ını kullanır / Uses the proxy-secret header
 */
export function apiAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.requestId || 'unknown';

    try {
      const secret = req.headers['proxy-secret'] as string;

      if (!isValidSecret(secret)) {
        log.request(requestId, 'warn', 'Invalid proxy-secret provided / Geçersiz proxy-secret sağlandı');
        res.status(401).json({
          success: false,
          message: 'No permission for this operation, the correct api-secret was not provided / Bu işlem için izin yok, doğru api-secret sağlanmadı'
        });
        return;
      }

      req.apiKey = secret;
      log.request(requestId, 'debug', 'API authentication successful / API kimlik doğrulaması başarılı');
      next();

    } catch (error) {
      log.request(requestId, 'error', `API authentication error / API kimlik doğrulama hatası: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal authentication error / Dahili kimlik doğrulama hatası'
      });
      return;
    }
  };
} 
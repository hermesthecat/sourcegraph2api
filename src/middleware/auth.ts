/**
 * Authentication Middleware / Kimlik Doğrulama Ara Yazılımı
 * API key doğrulama ve yetkilendirme / API key validation and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { OpenAIErrorResponse } from '../types';
import { log } from '../utils/logger';
import { isValidActiveApiKey } from '../services/apikey.service';

/**
 * Request'e custom property eklemek için interface genişletme
 * Extending the Request interface to add custom properties
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      apiKey?: string;
      apiKeyId?: number | null;
      cookieId?: number | null;
    }
  }
}

/**
 * Eski isValidSecret fonksiyonu artık kullanılmayacak, apikey.service.ts'e taşındı.
 * The old isValidSecret function will no longer be used, it has been moved to apikey.service.ts.
 */

/**
 * OpenAI uyumlu authentication middleware / OpenAI compatible authentication middleware
 * Bearer token formatını destekler / Supports Bearer token format
 */
export function openaiAuth() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || 'unknown';

    try {
      // Authorization header'ını al / Get Authorization header
      let authHeader = req.headers.authorization;

      // Eğer veritabanında hiç API anahtarı yoksa ve .env'de de secret ayarlanmamışsa,
      // geliştirme kolaylığı için geçişe izin ver.
      // if (!authHeader && !config.apiSecret && (await countApiKeys()) === 0) {
      //   log.request(requestId, 'debug', 'No API keys in DB and no secret in .env. Allowing request.');
      //   return next();
      // }
      // Yukarıdaki mantık güvenlik riski oluşturabilir, şimdilik devre dışı.

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
      const token = authHeader.replace(/^Bearer\\s+/i, '');

      const apiKey = await isValidActiveApiKey(token);

      if (!apiKey) {
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

      // API key ve ID'sini request'e ekle / Add API key and its ID to request
      req.apiKey = apiKey.key;
      req.apiKeyId = apiKey.id;

      // Authorization header'ını temizle (güvenlik için) / Clear Authorization header (for security)
      // req.headers.authorization = ''; // Bu satır bazı istemcilerde sorun yaratabilir.

      log.request(requestId, 'debug', `Authentication successful for key: ${apiKey.alias}`);
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
 * @deprecated Bu fonksiyon yerine yönetim arayüzü için yeni bir auth sistemi yazılacak.
 */
export function apiAuth() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || 'unknown';

    try {
      const secret = req.headers['proxy-secret'] as string;
      
      const apiKey = await isValidActiveApiKey(secret);

      if (!apiKey) {
        log.request(requestId, 'warn', 'Invalid proxy-secret provided / Geçersiz proxy-secret sağlandı');
        res.status(401).json({
          success: false,
          message: 'No permission for this operation, the correct api-secret was not provided / Bu işlem için izin yok, doğru api-secret sağlanmadı'
        });
        return;
      }

      req.apiKey = apiKey.key;
      req.apiKeyId = apiKey.id;

      log.request(requestId, 'debug', `API authentication successful for key: ${apiKey.alias}`);
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
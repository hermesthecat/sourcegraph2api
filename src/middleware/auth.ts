/**
 * Authentication Middleware
 * API key validation and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { OpenAIErrorResponse } from '../types';
import { log } from '../utils/logger';
import { isValidActiveApiKey } from '../services/apikey.service';

/**
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
 * The old isValidSecret function will no longer be used, it has been moved to apikey.service.ts.
 */

/**
 * OpenAI compatible authentication middleware
 * Supports Bearer token format
 */
export function openaiAuth() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || 'unknown';

    try {
      // Get Authorization header
      let authHeader = req.headers.authorization;

      // If there are no API keys in the database and no secret is set in .env,
      // allow passage for development convenience.
      // if (!authHeader && !config.apiSecret && (await countApiKeys()) === 0) {
      //   log.request(requestId, 'debug', 'No API keys in DB and no secret in .env. Allowing request.');
      //   return next();
      // }
      // The logic above may pose a security risk, currently disabled.

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

      // Check Bearer token format
      const token = authHeader.replace(/^Bearer\\s+/i, '');

      const apiKey = await isValidActiveApiKey(token);

      if (!apiKey) {
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

      // Add API key and its ID to request
      req.apiKey = apiKey.key;
      req.apiKeyId = apiKey.id;

      // Clear Authorization header (for security)
      // req.headers.authorization = ''; // This line might cause issues with some clients.

      log.request(requestId, 'debug', `Authentication successful for key: ${apiKey.alias}`);
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
 * General API authentication middleware
 * Uses the proxy-secret header
 * @deprecated A new auth system will be written for the administration interface instead of this function.
 */
export function apiAuth() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || 'unknown';

    try {
      const secret = req.headers['proxy-secret'] as string;

      const apiKey = await isValidActiveApiKey(secret);

      if (!apiKey) {
        log.request(requestId, 'warn', 'Invalid proxy-secret provided');
        res.status(401).json({
          success: false,
          message: 'No permission for this operation, the correct api-secret was not provided'
        });
        return;
      }

      req.apiKey = apiKey.key;
      req.apiKeyId = apiKey.id;

      log.request(requestId, 'debug', `API authentication successful for key: ${apiKey.alias}`);
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

/**
 * Used to protect admin panel routes.
 * Checks if the user is logged in.
 * @param req 
 * @param res 
 * @param next 
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check the isAuthenticated method added by Passport
  if (req.isAuthenticated()) {
    return next(); // User is logged in, continue
  }

  // User is not logged in, redirect to login page
  req.flash('error', 'You must be logged in to view this page.');
  res.redirect('/login');
}; 
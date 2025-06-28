/**
 * Health Controller - System status checks
 */

import { Request, Response } from 'express';
import { sourcegraphClient } from '../services/sourcegraph';
import { config } from '../config';
import { log } from '../utils/logger';
import { countActiveCookies } from '../services/cookie.service'; // Import countActiveCookies

/**
 * Simple health check
 * GET /health
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';

  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.1.4',
      uptime: process.uptime(),
      environment: config.nodeEnv,
      port: config.port
    };

    log.request(requestId, 'debug', 'Health check requested');
    res.json(health);

  } catch (error: any) {
    log.request(requestId, 'error', `Health check error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

/**
 * Detailed health check
 * GET /health/detailed
 */
export async function detailedHealthCheck(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';

  try {
    const startTime = Date.now();

    // Check cookie status
    const activeCookieCount = await countActiveCookies();
    const hasActiveCookie = activeCookieCount > 0;

    // Memory usage
    const memoryUsage = process.memoryUsage();

    const health = {
      status: hasActiveCookie ? 'ok' : 'warning', // Warning if no active cookies
      timestamp: new Date().toISOString(),
      version: '1.1.4',
      uptime: process.uptime(),
      environment: config.nodeEnv,
      port: config.port,

      // Details
      details: {
        cookies: {
          available: activeCookieCount,
          status: hasActiveCookie ? 'ok' : 'no_cookies_available'
        },

        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },

        config: {
          debug: config.debug,
          rateLimitEnabled: config.requestRateLimit > 0,
          proxyConfigured: !!config.proxyUrl,
          swaggerEnabled: config.swaggerEnable // Get from config
        },

        responseTime: Date.now() - startTime
      }
    };

    log.request(requestId, 'info', `Detailed health check: ${health.status}`);

    if (health.status === 'warning') {
      res.status(503).json(health);
    } else {
      res.json(health);
    }

  } catch (error: any) {
    log.request(requestId, 'error', `Detailed health check error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message
    });
  }
}

/**
 * Root endpoint
 * GET /
 */
export async function rootEndpoint(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';

  try {
    const info = {
      name: 'Sourcegraph2API - Node.js',
      version: '1.1.4',
      description: 'Sourcegraph AI API to OpenAI API proxy server',
      status: 'running',
      timestamp: new Date().toISOString(),

      endpoints: {
        'POST /v1/chat/completions': 'OpenAI compatible chat completion',
        'GET /v1/models': 'List of supported models',
        'GET /health': 'Simple health check',
        'GET /health/detailed': 'Detailed health check'
      },

      documentation: config.swaggerEnable ? '/swagger' : 'disabled',

      // GitHub repository
      repository: 'https://github.com/hermesthecat/sourcegraph2api'
    };

    log.request(requestId, 'debug', 'Root endpoint accessed');
    res.json(info);

  } catch (error: any) {
    log.request(requestId, 'error', `Root endpoint error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
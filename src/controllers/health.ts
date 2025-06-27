/**
 * Health Controller - Sistem durumu kontrolleri
 * Health Controller - System status checks
 */

import { Request, Response } from 'express';
import { sourcegraphClient } from '../services/sourcegraph';
import { config } from '../config';
import { log } from '../utils/logger';

/**
 * Basit health check
 * GET /health
 * Simple health check
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

    log.request(requestId, 'debug', 'Health check requested / Sağlık kontrolü istendi');
    res.json(health);

  } catch (error: any) {
    log.request(requestId, 'error', `Health check error / Sağlık kontrolü hatası: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

/**
 * Detaylı sağlık kontrolü
 * GET /health/detailed
 * Detailed health check
 */
export async function detailedHealthCheck(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';

  try {
    const startTime = Date.now();

    // Cookie durumunu kontrol et / Check cookie status
    const hasCookie = !!config.sgCookie;

    // Memory kullanımı / Memory usage
    const memoryUsage = process.memoryUsage();

    const health = {
      status: hasCookie ? 'ok' : 'warning',
      timestamp: new Date().toISOString(),
      version: '1.1.4',
      uptime: process.uptime(),
      environment: config.nodeEnv,
      port: config.port,

      // Detaylar / Details
      details: {
        cookies: {
          available: hasCookie ? 1 : 0,
          status: hasCookie ? 'ok' : 'no_cookies_available'
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
          swaggerEnabled: config.swaggerEnable
        },

        responseTime: Date.now() - startTime
      }
    };

    log.request(requestId, 'info', `Detailed health check / Detaylı sağlık kontrolü: ${health.status}`);

    if (health.status === 'warning') {
      res.status(503).json(health);
    } else {
      res.json(health);
    }

  } catch (error: any) {
    log.request(requestId, 'error', `Detailed health check error / Detaylı sağlık kontrolü hatası: ${error.message}`);
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
      description: 'Sourcegraph AI API to OpenAI API proxy server / Sourcegraph AI API\'den OpenAI API\'ye proxy sunucusu',
      status: 'running / çalışıyor',
      timestamp: new Date().toISOString(),

      endpoints: {
        'POST /v1/chat/completions': 'OpenAI uyumlu chat completion / OpenAI compatible chat completion',
        'GET /v1/models': 'Desteklenen modeller listesi / List of supported models',
        'GET /health': 'Basit sağlık kontrolü / Simple health check',
        'GET /health/detailed': 'Detaylı sağlık kontrolü / Detailed health check'
      },

      documentation: config.swaggerEnable ? '/swagger' : 'disabled / devre dışı',

      // GitHub repository
      repository: 'https://github.com/hermesthecat/sourcegraph2api'
    };

    log.request(requestId, 'debug', 'Root endpoint accessed / Kök uç noktasına erişildi');
    res.json(info);

  } catch (error: any) {
    log.request(requestId, 'error', `Root endpoint error / Kök uç nokta hatası: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
} 
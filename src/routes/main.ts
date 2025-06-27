/**
 * Main Routes / Ana Rotalar
 * Ana routing sistemini organize eder ve API endpoint'lerini yönetir / Organizes the main routing system and manages API endpoints
 */

import { Router, Application } from 'express';
import { config } from '../config';

// Controllers
import {
  chatCompletion,
  getModels,
  getModel,
  healthCheck,
  detailedHealthCheck
} from '../controllers';

// Middleware
import { openaiAuth } from '../middleware';

// Services - metrics
import { getMetricsDashboard, getCacheStats, getServicesHealth } from '../services';

/**
 * API Router'ını oluştur ve yapılandır / Create and configure the API Router
 */
export function createApiRouter(): Router {
  const router = Router();

  // ======================
  // Root endpoint / Kök uç noktası
  // ======================
  router.get('/', (req, res) => {
    res.json({
      name: 'Sourcegraph2API - Node.js',
      version: '1.1.4',
      description: 'Sourcegraph AI API to OpenAI API proxy server / Sourcegraph AI API\'den OpenAI API\'ye proxy sunucusu',
      status: 'running / çalışıyor',
      timestamp: new Date().toISOString(),

      endpoints: {
        'POST /v1/chat/completions': 'OpenAI uyumlu chat completion / OpenAI compatible chat completion',
        'GET /v1/models': 'Desteklenen modeller listesi / List of supported models',
        'GET /v1/models/{model}': 'Spesifik model bilgisi / Specific model information',
        'GET /health': 'Basit sağlık kontrolü / Simple health check',
        'GET /health/detailed': 'Detaylı sağlık kontrolü / Detailed health check',
        'GET /metrics': 'Performans metrikleri / Performance metrics',
        'GET /metrics/dashboard': 'Metrics dashboard / Metrikler panosu'
      },

      documentation: config.swaggerEnable ? '/swagger' : 'disabled / devre dışı',
      repository: 'https://github.com/hermesthecat/sourcegraph2api'
    });
  });

  // ======================
  // Health endpoints (rate limit yok) / Sağlık kontrolü uç noktaları (hız limiti yok)
  // ======================
  // @ts-ignore - Express middleware type conflict
  router.get('/health', healthCheck);
  // @ts-ignore - Express middleware type conflict
  router.get('/health/detailed', detailedHealthCheck);

  // ======================
  // V1 API Routes / V1 API Rotaları
  // ======================
  const v1Router = Router();

  // OpenAI Chat Completion / OpenAI Sohbet Tamamlama
  // @ts-ignore - Express middleware type conflict
  v1Router.post('/chat/completions', openaiAuth(), chatCompletion);

  // OpenAI Models / OpenAI Modelleri
  // @ts-ignore - Express middleware type conflict
  v1Router.get('/models', openaiAuth(), getModels);
  // @ts-ignore - Express middleware type conflict
  v1Router.get('/models/:model', openaiAuth(), getModel);

  // ======================
  // Metrics endpoints (admin) / Metrik uç noktaları (yönetici)
  // ======================

  // GET /metrics - Temel metrics / GET /metrics - Temel metrikler
  router.get('/metrics', (req, res) => {
    try {
      const dashboard = getMetricsDashboard();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        metrics: dashboard.overview,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.1.4'
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve metrics / Metrikler alınamadı' });
    }
  });

  // GET /metrics/dashboard - Detaylı dashboard / GET /metrics/dashboard - Detaylı pano
  router.get('/metrics/dashboard', (req, res) => {
    try {
      const dashboard = getMetricsDashboard();
      const cacheStats = getCacheStats();
      const servicesHealth = getServicesHealth();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        ...dashboard,
        cache: cacheStats,
        services: servicesHealth,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to retrieve dashboard / Pano alınamadı' });
    }
  });

  // ======================
  // Route prefix uygula / Rota önekini uygula
  // ======================
  const routePrefix = processRoutePrefix(config.routePrefix);
  if (routePrefix) {
    router.use(`${routePrefix}/v1`, v1Router);
  } else {
    router.use('/v1', v1Router);
  }

  return router;
}

/**
 * Express app'e router'ları ekle / Add routers to the Express app
 */
export function setupRoutes(app: Application): void {
  const apiRouter = createApiRouter();
  app.use('/', apiRouter);
}

/**
 * Route prefix'i işle ve düzenle / Process and clean the route prefix
 */
function processRoutePrefix(prefix: string): string {
  if (!prefix) return '';

  // Başlangıçta / yoksa ekle / Add / at the beginning if it doesn't exist
  if (!prefix.startsWith('/')) {
    prefix = '/' + prefix;
  }

  // Sonunda / varsa kaldır / Remove / at the end if it exists
  if (prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }

  return prefix;
} 
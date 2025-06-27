/**
 * Main Routes
 * Ana routing sistemini organize eder ve API endpoint'lerini yönetir
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
 * API Router'ını oluştur ve yapılandır
 */
export function createApiRouter(): Router {
  const router = Router();

  // ======================
  // Root endpoint
  // ======================
  router.get('/', (req, res) => {
    res.json({
      name: 'Sourcegraph2API - Node.js',
      version: '1.1.4',
      description: 'Sourcegraph AI API to OpenAI API proxy server',
      status: 'running',
      timestamp: new Date().toISOString(),
      
      endpoints: {
        'POST /v1/chat/completions': 'OpenAI uyumlu chat completion',
        'GET /v1/models': 'Desteklenen modeller listesi',
        'GET /v1/models/{model}': 'Spesifik model bilgisi',
        'GET /health': 'Basit sağlık kontrolü',
        'GET /health/detailed': 'Detaylı sağlık kontrolü',
        'GET /metrics': 'Performans metrikleri',
        'GET /metrics/dashboard': 'Metrics dashboard'
      },
      
      documentation: config.swaggerEnable ? '/swagger' : 'disabled',
      repository: 'https://github.com/hermesthecat/sourcegraph2api'
    });
  });

  // ======================
  // Health endpoints (rate limit yok)
  // ======================
  // @ts-ignore - Express middleware type conflict
  router.get('/health', healthCheck);
  // @ts-ignore - Express middleware type conflict
  router.get('/health/detailed', detailedHealthCheck);

  // ======================
  // V1 API Routes
  // ======================
  const v1Router = Router();
  
  // OpenAI Chat Completion
  // @ts-ignore - Express middleware type conflict
  v1Router.post('/chat/completions', openaiAuth(), chatCompletion);
  
  // OpenAI Models  
  // @ts-ignore - Express middleware type conflict
  v1Router.get('/models', openaiAuth(), getModels);
  // @ts-ignore - Express middleware type conflict
  v1Router.get('/models/:model', openaiAuth(), getModel);

  // ======================
  // Metrics endpoints (admin)
  // ======================
  
  // GET /metrics - Temel metrics
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
      res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
  });

  // GET /metrics/dashboard - Detaylı dashboard
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
      res.status(500).json({ error: 'Failed to retrieve dashboard' });
    }
  });

  // ======================
  // Route prefix uygula
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
 * Express app'e router'ları ekle
 */
export function setupRoutes(app: Application): void {
  const apiRouter = createApiRouter();
  app.use('/', apiRouter);
}

/**
 * Route prefix'i işle ve düzenle
 */
function processRoutePrefix(prefix: string): string {
  if (!prefix) return '';
  
  // Başlangıçta / yoksa ekle
  if (!prefix.startsWith('/')) {
    prefix = '/' + prefix;
  }
  
  // Sonunda / varsa kaldır
  if (prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }
  
  return prefix;
} 
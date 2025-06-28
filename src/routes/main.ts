/**
 * Main Routes
 * Organizes the main routing system and manages API endpoints
 */

import { Router, Application } from 'express';
import { config } from '../config';
import passport from '../services/auth.service';

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
import { getGeneralStats } from '../services/statistics.service';
import { log } from '../utils/logger';

// Admin router
import adminRouter from './admin.routes';

/**
 * Create and configure the API Router
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
        'GET /': 'Root endpoint',
        'GET /login': 'Login page',
        'GET /logout': 'Logout',
        'GET /admin/dashboard': 'Admin dashboard',
        'GET /admin/settings': 'Admin settings',
        'GET /admin/users': 'Admin users',
        'GET /admin/api-keys': 'Admin API keys',
        'GET /admin/cookies': 'Admin cookies',
        'POST /v1/chat/completions': 'OpenAI compatible chat completion',
        'GET /v1/models': 'List of supported models',
        'GET /v1/models/{model}': 'Specific model information',
        'GET /health': 'Simple health check',
        'GET /health/detailed': 'Detailed health check',
        'GET /metrics': 'Performance metrics',
        'GET /metrics/dashboard': 'Metrics dashboard'
      },

      repository: 'https://github.com/hermesthecat/sourcegraph2api'
    });
  });

  // ======================
  // Health endpoints (no rate limit)
  // ======================
  // @ts-ignore - Express middleware type conflict
  router.get('/health', healthCheck);
  // @ts-ignore - Express middleware type conflict
  router.get('/health/detailed', detailedHealthCheck);

  // ======================
  // Authentication Routes
  // ======================
  // Show login page
  router.get('/login', (req, res) => {
    res.render('login', { message: req.flash('error') });
  });

  // Perform login - MANUAL METHOD
  // This is the most reliable way to ensure session saving is complete.
  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        // Add error message to flash and redirect to login
        if (info && info.message) {
          req.flash('error', info.message);
        }
        return res.redirect('/login');
      }
      // Manually log in the user
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // SAVE SESSION and then redirect
        req.session.save(() => {
          res.redirect('/admin/dashboard');
        });
      });
    })(req, res, next);
  });

  // Logout action
  router.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });

  // ======================
  // Admin Routes
  // ======================
  router.use('/admin', adminRouter);

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

  // GET /metrics - Basic metrics
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

  // GET /metrics/dashboard - Detailed dashboard
  router.get('/metrics/dashboard', async (req, res) => {
    try {
      const cacheStats = getCacheStats();
      const servicesHealth = getServicesHealth();
      const generalStats = await getGeneralStats();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        overview: {
          total_requests: generalStats.totalRequests,
          total_errors: generalStats.totalErrors,
          success_rate: generalStats.errorRate,
        },
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
      log.error('Error retrieving metrics dashboard data:', error);
      res.status(500).json({ error: 'Failed to retrieve dashboard' });
    }
  });

  // ======================
  // Apply route prefix
  // ======================
  const routePrefix = processRoutePrefix(config.routePrefix || '');
  if (routePrefix) {
    router.use(`${routePrefix}/v1`, v1Router);
  } else {
    router.use('/v1', v1Router);
  }

  return router;
}

/**
 * Add routers to the Express app
 */
export function setupRoutes(app: Application): void {
  const apiRouter = createApiRouter();
  app.use('/', apiRouter);
}

/**
 * Process and clean the route prefix
 */
function processRoutePrefix(prefix: string): string {
  if (!prefix) return '';

  // Add / at the beginning if it doesn't exist
  if (!prefix.startsWith('/')) {
    prefix = '/' + prefix;
  }

  // Remove / at the end if it exists
  if (prefix.endsWith('/')) {
    prefix = prefix.slice(0, -1);
  }

  return prefix;
} 
/**
 * Services Index / Servis Dizini
 * Tüm service'leri export eder / Exports all services
 */

// Sourcegraph API Service / Sourcegraph API Servisi
export {
  sourcegraphClient
} from './sourcegraph';

// Analytics Service / Analitik Servisi
export {
  metricsStore,
  createAnalyticsMiddleware,
  getMetricsDashboard
} from './analytics';

// Cache Service / Önbellek Servisi
export {
  responseCache,
  modelCache,
  configCache,
  safeResponseCache,
  safeModelCache,
  safeConfigCache,
  SafeCache,
  ResponseCacheUtils,
  getCacheStats
} from './cache';

// Import for health check / Sağlık kontrolü için içe aktarma
import { config } from '../config';
import { sourcegraphClient } from './sourcegraph';
import { metricsStore } from './analytics';
import { getCacheStats } from './cache';

// Service health check / Servis sağlık kontrolü
export function getServicesHealth(): any {
  const hasCookie = !!config.sgCookie;
  return {
    sourcegraph: {
      status: hasCookie ? 'ok' : 'warning',
      availableCookies: hasCookie ? 1 : 0
    },

    analytics: {
      status: 'ok',
      metrics: metricsStore.getMetrics()
    },

    cache: {
      status: 'ok',
      stats: getCacheStats()
    }
  };
} 
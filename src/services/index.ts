/**
 * Services Index
 * Exports all services
 */

// Sourcegraph API Service
export {
  sourcegraphClient
} from './sourcegraph';

// Analytics Service
export {
  metricsStore,
  createAnalyticsMiddleware,
  getMetricsDashboard
} from './analytics';

// Cache Service
export {
  responseCache,
  modelCache,
  configCache,
  getCacheStats
} from './cache';

// Import for health check
import { config } from '../config';
import { sourcegraphClient } from './sourcegraph';
import { metricsStore } from './analytics';
import { getCacheStats } from './cache';
import { countActiveCookies } from './cookie.service'; // Import countActiveCookies

// Service health check
export async function getServicesHealth(): Promise<any> { // Made async
  const activeCookieCount = await countActiveCookies(); // Get active cookie count
  const hasCookie = activeCookieCount > 0;
  return {
    sourcegraph: {
      status: hasCookie ? 'ok' : 'warning',
      availableCookies: activeCookieCount
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
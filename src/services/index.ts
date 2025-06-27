/**
 * Services Index
 * Tüm service'leri export eder
 */

// Sourcegraph API Service
export { 
  sourcegraphClient, 
  CookieManager, 
  SourcegraphClient 
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
  safeResponseCache, 
  safeModelCache, 
  safeConfigCache,
  SafeCache,
  ResponseCacheUtils,
  getCacheStats 
} from './cache';

// Import for health check
import { sourcegraphClient } from './sourcegraph';
import { metricsStore } from './analytics';
import { getCacheStats } from './cache';

// Service health check
export function getServicesHealth(): any {
  return {
    sourcegraph: {
      status: 'ok',
      availableCookies: sourcegraphClient.getAvailableCookieCount()
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
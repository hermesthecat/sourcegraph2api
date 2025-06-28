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

// Import for health check / Sağlık kontrolü için içe aktırma
import { config } from '../config';
import { sourcegraphClient } from './sourcegraph';
import { metricsStore } from './analytics';
import { getCacheStats } from './cache';
import { countActiveCookies } from './cookie.service'; // countActiveCookies'i import et

// Service health check / Servis sağlık kontrolü
export async function getServicesHealth(): Promise<any> { // async yapıldı
  const activeCookieCount = await countActiveCookies(); // Aktif cookie sayısını al
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
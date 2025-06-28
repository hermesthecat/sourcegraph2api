/**
 * Analytics Service
 * Request/response metrics and analytics
 */

import { log } from '../utils/logger';
import { formatDuration, getCurrentTimestamp, extractStatusCode } from '../utils/helpers';

// Metrics interfaces
interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalTokensProcessed: number;
  modelUsage: Record<string, number>;
  errorTypes: Record<string, number>;
  lastReset: number;
}

interface ApiUsageStats {
  hourly: Record<string, number>;
  daily: Record<string, number>;
  models: Record<string, number>;
  statusCodes: Record<string, number>;
}

// Global metrics store
class MetricsStore {
  private metrics: RequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalTokensProcessed: 0,
    modelUsage: {},
    errorTypes: {},
    lastReset: getCurrentTimestamp()
  };

  private responseTimes: number[] = [];
  private maxResponseTimes: number = 1000; // Store the last 1000 requests

  private usage: ApiUsageStats = {
    hourly: {},
    daily: {},
    models: {},
    statusCodes: {}
  };

  /**
   * Record a new request
   */
  recordRequest(model?: string): void {
    this.metrics.totalRequests++;

    if (model) {
      this.metrics.modelUsage[model] = (this.metrics.modelUsage[model] || 0) + 1;
      this.usage.models[model] = (this.usage.models[model] || 0) + 1;
    }

    // Hourly/daily usage
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    this.usage.hourly[hourKey] = (this.usage.hourly[hourKey] || 0) + 1;
    this.usage.daily[dayKey] = (this.usage.daily[dayKey] || 0) + 1;
  }

  /**
   * Record a successful response
   */
  recordSuccess(responseTime: number, tokens?: number): void {
    this.metrics.successfulRequests++;

    if (tokens) {
      this.metrics.totalTokensProcessed += tokens;
    }

    // Record response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }

    // Calculate average
    this.metrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    // Record status code
    this.usage.statusCodes['200'] = (this.usage.statusCodes['200'] || 0) + 1;
  }

  /**
   * Record an error
   */
  recordError(errorType: string, statusCode?: number): void {
    this.metrics.failedRequests++;
    this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;

    if (statusCode) {
      this.usage.statusCodes[statusCode.toString()] = (this.usage.statusCodes[statusCode.toString()] || 0) + 1;
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): RequestMetrics & { uptime: number; errorRate: number } {
    const errorRate = this.metrics.totalRequests > 0
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100
      : 0;

    return {
      ...this.metrics,
      uptime: getCurrentTimestamp() - this.metrics.lastReset,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  /**
   * Get usage stats
   */
  getUsageStats(): ApiUsageStats {
    return { ...this.usage };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensProcessed: 0,
      modelUsage: {},
      errorTypes: {},
      lastReset: getCurrentTimestamp()
    };

    this.responseTimes = [];
    this.usage = {
      hourly: {},
      daily: {},
      models: {},
      statusCodes: {}
    };

    log.info('Metrics reset');
  }

  /**
   * Get top models
   */
  getTopModels(limit: number = 5): Array<{ model: string; usage: number }> {
    return Object.entries(this.metrics.modelUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([model, usage]) => ({ model, usage }));
  }

  /**
   * Most common errors
   */
  getTopErrors(limit: number = 5): Array<{ error: string; count: number }> {
    return Object.entries(this.metrics.errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Performance summary
   */
  getPerformanceSummary(): {
    avgResponseTime: string;
    successRate: string;
    requestsPerMinute: number;
    totalTokens: number;
  } {
    const uptime = getCurrentTimestamp() - this.metrics.lastReset;
    const requestsPerMinute = uptime > 0 ? Math.round((this.metrics.totalRequests / uptime) * 60) : 0;
    const successRate = this.metrics.totalRequests > 0
      ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1) + '%'
      : '0%';

    return {
      avgResponseTime: formatDuration(this.metrics.averageResponseTime),
      successRate,
      requestsPerMinute,
      totalTokens: this.metrics.totalTokensProcessed
    };
  }
}

// Singleton instance
export const metricsStore = new MetricsStore();

/**
 * Analytics middleware factory
 */
export function createAnalyticsMiddleware() {
  return {
    /**
     * Record request start
     */
    recordRequestStart: (model?: string) => {
      metricsStore.recordRequest(model);
      return Date.now();
    },

    /**
     * Record successful request
     */
    recordRequestSuccess: (startTime: number, tokens?: number) => {
      const responseTime = Date.now() - startTime;
      metricsStore.recordSuccess(responseTime, tokens);
    },

    /**
     * Record error
     */
    recordRequestError: (error: any, model?: string) => {
      const statusCode = extractStatusCode(error);
      const errorType = error.name || error.constructor.name || 'UnknownError';

      metricsStore.recordError(errorType, statusCode);

      log.warn(`Request failed: ${errorType} (${statusCode}) for model: ${model || 'unknown'}`);
    }
  };
}

/**
 * Metrics dashboard data
 */
export function getMetricsDashboard() {
  const metrics = metricsStore.getMetrics();
  const usage = metricsStore.getUsageStats();
  const performance = metricsStore.getPerformanceSummary();
  const topModels = metricsStore.getTopModels();
  const topErrors = metricsStore.getTopErrors();

  return {
    overview: {
      totalRequests: metrics.totalRequests,
      successRate: performance.successRate,
      avgResponseTime: performance.avgResponseTime,
      requestsPerMinute: performance.requestsPerMinute,
      totalTokens: performance.totalTokens,
      uptime: formatDuration(metrics.uptime * 1000),
      errorRate: `${metrics.errorRate}%`
    },

    models: {
      topUsed: topModels,
      totalModels: Object.keys(metrics.modelUsage).length
    },

    errors: {
      topErrors,
      totalErrors: metrics.failedRequests
    },

    usage: {
      last24Hours: Object.entries(usage.hourly)
        .slice(-24)
        .map(([hour, count]) => ({ hour, requests: count })),

      statusCodes: usage.statusCodes
    },

    raw: {
      metrics,
      usage
    }
  };
}

// Periodic cleanup (delete old data)
// setInterval(() => {
//   const now = new Date();
//   const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//   const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

//   const usage = metricsStore.getUsageStats();

//   // Delete hourly data older than 24 hours
//   Object.keys(usage.hourly).forEach(key => {
//     const [year, month, day, hour] = key.split('-').map(Number);
//     const keyDate = new Date(year, month, day, hour);
//     if (keyDate < oneDayAgo) {
//       delete usage.hourly[key];
//     }
//   });

//   // Delete daily data older than 7 days
//   Object.keys(usage.daily).forEach(key => {
//     const [year, month, day] = key.split('-').map(Number);
//     const keyDate = new Date(year, month, day);
//     if (keyDate < sevenDaysAgo) {
//       delete usage.daily[key];
//     }
//   });

// }, 60 * 60 * 1000); // Run every hour 
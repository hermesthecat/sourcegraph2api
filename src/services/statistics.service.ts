/**
 * Statistics Service
 * Calculates meaningful statistics from the metrics in the database
 */

import { UsageMetric, Cookie, ApiKey } from '../models';
import { sequelize } from './database';
import { Op } from 'sequelize';
import { log } from '../utils/logger';

/**
 * Calculates general stats to be displayed at the top of the dashboard
 */
export async function getGeneralStats() {
  try {
    const totalRequests = await UsageMetric.count();
    const totalErrors = await UsageMetric.count({ where: { wasSuccess: false } });
    const activeCookies = await Cookie.count({ where: { isActive: true } });
    const activeApiKeys = await ApiKey.count({ where: { isActive: true } });

    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return {
      totalRequests,
      totalErrors,
      activeCookies,
      activeApiKeys,
      errorRate: errorRate.toFixed(2),
    };
  } catch (error) {
    log.error('Error occurred while fetching general statistics:', error);
    throw error;
  }
}

/**
 * Calculates detailed usage statistics on a per-cookie basis
 */
export async function getCookieUsageStats() {
  try {
    const stats = await UsageMetric.findAll({
      attributes: [
        'cookieId',
        [sequelize.fn('COUNT', sequelize.col('UsageMetric.id')), 'totalRequests'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN wasSuccess = 0 THEN 1 ELSE 0 END')), 'failedRequests'],
      ],
      include: [{
        model: Cookie,
        as: 'cookie',
        attributes: ['alias'],
        required: true,
      }],
      group: ['cookie.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('UsageMetric.id')), 'DESC']],
    });
    return stats;
  } catch (error) {
    log.error('Error occurred while fetching cookie usage statistics:', error);
    throw error;
  }
}

/**
 * Calculates detailed usage statistics on a per-apiKey basis
 */
export async function getApiKeyUsageStats() {
  try {
    const stats = await UsageMetric.findAll({
      attributes: [
        'apiKeyId',
        [sequelize.fn('COUNT', sequelize.col('UsageMetric.id')), 'totalRequests'],
      ],
      include: [{
        model: ApiKey,
        as: 'apiKey',
        attributes: ['alias'],
        required: true,
      }],
      group: ['apiKey.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('UsageMetric.id')), 'DESC']],
      limit: 10, // Show top 10 most used keys
    });
    return stats;
  } catch (error) {
    log.error('Error occurred while fetching API key usage statistics:', error);
    throw error;
  }
}

/**
 * Calculates usage statistics by model (for Pie chart)
 */
export async function getModelUsageStats() {
  try {
    const stats = await UsageMetric.findAll({
      attributes: [
        'model',
        [sequelize.fn('COUNT', sequelize.col('model')), 'count'],
      ],
      where: {
        model: {
          [Op.ne]: null, // Count models that are not null
        },
      },
      group: ['model'],
      order: [[sequelize.fn('COUNT', sequelize.col('model')), 'DESC']],
    });

    const labels = stats.map((item: any) => item.model);
    const data = stats.map((item: any) => item.get('count'));

    return { labels, data };
  } catch (error) {
    log.error('Error occurred while fetching model usage statistics:', error);
    throw error;
  }
}

/**
 * Prepares daily usage data for the last 30 days for a chart
 */
export async function getDailyUsageForChart() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyCounts = await UsageMetric.findAll({
      attributes: [
        [sequelize.fn('date', sequelize.col('requestTimestamp')), 'date'],
        [sequelize.fn('COUNT', 'id'), 'count'],
      ],
      where: {
        requestTimestamp: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
      group: [sequelize.fn('date', sequelize.col('requestTimestamp'))],
      order: [[sequelize.fn('date', sequelize.col('requestTimestamp')), 'ASC']],
    });

    // Convert data to Chart.js expected format
    const labels = dailyCounts.map((item: any) => item.get('date'));
    const data = dailyCounts.map((item: any) => item.get('count'));

    return { labels, data };

  } catch (error) {
    log.error('Error occurred while fetching chart data:', error);
    throw error;
  }
} 
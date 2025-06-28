/**
 * Metric Service
 * Contains functions for recording and querying API usage metrics
 */

import { UsageMetric, ApiKey, Cookie } from '../models';
import { log } from '../utils/logger';
import { Op } from 'sequelize';

interface RecordUsageData {
  ipAddress: string;
  apiKeyId: number | null;
  cookieId: number | null;
  model: string | null;
  wasSuccess: boolean;
  errorMessage?: string | null;
}

/**
 * Records an API usage event to the database
 * @param {RecordUsageData} data - Metric data to be recorded
 * @returns {Promise<void>}
 */
export async function recordUsage(data: RecordUsageData): Promise<void> {
  try {
    await UsageMetric.create({
      ipAddress: data.ipAddress,
      apiKeyId: data.apiKeyId,
      cookieId: data.cookieId,
      model: data.model,
      wasSuccess: data.wasSuccess,
      errorMessage: data.errorMessage || null,
      requestTimestamp: new Date(),
    });
  } catch (error) {
    // Errors in metric recording should not break the application flow, just log them
    log.error('Error occurred while recording metric:', error);
  }
}

interface MetricQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'success' | 'failure' | null;
}

/**
 * Fetches recorded metrics with pagination and filtering
 * @param {MetricQueryOptions} options - Query options
 * @returns {Promise<{rows: UsageMetric[], count: number}>}
 */
export async function getUsageMetrics(options: MetricQueryOptions = {}) {
  const page = options.page || 1;
  const limit = options.limit || 25;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (options.filter === 'success') {
    where.wasSuccess = true;
  } else if (options.filter === 'failure') {
    where.wasSuccess = false;
  }

  // Search feature (in IP address or error message)
  if (options.search) {
    where[Op.or] = [
      { ipAddress: { [Op.like]: `%${options.search}%` } },
      { errorMessage: { [Op.like]: `%${options.search}%` } },
    ];
  }

  try {
    const { rows, count } = await UsageMetric.findAndCountAll({
      where,
      limit,
      offset,
      order: [['requestTimestamp', 'DESC']],
      // Include associated models (Join)
      include: [
        { model: ApiKey, as: 'apiKey', attributes: ['alias'] },
        { model: Cookie, as: 'cookie', attributes: ['alias'] },
      ],
    });
    return { rows, count };
  } catch (error) {
    log.error('Error occurred while fetching metrics:', error);
    throw error;
  }
} 
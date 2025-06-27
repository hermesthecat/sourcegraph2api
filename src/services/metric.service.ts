/**
 * Metric Service / Metrik Servisi
 * API kullanım metriklerini kaydetmek ve sorgulamak için fonksiyonlar içerir
 * Contains functions for recording and querying API usage metrics
 */

import { UsageMetric, ApiKey, Cookie } from '../models';
import { log } from '../utils/logger';
import { Op } from 'sequelize';

interface RecordUsageData {
  ipAddress: string;
  apiKeyId: number | null;
  cookieId: number | null;
  wasSuccess: boolean;
  errorMessage?: string | null;
}

/**
 * Bir API kullanımını veritabanına kaydeder
 * Records an API usage event to the database
 * @param {RecordUsageData} data - Kaydedilecek metrik verisi
 * @returns {Promise<void>}
 */
export async function recordUsage(data: RecordUsageData): Promise<void> {
  try {
    await UsageMetric.create({
      ipAddress: data.ipAddress,
      apiKeyId: data.apiKeyId,
      cookieId: data.cookieId,
      wasSuccess: data.wasSuccess,
      errorMessage: data.errorMessage || null,
      requestTimestamp: new Date(),
    });
  } catch (error) {
    // Metrik kaydındaki hatalar uygulamanın akışını bozmamalı, sadece loglanmalı
    // Errors in metric recording should not break the application flow, just log them
    log.error('Metrik kaydedilirken hata oluştu:', error);
  }
}

interface MetricQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'success' | 'failure' | null;
}

/**
 * Kaydedilmiş metrikleri sayfalama ve filtreleme yaparak getirir
 * Fetches recorded metrics with pagination and filtering
 * @param {MetricQueryOptions} options - Sorgulama seçenekleri
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
  
  // Arama özelliği (IP adresi veya hata mesajında)
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
      // İlişkili modelleri de getir (Join)
      include: [
        { model: ApiKey, as: 'apiKey', attributes: ['alias'] },
        { model: Cookie, as: 'cookie', attributes: ['alias'] },
      ],
    });
    return { rows, count };
  } catch (error) {
    log.error('Metrikler alınırken hata oluştu:', error);
    throw error;
  }
} 
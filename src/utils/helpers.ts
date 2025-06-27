/**
 * Helper Utilities / Yardımcı Araçlar
 * Yardımcı fonksiyonlar ve utilities / Helper functions and utilities
 */

import { OpenAIChatMessage } from '../types';

/**
 * Retry logic için delay fonksiyonu / Delay function for retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff hesaplama / Calculate exponential backoff
 */
export function calculateBackoff(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // %10 jitter / 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Safe JSON parse / Güvenli JSON ayrıştırma
 */
export function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * String'den zararlı karakterleri temizle / Sanitize harmful characters from a string
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F]/g, '') // Control karakterleri / Control characters
    .replace(/[\u2028\u2029]/g, '') // Line/paragraph separator / Satır/paragraf ayırıcı
    .trim();
}

/**
 * Text chunk'ları birleştir / Merge text chunks
 */
export function mergeTextChunks(chunks: string[]): string {
  return chunks
    .map(chunk => sanitizeString(chunk))
    .filter(chunk => chunk.length > 0)
    .join('');
}

/**
 * Messages'ları text'e çevir / Convert messages to text
 */
export function messagesToText(messages: OpenAIChatMessage[]): string {
  return messages.map(message => {
    const role = message.role.toUpperCase();
    const content = typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);

    return `${role}: ${content}`;
  }).join('\n\n');
}

/**
 * Rate limit header'larını parse et / Parse rate limit headers
 */
export function parseRateLimitHeaders(headers: Record<string, string>): {
  limit?: number;
  remaining?: number;
  resetTime?: Date;
} {
  const limit = headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit']) : undefined;
  const remaining = headers['x-ratelimit-remaining'] ? parseInt(headers['x-ratelimit-remaining']) : undefined;
  const resetTime = headers['x-ratelimit-reset'] ? new Date(parseInt(headers['x-ratelimit-reset']) * 1000) : undefined;

  return { limit, remaining, resetTime };
}

/**
 * URL validation / URL doğrulama
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cookie format validation / Cookie formatı doğrulama
 */
export function isValidCookie(cookie: string): boolean {
  // Basit cookie format kontrolü / Simple cookie format check
  return cookie.length > 10 && !cookie.includes(' ') && cookie.includes('=');
}

/**
 * Error'dan status code çıkar / Extract status code from error
 */
export function extractStatusCode(error: any): number {
  if (error.response?.status) return error.response.status;
  if (error.status) return error.status;
  if (error.code === 'ECONNREFUSED') return 503;
  if (error.code === 'ETIMEDOUT') return 408;
  return 500;
}

/**
 * Memory usage formatla / Format memory usage
 */
export function formatMemoryUsage(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Duration formatla (milisaniye) / Format duration (milliseconds)
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Truncate text / Metni kısalt
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate random string / Rastgele dize oluştur
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Deep clone object / Nesneyi derinlemesine kopyala
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if running in production / Üretim ortamında çalışıp çalışmadığını kontrol et
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get current timestamp / Geçerli zaman damgasını al
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Validate environment variable / Ortam değişkenini doğrula
 */
export function validateEnvVar(name: string, value: string | undefined, required: boolean = false): string {
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set / Gerekli ortam değişkeni ${name} ayarlanmadı`);
  }
  return value || '';
} 
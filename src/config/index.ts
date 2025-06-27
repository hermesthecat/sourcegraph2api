/**
 * Konfigürasyon Yöneticisi / Configuration Manager
 * Environment variables'ları yönetir ve uygulama ayarlarını sağlar. / Manages environment variables and provides application settings.
 */

import dotenv from 'dotenv';
import { AppConfig } from '../types';

// .env dosyasını yükle / Load .env file
dotenv.config();

/**
 * Environment variable'ı string olarak al / Get environment variable as a string
 */
function getEnvString(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Environment variable'ı number olarak al / Get environment variable as a number
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Environment variable'ı boolean olarak al / Get environment variable as a boolean
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Environment variable'ı array olarak al (virgülle ayrılmış) / Get environment variable as an array (comma-separated)
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = getEnvString(key);
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : defaultValue;
}

/**
 * Uygulama konfigürasyonu / Application Configuration
 */
export const config: AppConfig = {
  // Temel ayarlar / Core settings
  port: getEnvNumber('PORT', 7033),
  debug: getEnvBoolean('DEBUG', false),
  nodeEnv: (getEnvString('NODE_ENV', 'production') as 'development' | 'production' | 'test'),

  // Sourcegraph ayarları / Sourcegraph settings
  sgCookie: getEnvString('SG_COOKIE'),

  // API güvenlik ayarları / API security settings
  apiSecret: getEnvString('API_SECRET'),
  apiSecrets: getEnvArray('API_SECRET'),

  // Network ayarları / Network settings
  proxyUrl: getEnvString('PROXY_URL'),
  userAgent: getEnvString(
    'USER_AGENT',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome'
  ),

  // Rate limiting / Hız Sınırlaması
  requestRateLimit: getEnvNumber('REQUEST_RATE_LIMIT', 60),
  rateLimitCookieLockDuration: getEnvNumber('RATE_LIMIT_COOKIE_LOCK_DURATION', 60),

  // Özellikler / Features
  routePrefix: getEnvString('ROUTE_PREFIX'),
  swaggerEnable: getEnvBoolean('SWAGGER_ENABLE', true),

  // Güvenlik / Security
  ipBlackList: getEnvArray('IP_BLACK_LIST'),
};

/**
 * Sourcegraph model bilgileri / Sourcegraph model information
 */
export const modelRegistry: Record<string, { modelRef: string; maxTokens: number }> = {
  'claude-sonnet-4-latest': {
    modelRef: 'anthropic::2024-10-22::claude-sonnet-4-latest',
    maxTokens: 64000
  },
  'claude-sonnet-4-thinking-latest': {
    modelRef: 'anthropic::2024-10-22::claude-sonnet-4-thinking-latest',
    maxTokens: 64000
  },
  'claude-3-7-sonnet-latest': {
    modelRef: 'anthropic::2024-10-22::claude-3-7-sonnet-latest',
    maxTokens: 64000
  },
  'claude-3-7-sonnet-extended-thinking': {
    modelRef: 'anthropic::2024-10-22::claude-3-7-sonnet-extended-thinking',
    maxTokens: 64000
  },
  'claude-3-5-sonnet-latest': {
    modelRef: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
    maxTokens: 64000
  },
  'claude-3-opus': {
    modelRef: 'anthropic::2023-06-01::claude-3-opus',
    maxTokens: 64000
  },
  'claude-3-5-haiku-latest': {
    modelRef: 'anthropic::2024-10-22::claude-3-5-haiku-latest',
    maxTokens: 64000
  },
  'claude-3-haiku': {
    modelRef: 'anthropic::2023-06-01::claude-3-haiku',
    maxTokens: 64000
  },
  'claude-3.5-sonnet': {
    modelRef: 'anthropic::2023-06-01::claude-3.5-sonnet',
    maxTokens: 64000
  },
  'claude-3-5-sonnet-20240620': {
    modelRef: 'anthropic::2023-06-01::claude-3-5-sonnet-20240620',
    maxTokens: 64000
  },
  'claude-3-sonnet': {
    modelRef: 'anthropic::2023-06-01::claude-3-sonnet',
    maxTokens: 64000
  },
  'claude-2.1': {
    modelRef: 'anthropic::2023-01-01::claude-2.1',
    maxTokens: 64000
  },
  'claude-2.0': {
    modelRef: 'anthropic::2023-01-01::claude-2.0',
    maxTokens: 64000
  },
  'deepseek-v3': {
    modelRef: 'fireworks::v1::deepseek-v3',
    maxTokens: 64000
  },
  'gemini-1.5-pro': {
    modelRef: 'google::v1::gemini-1.5-pro',
    maxTokens: 64000
  },
  'gemini-1.5-pro-002': {
    modelRef: 'google::v1::gemini-1.5-pro-002',
    maxTokens: 64000
  },
  'gemini-2.0-flash-exp': {
    modelRef: 'google::v1::gemini-2.0-flash-exp',
    maxTokens: 64000
  },
  'gemini-2.0-flash': {
    modelRef: 'google::v1::gemini-2.0-flash',
    maxTokens: 64000
  },
  'gemini-2.5-flash-preview-04-17': {
    modelRef: 'google::v1::gemini-2.5-flash-preview-04-17',
    maxTokens: 64000
  },
  'gemini-2.0-flash-lite': {
    modelRef: 'google::v1::gemini-2.0-flash-lite',
    maxTokens: 64000
  },
  'gemini-2.0-pro-exp-02-05': {
    modelRef: 'google::v1::gemini-2.0-pro-exp-02-05',
    maxTokens: 64000
  },
  'gemini-2.5-pro-preview-03-25': {
    modelRef: 'google::v1::gemini-2.5-pro-preview-03-25',
    maxTokens: 64000
  },
  'gemini-1.5-flash': {
    modelRef: 'google::v1::gemini-1.5-flash',
    maxTokens: 64000
  },
  'gemini-1.5-flash-002': {
    modelRef: 'google::v1::gemini-1.5-flash-002',
    maxTokens: 64000
  },
  'mixtral-8x7b-instruct': {
    modelRef: 'mistral::v1::mixtral-8x7b-instruct',
    maxTokens: 64000
  },
  'mixtral-8x22b-instruct': {
    modelRef: 'mistral::v1::mixtral-8x22b-instruct',
    maxTokens: 64000
  },
  'gpt-4o': {
    modelRef: 'openai::2024-02-01::gpt-4o',
    maxTokens: 64000
  },
  'gpt-4.1': {
    modelRef: 'openai::2024-02-01::gpt-4.1',
    maxTokens: 64000
  },
  'gpt-4o-mini': {
    modelRef: 'openai::2024-02-01::gpt-4o-mini',
    maxTokens: 64000
  },
  'gpt-4.1-mini': {
    modelRef: 'openai::2024-02-01::gpt-4.1-mini',
    maxTokens: 64000
  },
  'gpt-4.1-nano': {
    modelRef: 'openai::2024-02-01::gpt-4.1-nano',
    maxTokens: 64000
  },
  'o3-mini-medium': {
    modelRef: 'openai::2024-02-01::o3-mini-medium',
    maxTokens: 64000
  },
  'o3': {
    modelRef: 'openai::2024-02-01::o3',
    maxTokens: 64000
  },
  'o4-mini': {
    modelRef: 'openai::2024-02-01::o4-mini',
    maxTokens: 64000
  },
  'o1': {
    modelRef: 'openai::2024-02-01::o1',
    maxTokens: 64000
  },
  'gpt-4-turbo': {
    modelRef: 'openai::2024-02-01::gpt-4-turbo',
    maxTokens: 64000
  },
  'gpt-3.5-turbo': {
    modelRef: 'openai::2024-02-01::gpt-3.5-turbo',
    maxTokens: 64000
  },
};

/**
 * Model bilgisini al / Get model information
 */
export function getModelInfo(modelName: string) {
  return modelRegistry[modelName];
}

/**
 * Desteklenen modellerin listesini al / Get the list of supported models
 */
export function getModelList(): string[] {
  return Object.keys(modelRegistry);
}

/**
 * Konfigürasyonu doğrula / Validate configuration
 */
export function validateConfig(): void {
  if (!config.sgCookie) {
    throw new Error('SG_COOKIE environment variable is required / SG_COOKIE ortam değişkeni gereklidir');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be between 1 and 65535 / PORT 1 ile 65535 arasında olmalıdır');
  }
}

/**
 * Konfigürasyonu konsola yazdır (debug için) / Log configuration to console (for debugging)
 */
export function logConfig(): void {
  if (config.debug) {
    console.log('📋 Configuration loaded: / Konfigürasyon yüklendi:');
    console.log(`   Port / Bağlantı Noktası: ${config.port}`);
    console.log(`   Debug / Hata Ayıklama: ${config.debug}`);
    console.log(`   Node Environment / Ortam: ${config.nodeEnv}`);
    console.log(`   Route Prefix / Rota Ön Eki: ${config.routePrefix || 'none / yok'}`);
    console.log(`   Swagger Enabled / Swagger Aktif: ${config.swaggerEnable}`);
    console.log(`   Rate Limit / Hız Limiti: ${config.requestRateLimit}/min`);
    console.log(`   Proxy URL / Proxy Adresi: ${config.proxyUrl || 'none / yok'}`);
    console.log(`   Models Available / Mevcut Modeller: ${getModelList().length}`);
  }
} 
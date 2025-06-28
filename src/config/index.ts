/**
 * Dynamic Configuration Manager / Dinamik Konfigürasyon Yöneticisi
 * Ayarları veritabanından yükler ve uygulama çalışırken güncellenmesine olanak tanır.
 * Loads settings from the database and allows them to be updated while the application is running.
 */

import dotenv from 'dotenv';
import { log } from '../utils/logger';
import { Setting } from '../models/setting.model';
import { AppConfig, BaseConfig, DynamicConfig } from '../types';

// .env dosyasını SADECE temel, yeniden başlatma gerektiren ayarlar için yükle
dotenv.config();

// Bellekte tutulacak olan, anlık ve güncel konfigürasyon nesnesi
// Bu nesne, uygulama genelinde "gerçeğin kaynağı" (source of truth) olacak.
let liveConfig: Partial<AppConfig> = {};

/**
 * .env dosyasından temel (yeniden başlatma gerektiren) ayarları okur.
 */
function getBaseConfig(): BaseConfig {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 7033;
  const host = process.env.HOST || '0.0.0.0';
  const debug = process.env.DEBUG?.toLowerCase() === 'true' || false;
  const nodeEnv = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'production';

  return { port, host, debug, nodeEnv };
}

/**
 * Ayarları veritabanından yükler ve bellekteki `liveConfig` nesnesini doldurur.
 * Ayrıca, veritabanında eksik olan varsayılan ayarları oluşturur.
 */
export async function loadConfigFromDb(): Promise<void> {
  log.info('🔄 Ayarlar veritabanından yükleniyor...');
  try {
    const settingsFromDb = await Setting.findAll();
    const dbSettingsMap = new Map(settingsFromDb.map(s => [s.key, s.value]));

    const defaults: Record<keyof DynamicConfig, any> = {
      sessionSecret: 's2a-super-secret-key-please-change-me-in-admin-panel',
      requestRateLimit: '60',
      routePrefix: '',
      proxyUrl: '',
      ipBlacklist: '',
      logLevel: 'info',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      tz: 'Europe/Istanbul',
      reasoningHide: 'false', // Veritabanında string olarak saklanacak
      sourcegraphBaseUrl: 'https://sourcegraph.com',
      chatEndpoint: '/.api/completions/stream?api-version=9&client-name=vscode&client-version=1.82.0',
      swaggerEnable: 'false', // Yeni eklendi
    };

    const configToCreate: { key: string, value: string }[] = [];

    // Veritabanındaki ayarları `liveConfig`'e yükle ve eksikleri bul
    for (const key of Object.keys(defaults) as Array<keyof DynamicConfig>) {
      if (dbSettingsMap.has(key)) {
        liveConfig[key] = dbSettingsMap.get(key) as any;
      } else {
        log.warn(`Veritabanında eksik ayar: '${key}'. Varsayılan değer kullanılacak ve oluşturulacak.`);
        liveConfig[key] = defaults[key] as any;
        configToCreate.push({ key, value: defaults[key] });
      }
    }

    // Eksik ayarları veritabanına toplu olarak ekle
    if (configToCreate.length > 0) {
      await Setting.bulkCreate(configToCreate);
      log.info(`${configToCreate.length} adet eksik ayar veritabanına eklendi.`);
    }

    // String'den doğru tiplere dönüştürme
    liveConfig.requestRateLimit = parseInt(String(liveConfig.requestRateLimit), 10);
    liveConfig.ipBlacklist = String(liveConfig.ipBlacklist || '').split(',').map(ip => ip.trim()).filter(Boolean);
    liveConfig.reasoningHide = String(liveConfig.reasoningHide).toLowerCase() === 'true';
    liveConfig.swaggerEnable = String(liveConfig.swaggerEnable).toLowerCase() === 'true'; // Yeni eklendi

    log.info('✅ Ayarlar başarıyla yüklendi ve belleğe alındı.');

  } catch (error) {
    log.error('❌ Ayarlar veritabanından yüklenirken kritik bir hata oluştu:', error);
    // Bu hata kritik olduğu için uygulamayı durdurmak daha güvenli olabilir.
    process.exit(1);
  }
}

/**
 * Uygulama genelinde kullanılacak olan yapılandırma nesnesi.
 * Bu bir proxy nesnesidir, böylece `config.PORT` gibi bir değere erişildiğinde
 * her zaman en güncel değeri (bellekteki `liveConfig`'ten) alır.
 */
export const config = new Proxy({}, {
  get(_target, prop: string) {
    // Önce bellekteki dinamik ayarlara bak
    // @ts-ignore
    if (liveConfig.hasOwnProperty(prop)) {
      // @ts-ignore
      return liveConfig[prop];
    }

    // Sonra .env'den okunan temel ayarlara bak
    const baseConfig = getBaseConfig();
    // @ts-ignore
    if (baseConfig.hasOwnProperty(prop)) {
      // @ts-ignore
      return baseConfig[prop];
    }

    // Hiçbir yerde bulunamazsa undefined dön
    return undefined;
  }
}) as AppConfig;


/**
 * Bellekteki yapılandırmayı anında günceller.
 * Bu fonksiyon, ayarlar panelinden bir ayar güncellendiğinde çağrılır.
 * @param key Güncellenecek ayarın anahtarı
 * @param value Yeni değer
 */
export function updateLiveConfig(key: keyof AppConfig, value: any) {
  let processedValue = value;
  // Tipe göre işlem yap
  if (key === 'requestRateLimit') {
    processedValue = parseInt(value, 10);
  } else if (key === 'ipBlacklist') {
    processedValue = String(value || '').split(',').map(ip => ip.trim()).filter(Boolean);
  } else if (key === 'reasoningHide') {
    processedValue = String(value).toLowerCase() === 'true';
  } else if (key === 'swaggerEnable') { // Yeni eklendi
    processedValue = String(value).toLowerCase() === 'true';
  }

  // @ts-ignore
  liveConfig[key] = processedValue;
  log.info(`Bellekteki ayar güncellendi: ${key} = ${JSON.stringify(processedValue)}`);
}

// ====================================================================
// Model bilgileri statik kalabilir, çünkü bunlar kodla yönetiliyor.
// ====================================================================

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

export function getModelInfo(modelName: string) {
  return modelRegistry[modelName];
}

export function getModelList(): string[] {
  return Object.keys(modelRegistry);
}
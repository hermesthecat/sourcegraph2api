/**
 * Dynamic Configuration Manager
 * Loads settings from the database and allows them to be updated while the application is running.
 */

import dotenv from 'dotenv';
import { log } from '../utils/logger';
import { Setting } from '../models/setting.model';
import { AppConfig, BaseConfig, DynamicConfig } from '../types';

// Load .env file ONLY for core, restart-required settings
dotenv.config();

// The live and up-to-date configuration object to be kept in memory
// This object will be the "source of truth" throughout the application.
let liveConfig: Partial<AppConfig> = {};

/**
 * Reads core (restart-required) settings from the .env file.
 */
function getBaseConfig(): BaseConfig {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 7033;
  const host = process.env.HOST || '0.0.0.0';
  const debug = process.env.DEBUG?.toLowerCase() === 'true' || false;
  const nodeEnv = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'production';

  return { port, host, debug, nodeEnv };
}

/**
 * Loads settings from the database and populates the `liveConfig` object in memory.
 * Also, creates default settings that are missing in the database.
 */
export async function loadConfigFromDb(): Promise<void> {
  log.info('🔄 Loading settings from the database...');
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
      reasoningHide: 'false', // Stored as string in the database
      sourcegraphBaseUrl: 'https://sourcegraph.com',
      chatEndpoint: '/.api/completions/stream?api-version=9&client-name=vscode&client-version=1.82.0',
      swaggerEnable: 'false', // Newly added
    };

    const configToCreate: { key: string, value: string }[] = [];

    // Load settings from the database to `liveConfig` and find missing ones
    for (const key of Object.keys(defaults) as Array<keyof DynamicConfig>) {
      if (dbSettingsMap.has(key)) {
        liveConfig[key] = dbSettingsMap.get(key) as any;
      } else {
        log.warn(`Missing setting in database: '${key}'. Using default value and will create.`);
        liveConfig[key] = defaults[key] as any;
        configToCreate.push({ key, value: defaults[key] });
      }
    }

    // Add missing settings to the database in bulk
    if (configToCreate.length > 0) {
      await Setting.bulkCreate(configToCreate);
      log.info(`${configToCreate.length} missing settings added to the database.`);
    }

    // Convert from string to correct types
    liveConfig.requestRateLimit = parseInt(String(liveConfig.requestRateLimit), 10);
    liveConfig.ipBlacklist = String(liveConfig.ipBlacklist || '').split(',').map(ip => ip.trim()).filter(Boolean);
    liveConfig.reasoningHide = String(liveConfig.reasoningHide).toLowerCase() === 'true';
    liveConfig.swaggerEnable = String(liveConfig.swaggerEnable).toLowerCase() === 'true'; // Newly added

    log.info('✅ Settings successfully loaded and cached.');

  } catch (error) {
    log.error('❌ A critical error occurred while loading settings from the database:', error);
    // It might be safer to stop the application as this error is critical.
    process.exit(1);
  }
}

/**
 * The configuration object to be used throughout the application.
 * This is a proxy object, so when a value like `config.PORT` is accessed,
 * it always retrieves the most up-to-date value (from `liveConfig` in memory).
 */
export const config = new Proxy({}, {
  get(_target, prop: string) {
    // First look at dynamic settings in memory
    // @ts-ignore
    if (liveConfig.hasOwnProperty(prop)) {
      // @ts-ignore
      return liveConfig[prop];
    }

    // Then look at base settings read from .env
    const baseConfig = getBaseConfig();
    // @ts-ignore
    if (baseConfig.hasOwnProperty(prop)) {
      // @ts-ignore
      return baseConfig[prop];
    }

    // Return undefined if not found anywhere
    return undefined;
  }
}) as AppConfig;


/**
 * Instantly updates the configuration in memory.
 * This function is called when a setting is updated from the settings panel.
 * @param key The key of the setting to update
 * @param value The new value
 */
export function updateLiveConfig(key: keyof AppConfig, value: any) {
  let processedValue = value;
  // Process based on type
  if (key === 'requestRateLimit') {
    processedValue = parseInt(value, 10);
  } else if (key === 'ipBlacklist') {
    processedValue = String(value || '').split(',').map(ip => ip.trim()).filter(Boolean);
  } else if (key === 'reasoningHide') {
    processedValue = String(value).toLowerCase() === 'true';
  } else if (key === 'swaggerEnable') { // Newly added
    processedValue = String(value).toLowerCase() === 'true';
  }

  // @ts-ignore
  liveConfig[key] = processedValue;
  log.info(`In-memory setting updated: ${key} = ${JSON.stringify(processedValue)}`);
}

// ====================================================================
// Model information can remain static as it is managed by code.
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
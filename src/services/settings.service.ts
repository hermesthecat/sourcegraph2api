/**
 * Settings Service / Ayarlar Servisi
 * .env dosyasındaki ayarları yönetmek için fonksiyonlar içerir
 * Contains functions for managing settings in the .env file
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { log } from '../utils/logger';

// .env dosyasının tam yolu
const envFilePath = path.join(process.cwd(), '.env');

/**
 * .env dosyasından SADECE düzenlenebilir ayarları okur.
 * Reads ONLY the editable settings from the .env file.
 * @returns {Record<string, string>} Düzenlenebilir ayarların bir nesnesi.
 */
export function getEditableSettings(): Record<string, string> {
  try {
    const editableKeys = [
      'SESSION_SECRET',
      'REQUEST_RATE_LIMIT',
      'ROUTE_PREFIX',
      'PROXY_URL',
      'IP_BLACKLIST',
      'LOG_LEVEL'
    ];

    const settings: Record<string, string> = {};
    const fileContent = fs.readFileSync(envFilePath, { encoding: 'utf8' });
    const lines = fileContent.split('\n');

    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) {
        continue;
      }
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (editableKeys.includes(key.trim())) {
        settings[key.trim()] = value.trim();
      }
    }
    
    // Eğer .env dosyasında olmayan ama config'de olan ayar varsa onu da ekle
    // (örn: dosya ilk oluşturulduğunda boş olabilir)
    settings.SESSION_SECRET = settings.SESSION_SECRET || config.sessionSecret;
    settings.REQUEST_RATE_LIMIT = settings.REQUEST_RATE_LIMIT || String(config.requestRateLimit);
    settings.ROUTE_PREFIX = settings.ROUTE_PREFIX || config.routePrefix || '';
    settings.PROXY_URL = settings.PROXY_URL || config.proxyUrl || '';
    settings.IP_BLACKLIST = settings.IP_BLACKLIST || config.ipBlacklist.join(',');
    settings.LOG_LEVEL = settings.LOG_LEVEL || config.logLevel || 'info';


    return settings;
  } catch (error) {
    log.error('.env dosyası okunurken hata:', error);
    // Hata durumunda config'den varsayılanları dön
    return {
        SESSION_SECRET: config.sessionSecret,
        REQUEST_RATE_LIMIT: String(config.requestRateLimit),
        ROUTE_PREFIX: config.routePrefix || '',
        PROXY_URL: config.proxyUrl || '',
        IP_BLACKLIST: config.ipBlacklist.join(','),
        LOG_LEVEL: config.logLevel || 'info',
    };
  }
}

/**
 * .env dosyasını yeni ayarlarla günceller.
 * Var olan değerleri günceller, olmayanları ekler, yorumları korur.
 * @param {Record<string, string>} newSettings - Güncellenecek ayarlar.
 * @returns {Promise<void>}
 */
export async function updateEnvFile(newSettings: Record<string, string>): Promise<void> {
  try {
    let fileContent = fs.readFileSync(envFilePath, { encoding: 'utf8' });
    let lines = fileContent.split('\n');
    const updatedKeys = new Set<string>();

    // Var olan anahtarları güncelle
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '' || line.startsWith('#')) {
        continue;
      }
      const [key] = line.split('=');
      if (newSettings.hasOwnProperty(key)) {
        lines[i] = `${key}=${newSettings[key]}`;
        updatedKeys.add(key);
      }
    }

    // .env dosyasında olmayan yeni anahtarları sona ekle
    for (const key in newSettings) {
      if (!updatedKeys.has(key)) {
        lines.push(`${key}=${newSettings[key]}`);
      }
    }

    // Dosyayı yaz
    fs.writeFileSync(envFilePath, lines.join('\n'), { encoding: 'utf8' });
    log.info('.env dosyası başarıyla güncellendi. Değişikliklerin etkili olması için sunucunun yeniden başlatılması gerekiyor.');

  } catch (error) {
    log.error('.env dosyası güncellenirken hata:', error);
    throw new Error('.env dosyası güncellenirken bir hata oluştu.');
  }
}
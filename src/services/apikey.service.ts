/**
 * ApiKey Service / API Anahtarı Servisi
 * Veritabanındaki API anahtarlarını yönetmek için fonksiyonlar içerir
 * Contains functions for managing API keys in the database
 */

import { ApiKey } from '../models';
import { log } from '../utils/logger';

/**
 * Verilen bir API anahtarının veritabanında mevcut ve aktif olup olmadığını kontrol eder.
 * Checks if a given API key exists and is active in the database.
 * @param {string} key - Kontrol edilecek API anahtarı / The API key to check
 * @returns {Promise<ApiKey | null>} - Geçerliyse ApiKey nesnesini, değilse null döner.
 */
export async function isValidActiveApiKey(key: string): Promise<ApiKey | null> {
  if (!key) {
    return null;
  }
  try {
    const apiKey = await ApiKey.findOne({
      where: {
        key: key,
        isActive: true,
      },
    });
    return apiKey;
  } catch (error) {
    log.error('API anahtarı doğrulanırken veritabanı hatası:', error);
    return null;
  }
}

/**
 * Tüm API anahtarlarını veritabanından getirir / Fetches all API keys from the database
 * @returns {Promise<ApiKey[]>}
 */
export async function getAllApiKeys(): Promise<ApiKey[]> {
  try {
    const apiKeys = await ApiKey.findAll({
      order: [['createdAt', 'DESC']],
    });
    return apiKeys;
  } catch (error) {
    log.error('Tüm API anahtarları alınırken hata oluştu:', error);
    throw error;
  }
}

/**
 * Yeni bir API anahtarı ekler / Adds a new API key
 * @param {string} alias - API anahtarı için takma ad / Alias for the API key
 * @param {string} key - Oluşturulan API anahtarı / The generated API key
 * @returns {Promise<ApiKey>}
 */
export async function addApiKey(alias: string, key: string): Promise<ApiKey> {
  try {
    const newApiKey = await ApiKey.create({
      alias,
      key,
      isActive: true,
    });
    log.info(`Yeni API anahtarı eklendi: ${alias} (ID: ${newApiKey.id})`);
    return newApiKey;
  } catch (error) {
    log.error(`API anahtarı eklenirken hata: ${alias}`, error);
    throw error;
  }
}

/**
 * Bir API anahtarını ID'sine göre siler / Deletes an API key by its ID
 * @param {number} id - Silinecek API anahtarının ID'si / The ID of the API key to delete
 * @returns {Promise<void>}
 */
export async function deleteApiKey(id: number): Promise<void> {
  try {
    const result = await ApiKey.destroy({
      where: { id },
    });
    if (result > 0) {
      log.info(`API anahtarı silindi: (ID: ${id})`);
    } else {
      log.warn(`Silinecek API anahtarı bulunamadı: (ID: ${id})`);
    }
  } catch (error) {
    log.error(`API anahtarı silinirken hata (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Bir API anahtarının 'isActive' durumunu tersine çevirir / Toggles the 'isActive' status of an API key
 * @param {number} id - Durumu değiştirilecek API anahtarının ID'si / The ID of the API key to toggle
 * @returns {Promise<ApiKey | null>}
 */
export async function toggleApiKeyStatus(id: number): Promise<ApiKey | null> {
  try {
    const apiKey = await ApiKey.findByPk(id);
    if (apiKey) {
      apiKey.isActive = !apiKey.isActive;
      await apiKey.save();
      log.info(`API anahtarı durumu güncellendi: ${apiKey.alias} (ID: ${id}), yeni durum: ${apiKey.isActive ? 'Aktif' : 'Pasif'}`);
      return apiKey;
    } else {
      log.warn(`Durumu güncellenecek API anahtarı bulunamadı: (ID: ${id})`);
      return null;
    }
  } catch (error) {
    log.error(`API anahtarı durumu güncellenirken hata (ID: ${id}):`, error);
    throw error;
  }
} 
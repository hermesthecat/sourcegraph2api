/**
 * Settings Service / Ayarlar Servisi
 * Veritabanındaki ayarları yönetmek için fonksiyonlar içerir.
 * Contains functions for managing settings in the database.
 */

import { Setting } from '../models';
import { log } from '../utils/logger';
import { updateLiveConfig } from '../config';
import { DynamicConfig } from '../types';

/**
 * Veritabanından DÜZENLENEBİLİR tüm ayarları okur.
 * Reads all EDITABLE settings from the database.
 * @returns {Promise<Record<string, string>>} Düzenlenebilir ayarların bir nesnesi.
 */
export async function getEditableSettings(): Promise<Record<string, string>> {
  try {
    const settings = await Setting.findAll();
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }
    return settingsMap;
  } catch (error) {
    log.error('Veritabanından ayarlar okunurken hata:', error);
    throw new Error('Ayarlar okunurken bir veritabanı hatası oluştu.');
  }
}

/**
 * Veritabanındaki ayarları toplu olarak günceller ve bellekteki
 * anlık yapılandırmayı yeniler.
 * @param {Record<string, string>} newSettings - Güncellenecek ayarlar.
 * @returns {Promise<void>}
 */
export async function updateSettings(newSettings: Record<string, string>): Promise<void> {
  const transaction = await Setting.sequelize!.transaction();
  try {
    for (const key in newSettings) {
      const value = newSettings[key];

      // 1. Veritabanını Güncelle
      await Setting.upsert({ key, value }, { transaction });

      // 2. Bellekteki Anlık Yapılandırmayı Güncelle
      updateLiveConfig(key as keyof DynamicConfig, value);
    }

    await transaction.commit();
    log.info('Ayarlar başarıyla veritabanında ve bellekte güncellendi.');
  } catch (error) {
    await transaction.rollback();
    log.error('Ayarlar güncellenirken hata:', error);
    throw new Error('Ayarlar güncellenirken bir veritabanı hatası oluştu.');
  }
}
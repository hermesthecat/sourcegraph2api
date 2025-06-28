/**
 * Settings Service
 * Contains functions for managing settings in the database.
 */

import { Setting } from '../models';
import { log } from '../utils/logger';
import { updateLiveConfig } from '../config';
import { DynamicConfig } from '../types';

/**
 * Reads all EDITABLE settings from the database.
 * @returns {Promise<Record<string, string>>} An object of editable settings.
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
    log.error('Error reading settings from database:', error);
    throw new Error('A database error occurred while reading settings.');
  }
}

/**
 * Updates settings in the database in bulk and refreshes the in-memory
 * live configuration.
 * @param {Record<string, string>} newSettings - Settings to be updated.
 * @returns {Promise<void>}
 */
export async function updateSettings(newSettings: Record<string, string>): Promise<void> {
  const transaction = await Setting.sequelize!.transaction();
  try {
    for (const key in newSettings) {
      const value = newSettings[key];

      // 1. Update the database
      await Setting.upsert({ key, value }, { transaction });

      // 2. Update the in-memory live configuration
      updateLiveConfig(key as keyof DynamicConfig, value);
    }

    await transaction.commit();
    log.info('Settings successfully updated in database and in-memory.');
  } catch (error) {
    await transaction.rollback();
    log.error('Error updating settings:', error);
    throw new Error('A database error occurred while updating settings.');
  }
}
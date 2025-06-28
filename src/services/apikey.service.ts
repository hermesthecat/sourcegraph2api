/**
 * ApiKey Service
 * Contains functions for managing API keys in the database
 */

import { ApiKey } from '../models';
import { log } from '../utils/logger';

/**
 * Checks if a given API key exists and is active in the database.
 * @param {string} key - The API key to check
 * @returns {Promise<ApiKey | null>} - Returns ApiKey object if valid, null otherwise.
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
    log.error('Database error while validating API key:', error);
    return null;
  }
}

/**
 * Fetches all API keys from the database
 * @returns {Promise<ApiKey[]>}
 */
export async function getAllApiKeys(): Promise<ApiKey[]> {
  try {
    const apiKeys = await ApiKey.findAll({
      order: [['createdAt', 'DESC']],
    });
    return apiKeys;
  } catch (error) {
    log.error('Error occurred while fetching all API keys:', error);
    throw error;
  }
}

/**
 * Adds a new API key
 * @param {string} alias - Alias for the API key
 * @param {string} key - The generated API key
 * @returns {Promise<ApiKey>}
 */
export async function addApiKey(alias: string, key: string): Promise<ApiKey> {
  try {
    const newApiKey = await ApiKey.create({
      alias,
      key,
      isActive: true,
    });
    log.info(`New API key added: ${alias} (ID: ${newApiKey.id})`);
    return newApiKey;
  } catch (error) {
    log.error(`Error adding API key: ${alias}`, error);
    throw error;
  }
}

/**
 * Deletes an API key by its ID
 * @param {number} id - The ID of the API key to delete
 * @returns {Promise<void>}
 */
export async function deleteApiKey(id: number): Promise<void> {
  try {
    const result = await ApiKey.destroy({
      where: { id },
    });
    if (result > 0) {
      log.info(`API key deleted: (ID: ${id})`);
    } else {
      log.warn(`API key to delete not found: (ID: ${id})`);
    }
  } catch (error) {
    log.error(`Error deleting API key (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Toggles the 'isActive' status of an API key
 * @param {number} id - The ID of the API key to toggle
 * @returns {Promise<ApiKey | null>}
 */
export async function toggleApiKeyStatus(id: number): Promise<ApiKey | null> {
  try {
    const apiKey = await ApiKey.findByPk(id);
    if (apiKey) {
      apiKey.isActive = !apiKey.isActive;
      await apiKey.save();
      log.info(`API key status updated: ${apiKey.alias} (ID: ${id}), new status: ${apiKey.isActive ? 'Active' : 'Inactive'}`);
      return apiKey;
    } else {
      log.warn(`API key to update status not found: (ID: ${id})`);
      return null;
    }
  } catch (error) {
    log.error(`Error updating API key status (ID: ${id}):`, error);
    throw error;
  }
} 
/**
 * Cookie Service
 * Contains functions for managing cookies in the database
 */

import { Cookie } from '../models/cookie.model';
import { log } from '../utils/logger';
import { Sequelize } from 'sequelize';

/**
 * Fetches all cookies from the database
 * @returns {Promise<Cookie[]>}
 */
export async function getAllCookies(): Promise<Cookie[]> {
  try {
    const cookies = await Cookie.findAll({
      order: [['createdAt', 'DESC']],
    });
    return cookies;
  } catch (error) {
    log.error('Error fetching all cookies:', error);
    throw error;
  }
}

/**
 * Adds a new cookie
 * @param {string} alias - Alias for the cookie
 * @param {string} cookieValue - The actual cookie value
 * @returns {Promise<Cookie>}
 */
export async function addCookie(alias: string, cookieValue: string): Promise<Cookie> {
  try {
    const newCookie = await Cookie.create({
      alias,
      cookieValue,
      isActive: true,
    });
    log.info(`New cookie added: ${alias} (ID: ${newCookie.id})`);
    return newCookie;
  } catch (error) {
    log.error(`Error adding cookie: ${alias}`, error);
    throw error;
  }
}

/**
 * Deletes a cookie by its ID
 * @param {number} id - The ID of the cookie to delete
 * @returns {Promise<void>}
 */
export async function deleteCookie(id: number): Promise<void> {
  try {
    const result = await Cookie.destroy({
      where: { id },
    });
    if (result > 0) {
      log.info(`Cookie deleted: (ID: ${id})`);
    } else {
      log.warn(`Cookie to delete not found: (ID: ${id})`);
    }
  } catch (error) {
    log.error(`Error deleting cookie (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Toggles the 'isActive' status of a cookie
 * @param {number} id - The ID of the cookie to toggle
 * @returns {Promise<Cookie | null>}
 */
export async function toggleCookieStatus(id: number): Promise<Cookie | null> {
  try {
    const cookie = await Cookie.findByPk(id);
    if (cookie) {
      cookie.isActive = !cookie.isActive;
      await cookie.save();
      log.info(`Cookie status updated: ${cookie.alias} (ID: ${id}), new status: ${cookie.isActive ? 'Active' : 'Inactive'}`);
      return cookie;
    } else {
      log.warn(`Cookie to update status not found: (ID: ${id})`);
      return null;
    }
  } catch (error) {
    log.error(`Error updating cookie status (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Fetches a random ACTIVE cookie from the database
 * @returns {Promise<Cookie | null>}
 */
export async function getRandomActiveCookie(): Promise<Cookie | null> {
  try {
    const activeCookie = await Cookie.findOne({
      where: { isActive: true },
      order: Sequelize.literal('RANDOM()'), // Random ordering for SQLite
    });

    if (activeCookie) {
      log.debug(`Random cookie selected from pool: ${activeCookie.alias} (ID: ${activeCookie.id})`);
    } else {
      log.warn('No active cookies found in the pool!');
    }

    return activeCookie;
  } catch (error) {
    log.error('Error occurred while fetching random active cookie:', error);
    return null; // Return null on error to prevent system crash
  }
}

/**
 * Fetches a single cookie by its ID
 * @param {number} id
 * @returns {Promise<Cookie | null>}
 */
export async function getCookieById(id: number): Promise<Cookie | null> {
  try {
    const cookie = await Cookie.findByPk(id);
    return cookie;
  } catch (error) {
    log.error(`Error fetching cookie (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Updates a cookie's information
 * @param {number} id - The ID of the cookie to update
 * @param {string} alias - New alias
 * @param {string} cookieValue - New cookie value
 * @returns {Promise<Cookie | null>}
 */
export async function updateCookie(id: number, alias: string, cookieValue: string): Promise<Cookie | null> {
  try {
    const cookie = await Cookie.findByPk(id);
    if (cookie) {
      cookie.alias = alias;
      cookie.cookieValue = cookieValue;
      await cookie.save();
      log.info(`Cookie updated: ${cookie.alias} (ID: ${id})`);
      return cookie;
    } else {
      log.warn(`Cookie to update not found: (ID: ${id})`);
      return null;
    }
  } catch (error) {
    log.error(`Error updating cookie (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Returns the count of active cookies
 * @returns {Promise<number>}
 */
export async function countActiveCookies(): Promise<number> {
  try {
    const count = await Cookie.count({
      where: { isActive: true },
    });
    return count;
  } catch (error) {
    log.error('Error occurred while fetching active cookie count:', error);
    throw error;
  }
}
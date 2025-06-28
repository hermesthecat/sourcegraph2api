/**
 * Cookie Service / Cookie Servisi
 * Veritabanındaki cookie'leri yönetmek için fonksiyonlar içerir
 * Contains functions for managing cookies in the database
 */

import { Cookie } from '../models/cookie.model';
import { log } from '../utils/logger';
import { Sequelize } from 'sequelize';

/**
 * Tüm cookie'leri veritabanından getirir / Fetches all cookies from the database
 * @returns {Promise<Cookie[]>}
 */
export async function getAllCookies(): Promise<Cookie[]> {
  try {
    const cookies = await Cookie.findAll({
      order: [['createdAt', 'DESC']],
    });
    return cookies;
  } catch (error) {
    log.error('Tüm cookie\'ler alınırken hata oluştu / Error fetching all cookies:', error);
    throw error;
  }
}

/**
 * Yeni bir cookie ekler / Adds a new cookie
 * @param {string} alias - Cookie için takma ad / Alias for the cookie
 * @param {string} cookieValue - Gerçek cookie değeri / The actual cookie value
 * @returns {Promise<Cookie>}
 */
export async function addCookie(alias: string, cookieValue: string): Promise<Cookie> {
  try {
    const newCookie = await Cookie.create({
      alias,
      cookieValue,
      isActive: true,
    });
    log.info(`Yeni cookie eklendi: ${alias} (ID: ${newCookie.id})`);
    return newCookie;
  } catch (error) {
    log.error(`Cookie eklenirken hata: ${alias}`, error);
    throw error;
  }
}

/**
 * Bir cookie'yi ID'sine göre siler / Deletes a cookie by its ID
 * @param {number} id - Silinecek cookie'nin ID'si / The ID of the cookie to delete
 * @returns {Promise<void>}
 */
export async function deleteCookie(id: number): Promise<void> {
  try {
    const result = await Cookie.destroy({
      where: { id },
    });
    if (result > 0) {
      log.info(`Cookie silindi: (ID: ${id})`);
    } else {
      log.warn(`Silinecek cookie bulunamadı: (ID: ${id})`);
    }
  } catch (error) {
    log.error(`Cookie silinirken hata (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Bir cookie'nin 'isActive' durumunu tersine çevirir / Toggles the 'isActive' status of a cookie
 * @param {number} id - Durumu değiştirilecek cookie'nin ID'si / The ID of the cookie to toggle
 * @returns {Promise<Cookie | null>}
 */
export async function toggleCookieStatus(id: number): Promise<Cookie | null> {
  try {
    const cookie = await Cookie.findByPk(id);
    if (cookie) {
      cookie.isActive = !cookie.isActive;
      await cookie.save();
      log.info(`Cookie durumu güncellendi: ${cookie.alias} (ID: ${id}), yeni durum: ${cookie.isActive ? 'Aktif' : 'Pasif'}`);
      return cookie;
    } else {
      log.warn(`Durumu güncellenecek cookie bulunamadı: (ID: ${id})`);
      return null;
    }
  } catch (error) {
    log.error(`Cookie durumu güncellenirken hata (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Veritabanından rastgele bir AKTİF cookie getirir
 * Fetches a random ACTIVE cookie from the database
 * @returns {Promise<Cookie | null>}
 */
export async function getRandomActiveCookie(): Promise<Cookie | null> {
  try {
    const activeCookie = await Cookie.findOne({
      where: { isActive: true },
      order: Sequelize.literal('RANDOM()'), // SQLite için rastgele sıralama / Random ordering for SQLite
    });

    if (activeCookie) {
      log.debug(`Havuzdan rastgele cookie seçildi: ${activeCookie.alias} (ID: ${activeCookie.id})`);
    } else {
      log.warn('Havuzda aktif cookie bulunamadı! / No active cookies found in the pool!');
    }

    return activeCookie;
  } catch (error) {
    log.error('Rastgele aktif cookie alınırken hata oluştu:', error);
    return null; // Hata durumunda null dönerek sistemin çökmesini engelle
  }
}

/**
 * Tek bir cookie'yi ID'sine göre getirir / Fetches a single cookie by its ID
 * @param {number} id
 * @returns {Promise<Cookie | null>}
 */
export async function getCookieById(id: number): Promise<Cookie | null> {
  try {
    const cookie = await Cookie.findByPk(id);
    return cookie;
  } catch (error) {
    log.error(`Cookie getirilirken hata (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Bir cookie'nin bilgilerini günceller / Updates a cookie's information
 * @param {number} id - Güncellenecek cookie'nin ID'si
 * @param {string} alias - Yeni takma ad
 * @param {string} cookieValue - Yeni cookie değeri
 * @returns {Promise<Cookie | null>}
 */
export async function updateCookie(id: number, alias: string, cookieValue: string): Promise<Cookie | null> {
  try {
    const cookie = await Cookie.findByPk(id);
    if (cookie) {
      cookie.alias = alias;
      cookie.cookieValue = cookieValue;
      await cookie.save();
      log.info(`Cookie güncellendi: ${cookie.alias} (ID: ${id})`);
      return cookie;
    } else {
      log.warn(`Güncellenecek cookie bulunamadı: (ID: ${id})`);
      return null;
    }
  } catch (error) {
    log.error(`Cookie güncellenirken hata (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * Aktif cookie sayısını döndürür / Returns the count of active cookies
 * @returns {Promise<number>}
 */
export async function countActiveCookies(): Promise<number> {
  try {
    const count = await Cookie.count({
      where: { isActive: true },
    });
    return count;
  } catch (error) {
    log.error('Aktif cookie sayısı alınırken hata oluştu:', error);
    throw error;
  }
}
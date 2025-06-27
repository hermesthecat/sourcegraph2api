/**
 * Database Service / Veritabanı Servisi
 * Sequelize ile veritabanı bağlantısını yönetir / Manages the database connection with Sequelize
 */

import { Sequelize } from 'sequelize';
import { log } from '../utils/logger';
import path from 'path';

// Veritabanı dosyasının yolu (proje kök dizininde) / Path to the database file (in project root)
const storage = path.join(process.cwd(), 'database.sqlite');

log.info(`Veritabanı yolu: ${storage} / Database path: ${storage}`);

// Sequelize instance'ı oluştur / Create a Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: (msg) => log.debug(msg), // SQL sorgularını debug seviyesinde logla / Log SQL queries at debug level
});

/**
 * Veritabanı bağlantısını test et ve senkronize et / Test and synchronize the database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    log.info('Veritabanı bağlantısı başarıyla kuruldu. / Database connection has been established successfully.');

    // Modelleri veritabanı ile senkronize et (tabloları oluştur/güncelle)
    // Synchronize models with the database (create/update tables)
    await sequelize.sync({ alter: true });
    log.info('Tüm modeller başarıyla senkronize edildi. / All models were synchronized successfully.');

  } catch (error) {
    log.error('Veritabanına bağlanılamadı: / Unable to connect to the database:', error);
    // Hata durumunda uygulamayı sonlandır / Terminate the application on error
    process.exit(1);
  }
}

export { sequelize }; 
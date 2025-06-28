/**
 * Database Service / Veritabanı Servisi
 * Sequelize ile veritabanı bağlantısını yönetir / Manages the database connection with Sequelize
 */

import { Sequelize } from 'sequelize';
import { log } from '../utils/logger';
import path from 'path';
import { ApiKey, Cookie, UsageMetric, User } from '../models'; // User modelini import et
import session from 'express-session';
import ConnectSessionSequelize from 'connect-session-sequelize';
import { config } from '../config';

// Veritabanı dosyasının yolu (proje kök dizininde) / Path to the database file (in project root)
const storage = path.join(process.cwd(), 'database.sqlite');

log.info(`Veritabanı yolu: ${storage} / Database path: ${storage}`);

// Sequelize instance'ı oluştur / Create a Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: (msg) => log.debug(msg), // SQL sorgularını debug seviyesinde logla / Log SQL queries at debug level
});

// Sequelize-tabanlı session store oluştur
const SequelizeStore = ConnectSessionSequelize(session.Store);
export const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000, // 15 dakikada bir süresi dolanları temizle
  expiration: 24 * 60 * 60 * 1000  // 24 saat
});

/**
 * Veritabanı bağlantısını test et ve senkronize et / Test and synchronize the database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    log.info('Veritabanı bağlantısı başarıyla kuruldu. / Database connection has been established successfully.');

    // Modelleri ve session store'u veritabanı ile senkronize et
    // alter: true -> Modellerde değişiklik olduğunda tabloyu günceller
    await sequelize.sync({ alter: true });
    await sessionStore.sync();
    log.info('🔄 All models and session store were synchronized successfully.');

    // Başlangıçta admin kullanıcısı yoksa oluştur
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin', // Parola modeldeki hook ile otomatik hash'lenecek
      });
      log.info('👤 Varsayılan admin kullanıcısı oluşturuldu (admin/admin). / Default admin user created.');
    }

  } catch (error) {
    log.error('❌ Veritabanı senkronizasyon hatası: / Database synchronization error:', error);
    // Hata durumunda uygulamayı sonlandır / Terminate the application on error
    process.exit(1);
  }
}

export { sequelize }; 
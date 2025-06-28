/**
 * Database Service / Veritabanı Servisi
 * Sequelize ile veritabanı bağlantısını yönetir / Manages the database connection with Sequelize
 */

import { Sequelize } from 'sequelize';
import { log } from '../utils/logger';
import path from 'path';
import session from 'express-session';
import ConnectSessionSequelize from 'connect-session-sequelize';
import { Umzug, SequelizeStorage } from 'umzug'; // Umzug'u import et
import winston from 'winston'; // Winston'ı doğrudan import et

// Veritabanı dosyasının yolu (proje kök dizininde)
const storage = path.join(process.cwd(), 'database.sqlite');

// Sequelize instance'ı oluştur (Umzug'dan önce tanımlanmalı)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: (msg) => log.debug(msg), // SQL sorgularını debug seviyesinde logla
});

// Umzug için geçici bir logger oluştur
const umzugLogger = winston.createLogger({
  level: 'info', // Başlangıçta info seviyesinde logla
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});


// Umzug instance'ı oluştur
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js', // Migration dosyalarının yolu
    resolve: ({ name, path: migrationPath, context }) => { // context'i de al
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migration = require(migrationPath as string); // Tip kontrolünü atla
      return {
        name,
        // Migration dosyaları context objesi alacak şekilde güncellenecek.
        // Bu context objesi queryInterface ve Sequelize'yi içerecek.
        up: async () => migration.up(context),
        down: async () => migration.down(context),
      };
    },
  },
  context: { queryInterface: sequelize.getQueryInterface(), Sequelize: Sequelize }, // Context'i burada tanımla
  storage: new SequelizeStorage({ sequelize }),
  logger: umzugLogger, // Umzug için özel logger kullan
});

log.info(`Veritabanı yolu: ${storage} / Database path: ${storage}`);

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
  // Döngüsel bağımlılığı kırmak için modelleri ve config'i burada import et
  const { User } = await import('../models/user.model');
  const { config } = await import('../config');

  try {
    await sequelize.authenticate();
    log.info('Veritabanı bağlantısı başarıyla kuruldu. / Database connection has been established successfully.');

    // Migration'ları çalıştır
    log.info('🚀 Veritabanı migrationları çalıştırılıyor... / Running database migrations...');
    // umzug.up() metoduna herhangi bir parametre geçirmeye gerek yok,
    // çünkü context constructor'da zaten tanımlandı.
    await umzug.up();
    log.info('✅ Veritabanı migrationları başarıyla tamamlandı. / Database migrations completed successfully.');

    await sessionStore.sync(); // Session tablosunun da migration ile yönetilmesi gerekecek, şimdilik burada kalsın.

    // Başlangıçta admin kullanıcısı yoksa oluştur
    // Bu kısım artık migration'a taşınabilir veya seed'e taşınabilir.
    // Ancak şimdilik burada kalabilir, çünkü migration'lar çalıştıysa tablo vardır.
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin', // Parola modeldeki hook ile otomatik hash'lenecek
      });
      log.info('👤 Varsayılan admin kullanıcısı oluşturuldu (admin/admin). Lütfen ilk girişte şifrenizi değiştirin.');
    }

  } catch (error) {
    log.error('❌ Veritabanı senkronizasyon hatası: / Database synchronization error:', error);
    // Hata durumunda uygulamayı sonlandır / Terminate the application on error
    process.exit(1);
  }
}

export { sequelize };
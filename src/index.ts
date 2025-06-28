/**
 * Sourcegraph2API - Node.js Entry Point / Node.js Giriş Noktası
 * OpenAI API to Sourcegraph AI proxy server / OpenAI API'den Sourcegraph AI'ye proxy sunucusu
 */

import { startServer } from './app';
import { log, initializeLogger } from './utils/logger';
import { config, loadConfigFromDb } from './config';
import { initializeDatabase } from './services/database';
import dotenv from 'dotenv'; // dotenv'i import et

/**
 * Ana fonksiyon - server'ı başlat / Main function - start the server
 */
async function main(): Promise<void> {
  try {
    // .env dosyasını yükle (en başta olmalı)
    dotenv.config();

    // Logger'ı temel .env ayarlarıyla hemen başlat
    const debugMode = process.env.DEBUG?.toLowerCase() === 'true' || false;
    const logLevel = process.env.LOG_LEVEL || 'info';
    const nodeEnv = process.env.NODE_ENV || 'production';
    initializeLogger(debugMode, logLevel, nodeEnv);

    // ASCII banner
    log.info(`
╔═══════════════════════════════════════════════════════╗
║              SOURCEGRAPH2API                          ║
║                                                       ║
║                     1.1.4                             ║
║                                                       ║
║     Sourcegraph AI → OpenAI API Proxy Server          ║
║                                                       ║
║     Kerem Gok (hermesthecat)                          ║
║                                                       ║
║     https://github.com/hermesthecat/sourcegraph2api   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

    // Veritabanını başlat
    await initializeDatabase();

    // Ayarları veritabanından yükle
    await loadConfigFromDb();

    log.info('🚀 Server başlatılıyor... / Starting server...');

    // Server'ı başlat
    await startServer();

  } catch (error: any) {
    log.error(`❌ Başlatma hatası: ${error.message} / Startup error: ${error.message}`);
    // Logger düzgün çalışmadığı durumlarda console.error da kullan
    console.error(error);
    process.exit(1);
  }
}

// Ana fonksiyonu çağır / Call the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Kritik hata: / Critical error:', error);
    process.exit(1);
  });
} 
/**
 * Sourcegraph2API - Node.js Entry Point / Node.js Giriş Noktası
 * OpenAI API to Sourcegraph AI proxy server / OpenAI API'den Sourcegraph AI'ye proxy sunucusu
 */

import { startServer } from './app';
import { log } from './utils/logger';
import { validateConfig, logConfig } from './config';
import { initializeDatabase } from './services/database';
import './models'; // Tüm modelleri ve ilişkileri yükle / Load all models and relationships

/**
 * Ana fonksiyon - server'ı başlat / Main function - start the server
 */
async function main(): Promise<void> {
  try {
    // ASCII banner
    console.log(`
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

    log.info('🔧 Konfigürasyon doğrulanıyor... / Validating configuration...');

    // Konfigürasyonu doğrula / Validate configuration
    validateConfig();

    // Veritabanını başlat / Initialize the database
    await initializeDatabase();

    // Konfigürasyonu logla (debug mode'da) / Log configuration (in debug mode)
    logConfig();

    log.info('✅ Konfigürasyon geçerli / Configuration valid');
    log.info('🚀 Server başlatılıyor... / Starting server...');

    // Server'ı başlat / Start the server
    await startServer();

  } catch (error: any) {
    log.error(`❌ Başlatma hatası: ${error.message} / Startup error: ${error.message}`);
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
/**
 * Sourcegraph2API - Node.js Entry Point / Node.js Giriş Noktası
 * OpenAI API to Sourcegraph AI proxy server / OpenAI API'den Sourcegraph AI'ye proxy sunucusu
 */

import { startServer } from './app';
import { log, initializeLogger } from './utils/logger';
import { config, loadConfigFromDb } from './config';
import { initializeDatabase } from './services/database';

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

    // Veritabanını başlat (bu, ayarları yüklemeden önce yapılmalı)
    await initializeDatabase();

    // Ayarları veritabanından yükle
    await loadConfigFromDb();

    // Ayarlar yüklendikten sonra Logger'ı başlat
    initializeLogger(config);

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
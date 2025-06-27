/**
 * Sourcegraph2API - Node.js Entry Point
 * OpenAI API to Sourcegraph AI proxy server
 */

import { startServer } from './app';
import { log } from './utils/logger';
import { validateConfig, logConfig } from './config';

/**
 * Ana fonksiyon - server'ı başlat
 */
async function main(): Promise<void> {
  try {
    // ASCII banner
    console.log(`
╔═══════════════════════════════════════════════════════╗
║              SOURCEGRAPH2API                          ║
║             Node.js Version 1.1.4                     ║
║                                                       ║
║  🚀 Sourcegraph AI → OpenAI API Proxy Server         ║  
╚══════════════════════════════════════════════════════╝
    `);

    log.info('🔧 Konfigürasyon doğrulanıyor...');
    
    // Konfigürasyonu doğrula
    validateConfig();
    
    // Konfigürasyonu logla (debug mode'da)
    logConfig();
    
    log.info('✅ Konfigürasyon geçerli');
    log.info('🚀 Server başlatılıyor...');
    
    // Server'ı başlat
    await startServer();
    
  } catch (error: any) {
    log.error(`❌ Başlatma hatası: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ana fonksiyonu çağır
if (require.main === module) {
  main().catch((error) => {
    console.error('Kritik hata:', error);
    process.exit(1);
  });
} 
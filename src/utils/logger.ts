/**
 * Logger Utility / Günlük Kayıt Aracı
 * Winston tabanlı loglama sistemi / Winston-based logging system
 */

import winston from 'winston';
// import { AppConfig } from '../types'; // Artık AppConfig'i burada import etmeyeceğiz

// Henüz yapılandırılmamış bir logger nesnesi oluşturuyoruz.
// Bu, diğer modüllerin hata almadan import edebilmesi için gereklidir.
export const logger = winston.createLogger();

/**
 * Logger'ı, uygulama başlatılırken gelen ayarlarla başlatır.
 * Bu fonksiyon, config yüklenmeden önce çağrılabilir.
 * @param {boolean} debugMode - Hata ayıklama modu açık mı?
 * @param {string} logLevel - Log seviyesi (info, debug, warn, error)
 * @param {string} nodeEnv - Node.js ortamı (development, production)
 */
export function initializeLogger(debugMode: boolean, logLevel: string, nodeEnv: string) {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: debugMode }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`;
    })
  );

  const transports = [
    // Console output
    new winston.transports.Console({
      format: logFormat
    }),
    // Error file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    }),
    // Combined file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json())
    })
  ];

  logger.configure({
    level: debugMode ? 'debug' : logLevel,
    format: logFormat,
    transports: transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
  });

  if (nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
}

/**
 * Logger fonksiyonları / Logger functions
 */
export const log = {
  error: (message: string, meta?: any): void => { logger.error(message, meta); },
  warn: (message: string, meta?: any): void => { logger.warn(message, meta); },
  info: (message: string, meta?: any): void => { logger.info(message, meta); },
  debug: (message: string, meta?: any): void => { logger.debug(message, meta); },

  // Request ID ile loglama / Logging with Request ID
  request: (requestId: string, level: string, message: string, meta?: any): void => {
    logger.log(level, `[${requestId}] ${message}`, meta);
  }
};
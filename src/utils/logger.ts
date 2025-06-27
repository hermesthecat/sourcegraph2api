/**
 * Logger Utility / Günlük Kayıt Aracı
 * Winston tabanlı loglama sistemi / Winston-based logging system
 */

import winston from 'winston';
import { config } from '../config';

// Log formatı / Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: config.debug }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Logger oluştur / Create logger
export const logger = winston.createLogger({
  level: config.debug ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // Console output / Konsol çıktısı
    new winston.transports.Console({
      format: logFormat
    }),

    // Error dosyası / Error file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined dosyası / Combined file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Handled exceptions / İşlenen istisnalar
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],

  // Unhandled rejections / İşlenmeyen reddetmeler
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Development mode'da console'a da yaz / Also log to console in development mode
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Logger fonksiyonları / Logger functions
 */
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Request ID ile loglama / Logging with Request ID
  request: (requestId: string, level: string, message: string, meta?: any) => {
    logger.log(level, `[${requestId}] ${message}`, meta);
  }
};

export default logger; 
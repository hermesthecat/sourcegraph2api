/**
 * Logger Utility
 * Winston-based logging system
 */

import winston from 'winston';
// import { AppConfig } from '../types'; // We will no longer import AppConfig here

// We are creating an unconfigured logger object for now.
// This is necessary so that other modules can import it without errors.
export const logger = winston.createLogger();

/**
 * Initializes the logger with settings provided at application startup.
 * This function can be called before config is loaded.
 * @param {boolean} debugMode - Is debug mode enabled?
 * @param {string} logLevel - Log level (info, debug, warn, error)
 * @param {string} nodeEnv - Node.js environment (development, production)
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
 * Logger functions
 */
export const log = {
  error: (message: string, meta?: any): void => { logger.error(message, meta); },
  warn: (message: string, meta?: any): void => { logger.warn(message, meta); },
  info: (message: string, meta?: any): void => { logger.info(message, meta); },
  debug: (message: string, meta?: any): void => { logger.debug(message, meta); },

  // Logging with Request ID
  request: (requestId: string, level: string, message: string, meta?: any): void => {
    logger.log(level, `[${requestId}] ${message}`, meta);
  }
};
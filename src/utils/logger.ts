import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log retention days from environment or default to 14 days
const LOG_RETENTION_DAYS = process.env.LOG_RETENTION_DAYS || '14';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
    const modulePrefix = module ? `[${module}]` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level} ${modulePrefix} ${message} ${metaStr}`.trim();
  }),
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Transport for all logs (combined)
const combinedTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: `${LOG_RETENTION_DAYS}d`,
  maxSize: '20m', // Rotate if file exceeds 20MB
  format: fileFormat,
  level: LOG_LEVEL,
});

// Transport for error logs only
const errorTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: `${LOG_RETENTION_DAYS}d`,
  maxSize: '20m',
  format: fileFormat,
  level: 'error',
});

// Transport for critical logs (we'll use error level as critical)
const criticalTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'critical-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d', // Keep critical logs longer
  maxSize: '20m',
  format: fileFormat,
  level: 'error',
});

// Create the logger instance
const logger = winston.createLogger({
  levels: {
    critical: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  transports: [
    combinedTransport,
    errorTransport,
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    }),
  ],
  // Prevent Winston from exiting on error
  exitOnError: false,
});

// Add custom critical level
winston.addColors({
  critical: 'red bold',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
});

/**
 * Enhanced logger with module context support
 */
class Logger {
  /**
   * Create a logger instance for a specific module
   * @param moduleName - The name of the module using this logger
   */
  static forModule(moduleName: string) {
    return {
      debug: (message: string, meta?: any) =>
        logger.debug(message, { module: moduleName, ...meta }),
      info: (message: string, meta?: any) =>
        logger.info(message, { module: moduleName, ...meta }),
      warn: (message: string, meta?: any) =>
        logger.warn(message, { module: moduleName, ...meta }),
      error: (message: string, error?: Error | any, meta?: any) => {
        const errorMeta =
          error instanceof Error
            ? { error: { message: error.message, stack: error.stack } }
            : { error };
        logger.error(message, { module: moduleName, ...errorMeta, ...meta });
      },
      critical: (message: string, error?: Error | any, meta?: any) => {
        const errorMeta =
          error instanceof Error
            ? { error: { message: error.message, stack: error.stack } }
            : { error };
        logger.log('critical', message, {
          module: moduleName,
          ...errorMeta,
          ...meta,
        });
      },
    };
  }

  /**
   * Log at debug level
   */
  static debug(message: string, meta?: any) {
    logger.debug(message, meta);
  }

  /**
   * Log at info level
   */
  static info(message: string, meta?: any) {
    logger.info(message, meta);
  }

  /**
   * Log at warning level
   */
  static warn(message: string, meta?: any) {
    logger.warn(message, meta);
  }

  /**
   * Log at error level
   */
  static error(message: string, error?: Error | any, meta?: any) {
    const errorMeta =
      error instanceof Error
        ? { error: { message: error.message, stack: error.stack } }
        : { error };
    logger.error(message, { ...errorMeta, ...meta });
  }

  /**
   * Log critical errors (system-threatening issues)
   */
  static critical(message: string, error?: Error | any, meta?: any) {
    const errorMeta =
      error instanceof Error
        ? { error: { message: error.message, stack: error.stack } }
        : { error };
    logger.log('critical', message, { ...errorMeta, ...meta });
  }

  /**
   * Console-only log for startup messages
   * These messages will appear in console but won't be saved to files
   */
  static console(message: string) {
    console.log(message);
  }
}

export default Logger;

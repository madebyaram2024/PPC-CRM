/**
 * Structured logging with Pino
 * Provides consistent logging across the application
 */

import pino from 'pino';
import { isDevelopment } from './env';

// Create logger instance with environment-specific configuration
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Pretty print in development for better readability
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Add base fields to all logs
  base: {
    env: process.env.NODE_ENV,
  },
});

/**
 * Create a child logger with additional context
 * @param context - Additional context to add to all logs
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log an error with stack trace
 * @param error - Error object
 * @param message - Optional message
 * @param context - Additional context
 */
export function logError(
  error: unknown,
  message?: string,
  context?: Record<string, unknown>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error(
    {
      err: errorObj,
      stack: errorObj.stack,
      ...context,
    },
    message || errorObj.message
  );
}

/**
 * Log API request
 */
export function logRequest(
  method: string,
  url: string,
  context?: Record<string, unknown>
) {
  logger.info(
    {
      type: 'request',
      method,
      url,
      ...context,
    },
    `${method} ${url}`
  );
}

/**
 * Log API response
 */
export function logResponse(
  method: string,
  url: string,
  status: number,
  duration: number,
  context?: Record<string, unknown>
) {
  logger.info(
    {
      type: 'response',
      method,
      url,
      status,
      duration,
      ...context,
    },
    `${method} ${url} ${status} - ${duration}ms`
  );
}

/**
 * Log database query
 */
export function logQuery(
  model: string,
  operation: string,
  duration?: number,
  context?: Record<string, unknown>
) {
  logger.debug(
    {
      type: 'database',
      model,
      operation,
      duration,
      ...context,
    },
    `DB: ${model}.${operation}${duration ? ` - ${duration}ms` : ''}`
  );
}

export default logger;

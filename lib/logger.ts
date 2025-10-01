import { loggingConfig } from './config';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

// Logger class
class Logger {
  private isEnabled: boolean;
  private level: LogLevel;
  private verbose: boolean;

  constructor() {
    this.isEnabled = true;
    this.level = this.getLogLevel(loggingConfig.level);
    this.verbose = loggingConfig.verbose;
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, error, requestId, userId, sessionId } = entry;
    
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (requestId) {
      formattedMessage += ` [Request: ${requestId}]`;
    }
    
    if (userId) {
      formattedMessage += ` [User: ${userId}]`;
    }
    
    if (sessionId) {
      formattedMessage += ` [Session: ${sessionId}]`;
    }
    
    if (context && Object.keys(context).length > 0) {
      formattedMessage += ` [Context: ${JSON.stringify(context)}]`;
    }
    
    if (error) {
      formattedMessage += ` [Error: ${error.message}]`;
      if (this.verbose && error.stack) {
        formattedMessage += `\n${error.stack}`;
      }
    }
    
    return formattedMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, requestId?: string, userId?: string, sessionId?: string): void {
    if (!this.isEnabled || !this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      requestId,
      userId,
      sessionId,
    };

    const formattedMessage = this.formatMessage(entry);

    // Console output
    if (loggingConfig.enableConsole) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }

    // File output (in production)
    if (loggingConfig.enableFile) {
      // TODO: Implement file logging
      // This would typically write to a log file
    }
  }

  // Public logging methods
  error(message: string, context?: Record<string, any>, error?: Error, requestId?: string, userId?: string, sessionId?: string): void {
    this.log(LogLevel.ERROR, message, context, error, requestId, userId, sessionId);
  }

  warn(message: string, context?: Record<string, any>, requestId?: string, userId?: string, sessionId?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, requestId, userId, sessionId);
  }

  info(message: string, context?: Record<string, any>, requestId?: string, userId?: string, sessionId?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, requestId, userId, sessionId);
  }

  debug(message: string, context?: Record<string, any>, requestId?: string, userId?: string, sessionId?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, requestId, userId, sessionId);
  }

  // Request logging
  logRequest(method: string, url: string, statusCode: number, duration: number, requestId?: string, userId?: string): void {
    this.info(`${method} ${url} - ${statusCode} (${duration}ms)`, {
      method,
      url,
      statusCode,
      duration,
    }, requestId, userId);
  }

  // Database logging
  logDatabase(operation: string, table: string, duration: number, requestId?: string): void {
    this.debug(`Database ${operation} on ${table} (${duration}ms)`, {
      operation,
      table,
      duration,
    }, requestId);
  }

  // API logging
  logApi(endpoint: string, method: string, statusCode: number, duration: number, requestId?: string, userId?: string): void {
    this.info(`API ${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
      endpoint,
      method,
      statusCode,
      duration,
    }, requestId, userId);
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: Record<string, any>, requestId?: string): void {
    this.info(`Performance: ${operation} (${duration}ms)`, context, requestId);
  }

  // Security logging
  logSecurity(event: string, context?: Record<string, any>, requestId?: string, userId?: string): void {
    this.warn(`Security: ${event}`, context, requestId, userId);
  }

  // Business logic logging
  logBusiness(event: string, context?: Record<string, any>, requestId?: string, userId?: string): void {
    this.info(`Business: ${event}`, context, requestId, userId);
  }

  // Set log level
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Set verbose mode
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}

// Create and export logger instance
export const logger = new Logger();

// Export logger class for testing
export { Logger };

// Convenience functions
export const logError = (message: string, context?: Record<string, any>, error?: Error, requestId?: string, userId?: string, sessionId?: string) => {
  logger.error(message, context, error, requestId, userId, sessionId);
};

export const logWarn = (message: string, context?: Record<string, any>, requestId?: string, userId?: string, sessionId?: string) => {
  logger.warn(message, context, requestId, userId, sessionId);
};

export const logInfo = (message: string, context?: Record<string, any>, requestId?: string, userId?: string, sessionId?: string) => {
  logger.info(message, context, requestId, userId, sessionId);
};

export const logDebug = (message: string, context?: Record<string, any>, requestId?: string, userId?: string, sessionId?: string) => {
  logger.debug(message, context, requestId, userId, sessionId);
};

export default logger;
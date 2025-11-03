// Client-side logger for browser components
// This provides a consistent logging API that matches server-side logger

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: any;
}

class ClientLogger {
  private enabled: boolean = true;
  private level: LogLevel = 'info';

  private shouldLog(logLevel: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(logLevel);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formattedMessage += ` [Context: ${JSON.stringify(context)}]`;
    }
    
    return formattedMessage;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.enabled || !this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);
    
    // Use appropriate console method based on level
    switch (level) {
      case 'error':
        console.error(formattedMessage, error || '');
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
    }

    // In production, you might want to send logs to a logging service
    // For now, we just use console
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Export for testing
export { ClientLogger };


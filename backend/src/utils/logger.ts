/**
 * Enhanced logging utility with context
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogContext {
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
    
    return `[${timestamp}] [${level}] ${message} ${contextStr}${errorStr}`;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, context, error);
    console.error(formattedMessage);
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formattedMessage);
  }

  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
    console.log(formattedMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, context);
      console.log(formattedMessage);
    }
  }
}

export const logger = new Logger();

import config from '../config/env';

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (config.nodeEnv === 'test') {
      return false;
    }
    if (config.nodeEnv === 'production' && level === LogLevel.DEBUG) {
      return false;
    }
    return true;
  }
  private format(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    let logMsg = `[${timestamp}] [${level}] ${message}`;
    //prevents crash
    if (meta !== undefined) {
      try {
        logMsg += `\nData: ${JSON.stringify(meta, null, 2)}`;
      } catch (e) {
        logMsg += ` [Unserializable Meta Data]`;
      }
    }

    return logMsg;
  }

  info(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.format(LogLevel.INFO, message, meta));
    }
  }

  warn(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(LogLevel.WARN, message, meta));
    }
  }
  error(message: string, error?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      let meta: unknown = error;
      if (error instanceof Error) {
        meta = { message: error.message, stack: error.stack };
      }

      console.error(this.format(LogLevel.ERROR, message, meta));
    }
  }

  debug(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.format(LogLevel.DEBUG, message, meta));
    }
  }
}

const logger = new Logger();
export default logger;

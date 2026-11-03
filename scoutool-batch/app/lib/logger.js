/**
 * Simple logging utility for tracking operations
 * Logs to console with timestamps - no data is persisted
 */

const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
  DEBUG: "DEBUG"
};

class Logger {
  constructor(component = "Scoutool") {
    this.component = component;
  }

  format(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const component = `[${this.component}]`;
    let logLine = `${timestamp} ${component} [${level}] ${message}`;
    if (data) {
      logLine += ` ${JSON.stringify(data)}`;
    }
    return logLine;
  }

  info(message, data = null) {
    console.log(this.format(LOG_LEVELS.INFO, message, data));
  }

  warn(message, data = null) {
    console.warn(this.format(LOG_LEVELS.WARN, message, data));
  }

  error(message, data = null) {
    console.error(this.format(LOG_LEVELS.ERROR, message, data));
  }

  success(message, data = null) {
    console.log(this.format(LOG_LEVELS.SUCCESS, message, data));
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === "development") {
      console.log(this.format(LOG_LEVELS.DEBUG, message, data));
    }
  }
}

export default Logger;
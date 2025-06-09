/**
 * Logger utility that only logs in development environment
 * Provides consistent logging format and can be toggled based on environment
 */
export const logger = {
  log: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.debug(message, ...args);
    }
  }
};
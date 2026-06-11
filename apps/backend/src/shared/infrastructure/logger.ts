/**
 * US-0.6 — Observabilidad y logging
 * Lightweight structured logger compatible with Bun.
 * Outputs JSON in production, human-readable in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

declare const process: { env: Record<string, string | undefined> } | undefined;
const isProd = (typeof process !== 'undefined' ? process?.env?.NODE_ENV : undefined) === 'production';

function formatEntry(entry: LogEntry): string {
  if (isProd) {
    return JSON.stringify(entry);
  }

  const icons: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️ ',
    warn: '⚠️ ',
    error: '❌',
  };

  const { level, message, timestamp, ...rest } = entry;
  const extras = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
  return `${icons[level]} [${timestamp}] ${message}${extras}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};

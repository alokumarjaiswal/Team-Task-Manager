// Structured logger — JSON output in production, readable in development

const config = require('../config');

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = config.env === 'production' ? 'info' : 'debug';

const log = (level, message, meta = {}) => {
  if (LOG_LEVELS[level] > LOG_LEVELS[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (config.env === 'production') {
    // JSON for log aggregation tools (Datadog, Sentry, Railway logs)
    console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
  } else {
    // Human-readable for development
    const color = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', debug: '\x1b[90m' };
    console.log(`${color[level]}[${level.toUpperCase()}]\x1b[0m ${entry.timestamp} ${message}`, meta);
  }
};

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

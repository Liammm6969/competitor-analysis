/**
 * logger.js — Structured scraper logger
 * Outputs timestamped log entries with severity levels.
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function timestamp() {
  return new Date().toISOString();
}

function log(level, source, message, meta = {}) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

  const entry = {
    ts: timestamp(),
    level,
    source,
    message,
    ...(Object.keys(meta).length ? { meta } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const logger = {
  debug: (source, msg, meta) => log('DEBUG', source, msg, meta),
  info:  (source, msg, meta) => log('INFO',  source, msg, meta),
  warn:  (source, msg, meta) => log('WARN',  source, msg, meta),
  error: (source, msg, meta) => log('ERROR', source, msg, meta),
};

module.exports = logger;

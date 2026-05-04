/**
 * scraper.scheduler.js — Automated Scraping Scheduler
 *
 * Uses node-cron to schedule periodic scraper runs.
 * Jobs:
 *   - Daily scraping:     every day at midnight (00:00)
 *   - Weekly cleanup:     every Sunday at 02:00
 *
 * Usage: require this file inside server/index.js to activate the scheduler.
 */

const cron   = require('node-cron');
const logger = require('./core/logger');
const { run } = require('./scraper');

let lastRunStats = null;
let isRunning    = false;

// ─── Job 1: Daily Scraping ────────────────────────────────────────────────────
// Runs every day at midnight (server local time)
const dailyScrapeJob = cron.schedule(
  '0 0 * * *',
  async () => {
    if (isRunning) {
      logger.warn('Scheduler', 'Scraper already running — skipping scheduled run');
      return;
    }

    logger.info('Scheduler', '⏰ Daily scrape triggered');
    isRunning = true;

    try {
      lastRunStats = await run();
      logger.info('Scheduler', '✅ Daily scrape complete', lastRunStats);
    } catch (err) {
      logger.error('Scheduler', `❌ Daily scrape failed: ${err.message}`);
    } finally {
      isRunning = false;
    }
  },
  { scheduled: false } // Don't start immediately — call .start() explicitly
);

// ─── Job 2: Weekly Stale Data Cleanup ────────────────────────────────────────
// Runs every Sunday at 02:00 — removes training records older than 1 year
const weeklyCleanupJob = cron.schedule(
  '0 2 * * 0',
  async () => {
    logger.info('Scheduler', '🧹 Weekly cleanup triggered');
    try {
      const Training = require('../models/training.model');
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const result = await Training.deleteMany({ date: { $lt: cutoff } });
      logger.info('Scheduler', `Cleanup removed ${result.deletedCount} stale records`);
    } catch (err) {
      logger.error('Scheduler', `Cleanup failed: ${err.message}`);
    }
  },
  { scheduled: false }
);

/**
 * Starts all scheduled jobs.
 */
function startScheduler() {
  dailyScrapeJob.start();
  weeklyCleanupJob.start();
  logger.info('Scheduler', '📅 Scheduler started — daily scrape at 00:00, cleanup Sundays at 02:00');
}

/**
 * Stops all scheduled jobs.
 */
function stopScheduler() {
  dailyScrapeJob.stop();
  weeklyCleanupJob.stop();
  logger.info('Scheduler', 'Scheduler stopped');
}

/**
 * Returns stats from the last scraper run.
 */
function getLastRunStats() {
  return lastRunStats;
}

/**
 * Returns whether a scrape is currently in progress.
 */
function isScraperRunning() {
  return isRunning;
}

/**
 * Manually trigger a scrape run (used by API endpoint).
 */
async function triggerManualRun() {
  if (isRunning) {
    throw new Error('Scraper is already running');
  }
  isRunning = true;
  try {
    lastRunStats = await run();
    return lastRunStats;
  } finally {
    isRunning = false;
  }
}

module.exports = { startScheduler, stopScheduler, getLastRunStats, isScraperRunning, triggerManualRun };

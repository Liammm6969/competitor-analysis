/**
 * scraper.routes.js — Scraper Management API Routes
 *
 * Endpoints:
 *   POST /api/scraper/run          - Trigger a manual scrape run
 *   GET  /api/scraper/status       - Get scraper status + last run stats
 *   POST /api/trainings/bulk       - Bulk insert training records (for external scrapers)
 */

const express    = require('express');
const router     = express.Router();
const Training   = require('../models/training.model');
const Competitor = require('../models/competitor.model');
const { normalizeAll }    = require('../scraper/parsers/normalize');
const { deduplicateRecords, deduplicateInMemory } = require('../scraper/utils/dedupe');
const { triggerManualRun, getLastRunStats, isScraperRunning } = require('../scraper/scraper.scheduler');

// ─── POST /api/scraper/run ────────────────────────────────────────────────────
// Manually trigger a scraper run
router.post('/run', async (req, res) => {
  if (isScraperRunning()) {
    return res.status(409).json({
      success: false,
      message: 'Scraper is already running. Please wait for it to complete.',
    });
  }

  // Run async — don't block HTTP response
  res.json({
    success: true,
    message: 'Scraper run triggered. Check /api/scraper/status for progress.',
    startedAt: new Date().toISOString(),
  });

  // Fire and forget
  triggerManualRun()
    .then((stats) => console.log('[Scraper] Manual run complete:', JSON.stringify(stats)))
    .catch((err) => console.error('[Scraper] Manual run error:', err.message));
});

// ─── GET /api/scraper/status ──────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    isRunning: isScraperRunning(),
    lastRun:   getLastRunStats(),
  });
});

// ─── POST /api/scraper/bulk ──────────────────────────────────────────────────
// Accepts an array of raw or normalized training records and inserts new ones.
// Body: { records: [ { title, provider, price, date, source, url, ... } ] }
router.post('/bulk', async (req, res) => {
  const { records, source = 'api' } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records array is required and must not be empty' });
  }

  try {
    // 1. Normalize
    const normalized = normalizeAll(records, source);
    if (normalized.length === 0) {
      return res.status(400).json({ error: 'No valid records after normalization', raw: records.length });
    }

    // 2. In-memory dedupe
    const batchDeduped = deduplicateInMemory(normalized);

    // 3. DB dedupe
    const newRecords = await deduplicateRecords(batchDeduped, Training);

    if (newRecords.length === 0) {
      return res.json({ success: true, inserted: 0, message: 'All records already exist' });
    }

    // 4. Resolve competitors
    const providerCache = {};
    for (const record of newRecords) {
      const name = record.provider || 'Unknown';
      if (!providerCache[name]) {
        let competitor = await Competitor.findOne({ name });
        if (!competitor) {
          competitor = await Competitor.create({ name, source_url: record.url || '', category: 'Training Provider' });
        }
        providerCache[name] = competitor._id;
      }
      record.competitor_id = providerCache[name];
    }

    // 5. Bulk insert
    await Training.insertMany(newRecords, { ordered: false });

    res.status(201).json({
      success: true,
      received:   records.length,
      normalized: normalized.length,
      inserted:   newRecords.length,
      skipped:    records.length - newRecords.length,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate records detected', detail: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

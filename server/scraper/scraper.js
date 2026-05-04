/**
 * scraper.js — Main Scraper Entry Point
 *
 * Orchestrates all scrapers:
 *   1. Facebook Page Scraper
 *   2. Event Platform Scraper
 *   3. Website Scraper
 *
 * Pipeline:
 *   Sources → Raw Data → Normalize → Deduplicate → DB Insert
 *
 * Usage:
 *   node scraper/scraper.js               (standalone)
 *   require('./scraper/scraper').run()    (from scheduler)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const logger   = require('./core/logger');
const { normalizeAll }          = require('./parsers/normalize');
const { deduplicateRecords, deduplicateInMemory } = require('./utils/dedupe');
const { runWithLimit }          = require('./utils/limiter');
const config                    = require('./scraper.config');
const { scrapeFacebookPages }   = require('./sources/facebook.scraper');
const { scrapeStaticEventPage, scrapeDynamicEventPage } = require('./sources/event.scraper');
const { scrapeWebsites }        = require('./sources/website.scraper');

// ── Lazy-load Training model (may already be loaded by server) ────────────────
let Training;
function getTrainingModel() {
  if (!Training) Training = require('../models/training.model');
  return Training;
}

// ─── DB Connection ────────────────────────────────────────────────────────────
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return; // Already connected
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('Scraper', 'Connected to MongoDB');
}

// ─── Main Runner ──────────────────────────────────────────────────────────────
/**
 * Runs all configured scrapers, normalizes, deduplicates, and inserts results.
 * @param {object} overrideConfig - Optional config override for testing
 * @returns {Promise<object>} stats
 */
async function run(overrideConfig = {}) {
  const cfg = { ...config, ...overrideConfig };
  const stats = {
    startedAt: new Date().toISOString(),
    sources: {},
    totalRaw: 0,
    totalNormalized: 0,
    totalInserted: 0,
    errors: [],
  };

  logger.info('Scraper', '═══ Scraper run started ═══');

  // ── Step 1: Gather raw data from all sources ──────────────────────────────
  const scraperTasks = [];

  // Facebook Pages
  if (cfg.FACEBOOK_PAGES?.length) {
    scraperTasks.push(async () => {
      const raw = await scrapeFacebookPages(cfg.FACEBOOK_PAGES);
      return { source: 'facebook', raw };
    });
  }

  // Event Sites — static
  const staticEventSites = (cfg.EVENT_SITES || []).filter((s) => s.type !== 'dynamic');
  if (staticEventSites.length) {
    scraperTasks.push(async () => {
      const raw = await scrapeStaticEventPage(
        staticEventSites.map((s) => s.url),
        staticEventSites[0]?.selectors || {}
      );
      return { source: 'event_static', raw };
    });
  }

  // Event Sites — dynamic
  const dynamicEventSites = (cfg.EVENT_SITES || []).filter((s) => s.type === 'dynamic');
  if (dynamicEventSites.length) {
    scraperTasks.push(async () => {
      const raw = await scrapeDynamicEventPage(
        dynamicEventSites.map((s) => s.url),
        dynamicEventSites[0]?.selectors || {}
      );
      return { source: 'event_dynamic', raw };
    });
  }

  // Training Websites
  if (cfg.WEBSITE_CONFIGS?.length) {
    scraperTasks.push(async () => {
      const raw = await scrapeWebsites(cfg.WEBSITE_CONFIGS);
      return { source: 'website', raw };
    });
  }

  // Run with concurrency limit
  const settled = await runWithLimit(scraperTasks, cfg.SETTINGS?.concurrency || 2);

  // Collect raw results
  const allRaw = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const { source, raw } = result.value;
      stats.sources[source] = raw.length;
      stats.totalRaw += raw.length;
      allRaw.push(...raw.map((r) => ({ ...r, _source: source })));
    } else {
      stats.errors.push(result.reason);
      logger.error('Scraper', `Scraper task rejected: ${result.reason}`);
    }
  }

  logger.info('Scraper', `Total raw records collected: ${stats.totalRaw}`);

  if (allRaw.length === 0) {
    logger.warn('Scraper', 'No raw data collected. Check scraper.config.js targets.');
    stats.finishedAt = new Date().toISOString();
    return stats;
  }

  // ── Step 2: Normalize ─────────────────────────────────────────────────────
  // Group by source and normalize
  const sourceGroups = {};
  for (const record of allRaw) {
    const src = record._source || 'unknown';
    if (!sourceGroups[src]) sourceGroups[src] = [];
    sourceGroups[src].push(record);
  }

  const allNormalized = [];
  for (const [source, records] of Object.entries(sourceGroups)) {
    const normalized = normalizeAll(records, source);
    logger.info('Scraper', `Normalized: ${normalized.length}/${records.length} from ${source}`);
    allNormalized.push(...normalized);
  }

  stats.totalNormalized = allNormalized.length;

  // ── Step 3: In-memory deduplication (within the batch) ────────────────────
  const batchDeduped = deduplicateInMemory(allNormalized);
  logger.info('Scraper', `After in-memory dedupe: ${batchDeduped.length}/${allNormalized.length}`);

  // ── Step 4: DB deduplication + Insert ─────────────────────────────────────
  await connectDB();
  const TrainingModel = getTrainingModel();

  const newRecords = await deduplicateRecords(batchDeduped, TrainingModel);

  if (newRecords.length > 0) {
    // Bulk insert — find/create competitor for each provider
    const inserted = await bulkInsert(newRecords, TrainingModel);
    stats.totalInserted = inserted;
    logger.info('Scraper', `Inserted ${inserted} new training records into DB`);
  } else {
    logger.info('Scraper', 'No new records to insert (all duplicates)');
  }

  stats.finishedAt = new Date().toISOString();
  logger.info('Scraper', '═══ Scraper run complete ═══', stats);

  return stats;
}

// ─── Bulk Insert ─────────────────────────────────────────────────────────────
/**
 * Inserts normalized records into the DB, resolving/creating Competitor records.
 * @param {object[]} records
 * @param {import('mongoose').Model} TrainingModel
 * @returns {Promise<number>} count inserted
 */
async function bulkInsert(records, TrainingModel) {
  const Competitor = require('../models/competitor.model');
  const providerCache = {};
  let insertedCount = 0;

  // Resolve provider → competitor_id
  for (const record of records) {
    const providerName = record.provider || 'Unknown';

    if (!providerCache[providerName]) {
      let competitor = await Competitor.findOne({ name: providerName });
      if (!competitor) {
        competitor = await Competitor.create({
          name: providerName,
          source_url: record.url || '',
          category: 'Training Provider',
        });
        logger.info('Scraper', `Created new competitor: ${providerName}`);
      }
      providerCache[providerName] = competitor._id;
    }

    record.competitor_id = providerCache[providerName];
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    try {
      await TrainingModel.insertMany(batch, { ordered: false });
      insertedCount += batch.length;
    } catch (err) {
      // ordered: false means duplicates won't block the whole batch
      if (err.code === 11000) {
        logger.warn('Scraper', 'Some duplicates skipped during bulk insert (index conflict)');
      } else {
        logger.error('Scraper', `Bulk insert error: ${err.message}`);
      }
    }
  }

  return insertedCount;
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
if (require.main === module) {
  run()
    .then((stats) => {
      console.log('\n✅ Scraper finished:', JSON.stringify(stats, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Scraper failed:', err.message);
      process.exit(1);
    });
}

module.exports = { run };

/**
 * dedupe.js — Deduplication utility
 *
 * Strategy: SHA-256 hash of (title + date + provider)
 * - Checks existing records in MongoDB before insert
 * - Filters out duplicates from a batch before bulk insert
 */

const crypto = require('crypto');
const logger = require('../core/logger');

/**
 * Filters a normalized records array, removing duplicates already in DB.
 * @param {object[]} records          - Normalized records (each must have source_hash)
 * @param {import('mongoose').Model} Training - Mongoose Training model
 * @returns {Promise<object[]>}        - Only new, unique records
 */
async function deduplicateRecords(records, Training) {
  if (!records.length) return [];

  const hashes = records.map((r) => r.source_hash);

  // Find which hashes already exist in DB
  const existing = await Training.find(
    { source_hash: { $in: hashes } },
    { source_hash: 1 }
  ).lean();

  const existingSet = new Set(existing.map((e) => e.source_hash));

  const unique = records.filter((r) => !existingSet.has(r.source_hash));

  logger.info('Dedupe', `${records.length} records → ${unique.length} new after deduplication`, {
    duplicatesRemoved: records.length - unique.length,
  });

  return unique;
}

/**
 * Deduplicates within a single batch (in-memory, no DB call).
 * Useful for cleaning a scrape result before sending to deduplicateRecords.
 * @param {object[]} records
 * @returns {object[]}
 */
function deduplicateInMemory(records) {
  const seen = new Set();
  return records.filter((r) => {
    if (seen.has(r.source_hash)) return false;
    seen.add(r.source_hash);
    return true;
  });
}

module.exports = { deduplicateRecords, deduplicateInMemory };

/**
 * normalize.js — Data normalization parser
 *
 * Converts raw scraped records into the clean Training schema format:
 * {
 *   title, provider, price, date, duration,
 *   audience, delivery_mode, description, source, url, source_hash
 * }
 */

const crypto = require('crypto');

// ─── Price Normalization ──────────────────────────────────────────────────────
// Handles: "₱1,500", "PHP 2000", "1500.00", "Free", null
function normalizePrice(raw) {
  if (!raw) return 0;
  const str = String(raw).replace(/[₱,\s]/g, '').replace(/PHP|php/gi, '').trim();
  if (/free/i.test(str)) return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// ─── Date Normalization ───────────────────────────────────────────────────────
// Converts various date strings to ISO Date or null
function normalizeDate(raw) {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try common PH formats: "May 10, 2026", "10/05/2026"
  const patterns = [
    { re: /(\w+ \d{1,2},?\s*\d{4})/, },
    { re: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, fn: (m) => `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` },
    { re: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, fn: (m) => `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}` },
  ];

  for (const { re, fn } of patterns) {
    const match = String(raw).match(re);
    if (match) {
      const dateStr = fn ? fn(match) : match[1];
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

// ─── Delivery Mode Normalization ──────────────────────────────────────────────
function normalizeDeliveryMode(raw) {
  if (!raw) return 'Online';
  const s = String(raw).toLowerCase();
  if (s.includes('hybrid')) return 'Hybrid';
  if (s.includes('person') || s.includes('face') || s.includes('onsite') || s.includes('on-site')) return 'In-Person';
  return 'Online';
}

// ─── Source Hash (deduplication key) ─────────────────────────────────────────
// Hash = SHA-256 of "title|date|provider" — stable fingerprint per unique event
function buildSourceHash(title, date, provider) {
  const raw = [
    (title   || '').toLowerCase().trim(),
    date ? new Date(date).toISOString().split('T')[0] : 'nodate',
    (provider || '').toLowerCase().trim(),
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Normalizes a raw scraped record into a clean Training-compatible object.
 * Returns null if the record fails minimum validation.
 *
 * @param {object} raw
 * @param {string} source   - e.g. 'facebook', 'eventbrite', 'website'
 * @returns {object|null}
 */
function normalizeRecord(raw, source = 'unknown') {
  const title = raw.title ? String(raw.title).trim() : null;

  // ── Minimum validation ────────────────────────────────────────────────────
  if (!title || title.length < 3) return null;

  const price        = normalizePrice(raw.price);
  const date         = normalizeDate(raw.date);
  const delivery_mode = normalizeDeliveryMode(raw.delivery_mode || raw.mode);
  const provider     = raw.provider ? String(raw.provider).trim() : 'Unknown';
  const audience     = raw.audience ? String(raw.audience).trim() : 'General';
  const description  = raw.description ? String(raw.description).trim().slice(0, 2000) : '';
  const url          = raw.url ? String(raw.url).trim() : '';
  const source_hash  = buildSourceHash(title, date, provider);

  return {
    title,
    provider,
    price,
    date,
    audience,
    delivery_mode,
    description,
    source,
    url,
    source_hash,
  };
}

/**
 * Normalizes an array of raw records, filtering out invalid entries.
 * @param {object[]} rawRecords
 * @param {string}   source
 * @returns {object[]}
 */
function normalizeAll(rawRecords, source) {
  const results = [];
  for (const raw of rawRecords) {
    const normalized = normalizeRecord(raw, source);
    if (normalized) {
      results.push(normalized);
    }
  }
  return results;
}

module.exports = { normalizeRecord, normalizeAll, normalizePrice, normalizeDate, buildSourceHash };

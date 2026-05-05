/**
 * google.engine.js — Training Provider Discovery via Google Dorks
 */

'use strict';

const { getJson } = require('serpapi');
const logger = require('../core/logger');

const SOURCE = 'engine_google_dork';

const FACEBOOK_NOISE_PATHS = [
  '/public/', '/people/', '/groups/', '/posts/', '/events/',
  '/marketplace/', '/watch/', '/reel/', '/photo/', '/video/',
];

const INSTITUTION_TERMS = [
  '"training center"', '"review center"', '"training provider"',
  '"training institute"', '"learning center"', '"safety training"',
  '"accredited training"', '"TESDA accredited"', '"CPD provider"',
  '"DOLE accredited"', '"DepEd accredited"', '"seminar"', '"course"',
];

/**
 * Normalizes Facebook URLs for deduplication.
 */
function normalizeUrl(url) {
  if (!url) return '';
  return url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '').replace(/web\./, '');
}

/**
 * Searches Google for Facebook pages using Dorks.
 */
async function searchGoogle(keyword, options = {}) {
  const { maxPages = 3, location = 'Philippines' } = options;
  const query = `site:facebook.com "${keyword}" (${INSTITUTION_TERMS.join(' OR ')})`;
  const allRecords = [];
  const seenUrls = new Set();

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const start = (pageNum - 1) * 10;
    const result = await getJson({
      engine: 'google',
      api_key: process.env.SERPAPI_KEY,
      q: query,
      location,
      num: 10,
      start,
      hl: 'en',
      gl: 'ph',
    });

    const organicResults = result.organic_results ?? [];
    if (organicResults.length === 0) break;

    for (const item of organicResults) {
      const url = item.link ?? '';
      if (!url.includes('facebook.com')) continue;
      if (FACEBOOK_NOISE_PATHS.some(path => url.includes(path))) continue;

      const norm = normalizeUrl(url);
      if (seenUrls.has(norm)) continue;
      seenUrls.add(norm);

      const title = item.title ?? '';
      const snippet = item.snippet ?? '';
      const providerName = title.replace(/\s*\|\s*Facebook$/i, '').split(' - ')[0].trim();

      allRecords.push({
        keyword,
        provider: providerName,
        url,
        normalizedUrl: norm,
        title,
        description: snippet,
        type: detectDeliveryMode(snippet),
        online_price: detectDeliveryMode(snippet) === 'Online' ? extractPrice(snippet) : null,
        f2f_price: detectDeliveryMode(snippet) === 'In-Person' ? extractPrice(snippet) : null,
        inclusion: extractInclusion(snippet),
        trainings_offered: extractTrainings(snippet, keyword),
        date: extractDate(snippet),
        likes: null,
        category: null,
        address: null,
        phone: null,
        website: null,
        weakness: null,
        source: 'google_dork',
        status: 'discovered',
      });
    }

    if (!result.serpapi_pagination?.next) break;
  }

  return allRecords;
}

// ---------------------------------------------------------------------------
// Helpers (Copied from existing scraper for consistency)
// ---------------------------------------------------------------------------

function detectDeliveryMode(snippet) {
  const s = (snippet || '').toLowerCase();
  if (s.includes('online') || s.includes('virtual') || s.includes('webinar') || s.includes('zoom')) return 'Online';
  if (s.includes('in-person') || s.includes('face-to-face') || s.includes('on-site')) return 'In-Person';
  return null;
}

function extractDate(snippet) {
  const match = (snippet || '').match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b/i);
  return match ? match[0] : null;
}

function extractPrice(snippet) {
  const match = (snippet || '').match(/(?:₱|PHP|Php|P)\s?[\d,]+/i);
  return match ? match[0] : null;
}

function extractInclusion(snippet) {
  const match = (snippet || '').match(/(?:includ(?:es?|ing)|with|free\s+)[\s:]*(certificate|kit|materials?|modules?|lunch|id|uniform|reviewer)[^.;]*/i);
  return match ? match[0].trim() : null;
}

function extractTrainings(snippet, keyword) {
  const known = ['BOSH', 'COSH', 'HIRAC', 'LCM', 'First Aid', 'BLS', 'CPR', 'SO1', 'SO2', 'SO3'];
  const found = known.filter(t => (snippet || '').toUpperCase().includes(t.toUpperCase()));
  return found.length > 0 ? found.join(', ') : keyword;
}

module.exports = { searchGoogle, normalizeUrl };

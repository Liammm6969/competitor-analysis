/**
 * facebook-search.scraper.js — On-Demand Facebook Scraper (via SerpAPI + Google Dorks)
 *
 * Uses SerpAPI's Google Search engine to find Facebook pages offering a specific
 * training keyword. No Playwright, no login, no bot detection issues.
 *
 * Strategy  : SerpAPI Google dork → site:facebook.com "keyword" ("training center" OR "review center" OR ...)
 * Persistence: Returns transient discovery records for user review before DB commit
 *
 * Requirements:
 *   - npm install serpapi
 *   - SERPAPI_KEY in .env
 */

'use strict';

require('dotenv').config();
const { getJson } = require('serpapi');
const { withRetry } = require('../core/retry');
const logger = require('../core/logger');

const SOURCE = 'facebook_search_serpapi';

/**
 * URL path segments that indicate non-provider Facebook pages (noise).
 * These are filtered out after SerpAPI returns results.
 */
const FACEBOOK_NOISE_PATHS = [
  '/public/',
  '/people/',
  '/groups/',
  '/posts/',        // Individual post URLs — not provider pages
  '/events/',
  '/marketplace/',
  '/watch/',
  '/reel/',
  '/photo/',
  '/video/',
];

/**
 * Institution-type terms used to build the dork query.
 * These focus results on actual providers rather than forum posts,
 * Q&A discussions, or general mentions of the keyword.
 *
 * Add more terms here as needed (e.g. '"TESDA accredited"', '"CPD provider"').
 */
const INSTITUTION_TERMS = [
  '"training center"',
  '"review center"',
  '"training provider"',
  '"training institute"',
  '"learning center"',
  '"safety training"',
  '"accredited training"',
  '"TESDA accredited"',
  '"CPD provider"',
  '"DOLE accredited"',
  '"seminar"',
  '"course"',
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Searches Google (via SerpAPI) for Facebook pages offering the specified
 * training keyword. Results are transient — intended for user review before
 * being committed to the database.
 *
 * @param {string} keyword              - Training keyword (e.g. "COSH", "First Aid")
 * @param {object} [options={}]
 * @param {number} [options.maxPages=3] - Number of Google result pages to fetch (10 results each)
 * @param {string} [options.location='Philippines'] - SerpAPI location filter
 * @returns {Promise<object[]>}         - Array of transient discovery records
 */
async function scrapeFacebookSearch(keyword, options = {}) {
  const { maxPages = 3, location = 'Philippines' } = options;

  if (!process.env.SERPAPI_KEY) {
    logger.error(SOURCE, 'SERPAPI_KEY is not set in .env — aborting.');
    return [];
  }

  logger.info(SOURCE, `Starting SerpAPI search for keyword: "${keyword}" (maxPages: ${maxPages})`);

  const allResults = [];

  try {
    const records = await withRetry(
      () => performSerpApiSearch(keyword, maxPages, location),
      2,
      2000,
      `serpapi:${keyword}`
    );
    allResults.push(...records);
  } catch (err) {
    logger.error(SOURCE, `SerpAPI search failed for "${keyword}": ${err.message}`);
  }

  logger.info(SOURCE, `Finished search for "${keyword}". Found ${allResults.length} result(s).`);
  return allResults;
}

// ---------------------------------------------------------------------------
// Core search logic
// ---------------------------------------------------------------------------

/**
 * Executes a paginated Google dork search via SerpAPI.
 *
 * Each page returns up to 10 results. SerpAPI pagination uses the `start`
 * parameter (0 = page 1, 10 = page 2, 20 = page 3, etc.).
 *
 * @param {string} keyword
 * @param {number} maxPages
 * @param {string} location
 * @returns {Promise<object[]>}
 */
async function performSerpApiSearch(keyword, maxPages, location) {
  const query = buildDorkQuery(keyword);
  const allRecords = [];
  const seenUrls = new Set();

  logger.info(SOURCE, `Dork query: ${query}`);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const start = (pageNum - 1) * 10;

    logger.info(SOURCE, `Fetching SerpAPI page ${pageNum}/${maxPages} (start=${start}) for "${keyword}"`);

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

    if (organicResults.length === 0) {
      logger.info(SOURCE, `No results on page ${pageNum} — stopping pagination early.`);
      break;
    }

    const pageRecords = [];

    for (const item of organicResults) {
      const url = item.link ?? '';
      const title = item.title ?? '';
      const snippet = item.snippet ?? '';

      // Must be a Facebook URL
      if (!url.includes('facebook.com')) continue;

      // Skip noise paths (group posts, photo URLs, individual posts, etc.)
      if (FACEBOOK_NOISE_PATHS.some((path) => url.includes(path))) {
        logger.info(SOURCE, `[FILTERED] ${url}`);
        continue;
      }

      // Deduplicate across pages
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      // Clean provider name: strip "| Facebook" suffix, then take the part before " - "
      const providerName = title
        .replace(/\s*\|\s*Facebook$/i, '')
        .split(' - ')[0]
        .trim();

      pageRecords.push({
        keyword,
        title,
        provider: providerName,
        url,
        description: snippet,
        status: 'discovered',
        source: 'facebook_serpapi_dork',
        date: extractDate(snippet),
        price: extractPrice(snippet),
        delivery_mode: detectDeliveryMode(snippet),
      });
    }

    allRecords.push(...pageRecords);
    logger.info(
      SOURCE,
      `Page ${pageNum}: +${pageRecords.length} result(s). Running total: ${allRecords.length}`
    );

    // Stop early if SerpAPI signals there is no next page
    if (!result.serpapi_pagination?.next) {
      logger.info(SOURCE, 'No next page available — stopping pagination.');
      break;
    }
  }

  return allRecords;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a targeted Google dork query for Facebook training providers.
 *
 * Combines the keyword with institution-type terms to surface actual
 * providers (pages, centers) rather than forum posts, group discussions,
 * or general keyword mentions.
 *
 * Example output:
 *   site:facebook.com "COSH" ("training center" OR "review center" OR "training provider" OR ...)
 *
 * @param {string} keyword
 * @returns {string}
 */
function buildDorkQuery(keyword) {
  const institutionClause = INSTITUTION_TERMS.join(' OR ');
  return `site:facebook.com "${keyword}" (${institutionClause})`;
}

/**
 * Infers delivery mode from a snippet string.
 * Returns null if the snippet doesn't contain enough signal.
 *
 * @param {string} snippet
 * @returns {'Online'|'In-Person'|null}
 */
function detectDeliveryMode(snippet) {
  const s = snippet.toLowerCase();
  if (s.includes('online') || s.includes('virtual') || s.includes('webinar') || s.includes('zoom')) {
    return 'Online';
  }
  if (s.includes('in-person') || s.includes('face-to-face') || s.includes('on-site') || s.includes('face to face')) {
    return 'In-Person';
  }
  return null;
}

/**
 * Attempts to extract a date string from a snippet.
 * Returns null if no recognizable date pattern is found.
 *
 * Matches patterns like:
 *   "May 8, 2026" | "April 6, 7, 8" | "2026-04-10"
 *
 * @param {string} snippet
 * @returns {string|null}
 */
function extractDate(snippet) {
  const match = snippet.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b/i
  );
  return match ? match[0] : null;
}

/**
 * Attempts to extract a price from a snippet.
 * Returns null if no price pattern is found.
 *
 * Matches patterns like:
 *   "₱3,500" | "PHP 4000" | "Php 2,500" | "P 1500"
 *
 * @param {string} snippet
 * @returns {string|null}
 */
function extractPrice(snippet) {
  const match = snippet.match(/(?:₱|PHP|Php|P)\s?[\d,]+/i);
  return match ? match[0] : null;
}

module.exports = { scrapeFacebookSearch };
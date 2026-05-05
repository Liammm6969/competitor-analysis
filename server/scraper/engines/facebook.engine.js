/**
 * facebook.engine.js — Training Provider Discovery via Facebook Search
 */

'use strict';

const { getJson } = require('serpapi');
const logger = require('../core/logger');
const { normalizeUrl } = require('./google.engine');

const SOURCE = 'engine_facebook_search';

/**
 * Searches Facebook via DuckDuckGo (SerpAPI) for pages and posts.
 * This provides a fallback discovery engine as the direct Facebook search is unsupported.
 */
async function searchFacebook(keyword, options = {}) {
  const { includePostsSearch = true } = options;
  const pageRecords = [];
  const seenUrls = new Set();

  try {
    // Search Facebook via DuckDuckGo (Better than Bing for site-specific searches)
    const result = await getJson({
      engine: 'duckduckgo',
      api_key: process.env.SERPAPI_KEY,
      q: `site:facebook.com "${keyword}"`,
    });

    const results = result.organic_results ?? [];
    for (const item of results) {
      const url = item.link ?? '';
      if (!url.includes('facebook.com')) continue;

      const norm = normalizeUrl(url);
      if (seenUrls.has(norm)) continue;
      seenUrls.add(norm);

      pageRecords.push({
        keyword,
        provider: item.title?.replace(/\s*\|\s*Facebook$/i, '').split(' - ')[0].trim(),
        url,
        normalizedUrl: norm,
        title: item.title,
        description: item.snippet ?? '',
        type: null, 
        online_price: null,
        f2f_price: null,
        inclusion: null,
        trainings_offered: keyword,
        date: null,
        likes: null,
        category: null,
        address: null,
        phone: null,
        website: null,
        weakness: null,
        source: 'facebook_search_ddg',
        status: 'discovered',
      });
    }
  } catch (err) {
    const errMsg = err.error || err.message || (typeof err === 'string' ? err : JSON.stringify(err));
    logger.error(SOURCE, `Facebook engine search failed: ${errMsg}`);
  }

  return pageRecords;
}

module.exports = { searchFacebook };

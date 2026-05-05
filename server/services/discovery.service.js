/**
 * discovery.service.js — Discovery Pipeline Orchestrator
 */

'use strict';

const { searchGoogle, normalizeUrl } = require('../scraper/engines/google.engine');
const { searchFacebook } = require('../scraper/engines/facebook.engine');
const logger = require('../scraper/core/logger');

const SOURCE = 'service_discovery';

/**
 * Orchestrates multiple engines to find training providers.
 */
async function discoverCompetitors(keyword, options = {}) {
  const { engines = 'both', maxPages = 3 } = options;
  
  logger.info(SOURCE, `Starting discovery for "${keyword}" using engines: ${engines}`);

  const tasks = [];
  if (engines === 'google' || engines === 'both') {
    tasks.push(searchGoogle(keyword, { maxPages }));
  }
  if (engines === 'facebook' || engines === 'both') {
    tasks.push(searchFacebook(keyword));
  }

  const resultsArray = await Promise.all(tasks);
  const flatResults = resultsArray.flat();

  const mergedMap = new Map();

  for (const record of flatResults) {
    const key = record.normalizedUrl;
    if (!key) {
      mergedMap.set(`no-url-${Math.random()}`, record);
      continue;
    }

    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key);
      mergedMap.set(key, mergeRecords(existing, record));
    } else {
      mergedMap.set(key, record);
    }
  }

  const finalResults = Array.from(mergedMap.values());
  logger.info(SOURCE, `Discovery complete for "${keyword}". Merged ${flatResults.length} raw results into ${finalResults.length} unique records.`);

  return finalResults;
}

function mergeRecords(a, b) {
  const merged = { ...a };

  for (const key in b) {
    if (merged[key] === null && b[key] !== null) {
      merged[key] = b[key];
    }
  }

  if (a.source !== b.source) {
    const sources = new Set([...a.source.split('+'), ...b.source.split('+')]);
    merged.source = Array.from(sources).sort().join('+');
  }

  if ((b.description || '').length > (a.description || '').length) {
    merged.description = b.description;
  }

  return merged;
}

module.exports = { discoverCompetitors };

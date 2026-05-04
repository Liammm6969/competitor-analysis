/**
 * website.scraper.js — Training Website Scraper
 *
 * Scrapes structured training/seminar data from specific competitor websites.
 * Uses a hybrid approach: Axios+Cheerio for static, Playwright for JS-heavy sites.
 *
 * Each "site config" defines:
 *   - url: page to scrape
 *   - type: 'static' | 'dynamic'
 *   - selectors: CSS selector map
 *   - provider: override name
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { launchBrowser, closeBrowser, randomDelay } = require('../core/browser');
const { withRetry } = require('../core/retry');
const logger = require('../core/logger');

const SOURCE = 'website';

/**
 * Default site configurations.
 * Add competitor training website entries here.
 *
 * Example config object:
 * {
 *   url: 'https://example-training.com/courses',
 *   type: 'static',  // or 'dynamic'
 *   provider: 'Example Training Center',
 *   selectors: {
 *     item: '.course-card',
 *     title: 'h3.course-title',
 *     date: '.course-date',
 *     price: '.course-price',
 *     description: '.course-desc',
 *     link: 'a.course-link',
 *   }
 * }
 */
const DEFAULT_SITE_CONFIGS = [
  // Add your competitor training website configs here.
  // Leave empty for now — populated via scraper.config.js or passed at runtime.
];

/**
 * Scrapes a list of website configs.
 * @param {object[]} siteConfigs - Array of site config objects
 * @returns {Promise<object[]>}
 */
async function scrapeWebsites(siteConfigs = DEFAULT_SITE_CONFIGS) {
  const allResults = [];

  // Separate static vs dynamic sites
  const staticSites  = siteConfigs.filter((s) => s.type !== 'dynamic');
  const dynamicSites = siteConfigs.filter((s) => s.type === 'dynamic');

  // ── Static scraping ───────────────────────────────────────────────────────
  for (const config of staticSites) {
    logger.info(SOURCE, `Static scrape: ${config.url}`);
    try {
      const records = await withRetry(
        () => scrapeStaticSite(config),
        3,
        2000,
        `website:static:${config.url}`
      );
      allResults.push(...records);
    } catch (err) {
      logger.error(SOURCE, `Failed: ${config.url} — ${err.message}`);
    }
    await randomDelay(1000, 3000);
  }

  // ── Dynamic scraping (shared browser session) ─────────────────────────────
  if (dynamicSites.length > 0) {
    const { browser, page } = await launchBrowser({ headless: true });
    try {
      for (const config of dynamicSites) {
        logger.info(SOURCE, `Dynamic scrape: ${config.url}`);
        try {
          const records = await withRetry(
            () => scrapeDynamicSite(page, config),
            3,
            3000,
            `website:dynamic:${config.url}`
          );
          allResults.push(...records);
        } catch (err) {
          logger.error(SOURCE, `Failed dynamic: ${config.url} — ${err.message}`);
        }
        await randomDelay(2000, 5000);
      }
    } finally {
      await closeBrowser(browser);
    }
  }

  return allResults;
}

// ─── Static Scraper ──────────────────────────────────────────────────────────
async function scrapeStaticSite(config) {
  const { url, selectors = {}, provider = 'Unknown' } = config;

  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(response.data);
  const records = [];

  const itemSel = selectors.item || 'article, .course, .training, .seminar, [class*="course"]';

  $(itemSel).each((_, el) => {
    const title       = $(el).find(selectors.title || 'h2, h3').first().text().trim();
    const date        = $(el).find(selectors.date  || 'time, [class*="date"]').first().attr('datetime') ||
                        $(el).find(selectors.date  || 'time, [class*="date"]').first().text().trim();
    const price       = $(el).find(selectors.price || '[class*="price"]').first().text().trim();
    const description = $(el).find(selectors.description || 'p').first().text().trim().slice(0, 500);
    const href        = $(el).find(selectors.link  || 'a').first().attr('href') || '';
    const eventUrl    = href ? resolveUrl(url, href) : url;

    if (!title || title.length < 3) return;

    records.push({
      title,
      date,
      price,
      provider,
      description,
      url: eventUrl,
      delivery_mode: 'Online',
    });
  });

  logger.info(SOURCE, `Extracted ${records.length} records from ${url}`);
  return records;
}

// ─── Dynamic Scraper ─────────────────────────────────────────────────────────
async function scrapeDynamicSite(page, config) {
  const { url, selectors = {}, provider = 'Unknown' } = config;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await randomDelay(2000, 4000);

  // Scroll to trigger lazy-load
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await randomDelay(1000, 2000);
  }

  const records = await page.evaluate(
    ({ sel, baseUrl, provider }) => {
      const results = [];
      const itemSel = sel.item || 'article, .course, .training, .seminar';

      document.querySelectorAll(itemSel).forEach((el) => {
        const titleEl = el.querySelector(sel.title || 'h2, h3');
        const title   = titleEl?.innerText.trim() || '';
        if (title.length < 3) return;

        const timeEl      = el.querySelector(sel.date || 'time');
        const date        = timeEl?.getAttribute('datetime') || timeEl?.innerText.trim() || '';
        const price       = el.querySelector(sel.price || '[class*="price"]')?.innerText.trim() || '';
        const description = el.querySelector(sel.description || 'p')?.innerText.trim().slice(0, 500) || '';
        const href        = el.querySelector(sel.link || 'a')?.href || baseUrl;

        results.push({ title, date, price, provider, description, url: href, delivery_mode: 'Online' });
      });

      return results;
    },
    { sel: selectors, baseUrl: url, provider }
  );

  logger.info(SOURCE, `Extracted ${records.length} records from ${url}`);
  return records;
}

function resolveUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

module.exports = { scrapeWebsites };

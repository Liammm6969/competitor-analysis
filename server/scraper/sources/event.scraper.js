/**
 * event.scraper.js — Generic Event Platform Scraper
 *
 * Scrapes training/seminar listings from generic event websites.
 * Supports both static (Axios + Cheerio) and dynamic (Playwright) pages.
 *
 * Supported targets:
 *   - EventBrite-style listing pages
 *   - General event listing pages with common patterns
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { launchBrowser, closeBrowser, randomDelay } = require('../core/browser');
const { withRetry } = require('../core/retry');
const logger = require('../core/logger');

const SOURCE = 'event_platform';

/**
 * Scrapes event listing pages using Axios + Cheerio (fast, for static pages).
 * @param {string[]} urls
 * @param {object}   selectorMap  - CSS selectors for this specific site
 * @returns {Promise<object[]>}
 */
async function scrapeStaticEventPage(urls, selectorMap = {}) {
  const allResults = [];

  const selectors = {
    item:         selectorMap.item        || '.eds-event-card, article, .event-card, [class*="event"]',
    title:        selectorMap.title       || 'h2, h3, .event-title, [class*="title"]',
    date:         selectorMap.date        || 'time, .event-date, [class*="date"]',
    price:        selectorMap.price       || '.eds-text-color--primary-brand, .price, [class*="price"]',
    provider:     selectorMap.provider    || '.organizer, .provider, [class*="organizer"]',
    description:  selectorMap.description || 'p, .description, [class*="desc"]',
    url:          selectorMap.url         || 'a[href]',
  };

  for (const url of urls) {
    logger.info(SOURCE, `Fetching static page: ${url}`);

    try {
      const results = await withRetry(
        async () => {
          const response = await axios.get(url, {
            timeout: 15000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });

          const $ = cheerio.load(response.data);
          const records = [];

          $(selectors.item).each((_, el) => {
            const title       = $(el).find(selectors.title).first().text().trim();
            const date        = $(el).find(selectors.date).first().attr('datetime') ||
                                $(el).find(selectors.date).first().text().trim();
            const price       = $(el).find(selectors.price).first().text().trim();
            const provider    = $(el).find(selectors.provider).first().text().trim();
            const description = $(el).find(selectors.description).first().text().trim().slice(0, 500);
            const href        = $(el).find(selectors.url).first().attr('href');
            const eventUrl    = href ? resolveUrl(url, href) : url;

            if (!title || title.length < 3) return;

            records.push({ title, date, price, provider, description, url: eventUrl, delivery_mode: 'Online' });
          });

          return records;
        },
        3,
        2000,
        `event:static:${url}`
      );

      allResults.push(...results);
      logger.info(SOURCE, `Found ${results.length} records from ${url}`);
    } catch (err) {
      logger.error(SOURCE, `Failed static scrape of ${url}: ${err.message}`);
    }

    await randomDelay(1000, 3000);
  }

  return allResults;
}

/**
 * Scrapes event listing pages using Playwright (for JS-heavy pages).
 * @param {string[]} urls
 * @param {object}   selectorMap
 * @returns {Promise<object[]>}
 */
async function scrapeDynamicEventPage(urls, selectorMap = {}) {
  const allResults = [];
  const { browser, page } = await launchBrowser({ headless: true });

  const selectors = {
    item:        selectorMap.item        || 'article, .event-card, [class*="event-item"]',
    title:       selectorMap.title       || 'h2, h3, [class*="title"]',
    date:        selectorMap.date        || 'time, [class*="date"]',
    price:       selectorMap.price       || '[class*="price"]',
    provider:    selectorMap.provider    || '[class*="organizer"], [class*="provider"]',
    description: selectorMap.description || 'p',
    link:        selectorMap.link        || 'a',
  };

  try {
    for (const url of urls) {
      logger.info(SOURCE, `Fetching dynamic page: ${url}`);

      try {
        const records = await withRetry(
          async () => {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await randomDelay(2000, 4000);

            // Scroll to load more items
            for (let i = 0; i < 3; i++) {
              await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
              await randomDelay(1000, 2000);
            }

            return await page.evaluate((sel) => {
              const results = [];
              document.querySelectorAll(sel.item).forEach((el) => {
                const title       = el.querySelector(sel.title)?.innerText.trim() || '';
                const timeEl      = el.querySelector(sel.date);
                const date        = timeEl?.getAttribute('datetime') || timeEl?.innerText.trim() || '';
                const price       = el.querySelector(sel.price)?.innerText.trim() || '';
                const provider    = el.querySelector(sel.provider)?.innerText.trim() || '';
                const description = el.querySelector(sel.description)?.innerText.trim().slice(0, 500) || '';
                const href        = el.querySelector(sel.link)?.href || window.location.href;

                if (title.length < 3) return;
                results.push({ title, date, price, provider, description, url: href, delivery_mode: 'Online' });
              });
              return results;
            }, selectors);
          },
          3,
          3000,
          `event:dynamic:${url}`
        );

        allResults.push(...records);
        logger.info(SOURCE, `Found ${records.length} records from ${url}`);
      } catch (err) {
        logger.error(SOURCE, `Failed dynamic scrape of ${url}: ${err.message}`);
      }

      await randomDelay(2000, 5000);
    }
  } finally {
    await closeBrowser(browser);
  }

  return allResults;
}

/**
 * Resolve relative URLs against a base URL.
 */
function resolveUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

module.exports = { scrapeStaticEventPage, scrapeDynamicEventPage };

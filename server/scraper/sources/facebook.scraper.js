/**
 * facebook.scraper.js — Facebook Page Events Scraper
 *
 * Scrapes public Facebook pages for training/seminar posts.
 * Uses Playwright to handle dynamic JS-rendered content and infinite scrolling.
 *
 * NOTE: Facebook has aggressive anti-bot protections.
 * This scraper works on PUBLIC pages only (no login required for posts).
 * For better results, configure FB_EMAIL + FB_PASSWORD in .env (optional).
 */

const { launchBrowser, closeBrowser, randomDelay } = require('../core/browser');
const { withRetry } = require('../core/retry');
const logger = require('../core/logger');

const SOURCE = 'facebook';

/**
 * Scrapes a list of public Facebook page URLs for event/training posts.
 * @param {string[]} pageUrls - Array of Facebook page URLs to scrape
 * @returns {Promise<object[]>} - Raw scraped records
 */
async function scrapeFacebookPages(pageUrls = []) {
  const allResults = [];

  const { browser, page } = await launchBrowser({ headless: true });

  try {
    for (const url of pageUrls) {
      logger.info(SOURCE, `Scraping Facebook page: ${url}`);

      try {
        const records = await withRetry(
          () => scrapeSinglePage(page, url),
          3,
          3000,
          `facebook:${url}`
        );
        allResults.push(...records);
        logger.info(SOURCE, `Found ${records.length} records from ${url}`);
      } catch (err) {
        logger.error(SOURCE, `Failed to scrape ${url}: ${err.message}`);
      }

      // Human-like delay between pages
      await randomDelay(3000, 7000);
    }
  } finally {
    await closeBrowser(browser);
  }

  return allResults;
}

/**
 * Scrapes a single Facebook page for posts containing training/seminar keywords.
 * @param {import('playwright').Page} page
 * @param {string} url
 * @returns {Promise<object[]>}
 */
async function scrapeSinglePage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await randomDelay(2000, 4000);

  // Scroll down to load more posts (Facebook uses infinite scroll)
  await autoScroll(page, 3);

  // Extract posts
  const rawPosts = await page.evaluate(() => {
    const posts = [];

    // Facebook's post container selectors (public pages)
    const postContainers = document.querySelectorAll('[data-pagelet^="FeedUnit"]');

    postContainers.forEach((container) => {
      const textEl = container.querySelector('[data-ad-comet-preview="message"], [dir="auto"]');
      const text = textEl ? textEl.innerText.trim() : '';

      // Only capture posts that mention training/seminar/workshop keywords
      const keywords = ['training', 'seminar', 'workshop', 'webinar', 'course', 'certification', 'bootcamp'];
      const lower = text.toLowerCase();
      if (!keywords.some((kw) => lower.includes(kw))) return;

      // Try to find a link in the post
      const linkEl = container.querySelector('a[href*="/events/"], a[href*="fb.com/events"]');
      const url = linkEl ? linkEl.href : window.location.href;

      // Try to find a date mention in text
      const dateMatch = text.match(
        /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i
      );

      // Try to find a price
      const priceMatch = text.match(/(₱|PHP|php)\s?[\d,]+(\.\d{2})?|free/i);

      // Try to extract a title (first line of post text)
      const title = text.split('\n')[0].trim().slice(0, 200);

      posts.push({
        title,
        description: text.slice(0, 500),
        date: dateMatch ? dateMatch[0] : null,
        price: priceMatch ? priceMatch[0] : null,
        url,
        delivery_mode: lower.includes('online') ? 'Online' : lower.includes('in-person') ? 'In-Person' : 'Online',
      });
    });

    return posts;
  });

  // Add page URL as provider fallback
  return rawPosts.map((p) => ({
    ...p,
    provider: extractProviderFromUrl(url),
  }));
}

/**
 * Auto-scrolls the page to trigger lazy-loaded content.
 * @param {import('playwright').Page} page
 * @param {number} times
 */
async function autoScroll(page, times = 3) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await randomDelay(1500, 3000);
  }
}

/**
 * Extracts a readable provider name from a Facebook page URL.
 * e.g. "https://www.facebook.com/SomeTrainingCenter" → "SomeTrainingCenter"
 */
function extractProviderFromUrl(url) {
  try {
    const path = new URL(url).pathname.replace(/\//g, '').replace(/-/g, ' ');
    return path || 'Facebook Page';
  } catch {
    return 'Facebook Page';
  }
}

module.exports = { scrapeFacebookPages };

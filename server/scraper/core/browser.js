/**
 * browser.js — Core Browser Manager
 * Handles launching, configuration, and cleanup of Playwright browser instances.
 */

const { chromium } = require('playwright');

// Pool of common user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];

/**
 * Returns a random user agent string from the pool.
 */
function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Launches a Playwright browser with stealth-like settings.
 * @returns {{ browser, context, page }}
 */
async function launchBrowser({ headless = true } = {}) {
  const browser = await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,800',
    ],
  });

  const context = await browser.newContext({
    userAgent: randomUserAgent(),
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
    // Emulate a real desktop browser — hide navigator.webdriver
    javaScriptEnabled: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  // Patch navigator.webdriver so automation is hidden
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  return { browser, context, page };
}

/**
 * Safely closes a browser instance.
 * @param {import('playwright').Browser} browser
 */
async function closeBrowser(browser) {
  if (browser) {
    try {
      await browser.close();
    } catch (err) {
      console.warn('[BrowserManager] Failed to close browser cleanly:', err.message);
    }
  }
}

/**
 * Adds a random human-like delay (ms) between min and max.
 * @param {number} min
 * @param {number} max
 */
async function randomDelay(min = 1000, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { launchBrowser, closeBrowser, randomDelay, randomUserAgent };

/**
 * scraper.config.js — Scraper configuration
 *
 * Central place to define:
 * - Facebook pages to scrape
 * - Event platform URLs with their selector maps
 * - Competitor training website configs
 *
 * HOW TO ADD TARGETS:
 * 1. Facebook: Add the public page URL to FACEBOOK_PAGES
 * 2. Event sites: Add a config object to EVENT_SITES
 * 3. Training websites: Add a config object to WEBSITE_CONFIGS
 */

module.exports = {
  /**
   * Public Facebook pages to scrape for training/seminar announcements.
   * Only public pages work without authentication.
   *
   * Example: 'https://www.facebook.com/SomeTrainingProviderPage'
   */
  FACEBOOK_PAGES: [
    'https://web.facebook.com/QESHTrainingCenter'
    // Add competitor Facebook page URLs here
    // 'https://www.facebook.com/ExampleTrainingCenter',
  ],

  /**
   * Generic event listing pages.
   * `type: 'static'` for plain HTML pages (faster)
   * `type: 'dynamic'` for JavaScript-rendered pages
   *
   * Selectors use CSS selector strings targeting the correct DOM elements.
   */
  EVENT_SITES: [
    // Example:
    // {
    //   url: 'https://www.eventbrite.com/d/online/training-seminar/',
    //   type: 'dynamic',
    //   selectors: {
    //     item:        '[class*="eds-event-card"]',
    //     title:       '[class*="eds-event-card-content__title"]',
    //     date:        'time',
    //     price:       '[class*="eds-text-color--primary-brand"]',
    //     provider:    '[class*="eds-event-card-content__sub-title"]',
    //     description: '[class*="summary"]',
    //     link:        'a[href]',
    //   },
    // },
  ],

  /**
   * Specific competitor training website pages.
   * Works for any site with a repeating list structure.
   */
  WEBSITE_CONFIGS: [
    // Example — static page:
    // {
    //   url: 'https://competitor-training.com/courses',
    //   type: 'static',
    //   provider: 'Competitor Training Center',
    //   selectors: {
    //     item:        '.course-card',
    //     title:       '.course-title',
    //     date:        '.course-date',
    //     price:       '.course-price',
    //     description: '.course-desc',
    //     link:        'a.course-link',
    //   },
    // },
    //
    // Example — dynamic page:
    // {
    //   url: 'https://lms.competitor.com/seminars',
    //   type: 'dynamic',
    //   provider: 'LMS Competitor',
    //   selectors: {
    //     item: '.seminar-item',
    //     title: 'h3',
    //     date: 'time',
    //     price: '.price-tag',
    //     link: 'a',
    //   },
    // },
  ],

  /**
   * Scraper behavior settings
   */
  SETTINGS: {
    concurrency: 2,     // Max parallel browser instances
    maxRetries: 3,     // Retry count per source
    delayBetweenPages: [2000, 5000], // Random ms delay range between page fetches
    headless: true,  // Run browser headless (no UI)
  },
};

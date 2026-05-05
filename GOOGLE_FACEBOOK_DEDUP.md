# Implementation Plan: SerpAPI Google Dork + Facebook Search

**Project:** Competitor Analysis System — Discovery Pipeline  
**Stack:** Node.js · Express.js · MongoDB · SerpAPI  
**Date:** May 2026

---

## Overview

This implementation plan covers the full refactor of the Facebook scraper into a dual-engine discovery pipeline using SerpAPI's Google and Facebook search engines. The goal is to preserve the existing Facebook scraper as a fallback while introducing a cleaner, more maintainable architecture.

---

## Architecture

```
POST /api/discovery/discover
        │
        ▼
discovery.service.js          ← orchestrator
        │
        ├── google.engine.js  ← SerpAPI Google dork (primary)
        └── facebook.engine.js ← SerpAPI Facebook pages + posts (secondary)
        │
        ▼
classifier.service.js         ← classify each merged record
        │
        ▼
Transient results → frontend review table
        │
        ▼ (user approves)
POST /api/discovery/approve
        │
        ▼
MongoDB competitors collection
```

---

## Folder Structure

```
server/
├── scrapers/
│   ├── engines/
│   │   ├── google.engine.js          ← NEW
│   │   └── facebook.engine.js        ← NEW
│   └── facebook-search.scraper.js    ← KEEP (deprecated, fallback)
├── services/
│   ├── discovery.service.js          ← NEW
│   └── classifier.service.js         ← KEEP (unchanged)
├── models/
│   └── competitor.model.js           ← KEEP (unchanged)
├── routes/
│   └── discovery.routes.js           ← EDIT (point to discovery.service)
└── core/
    ├── logger.js
    └── retry.js
```

---

## Phase 1 — Folder Structure & Engine Abstraction

**Goal:** Set up the `scrapers/engines/` folder and define the standard output shape that all engines must conform to.

### Tasks

- Create `scrapers/engines/` directory
- Define the standard discovery record shape (see below)
- Keep `facebook-search.scraper.js` as-is — do not delete yet

### Standard Record Shape

Every engine must return records in this exact shape so `discovery.service.js` can merge them without transformation:

```javascript
{
  // Identity
  keyword,            // string  — search keyword used
  provider,           // string  — cleaned page/provider name
  url,                // string  — Facebook page URL
  title,              // string  — raw result title
  description,        // string  — snippet or page description

  // Classification (partially populated — classifier fills the rest)
  type,               // 'Online' | 'In-Person' | null
  competitor_type,    // 'Training Center' | 'Review Center' | 'Institute' | 'Training Provider' | null
  is_direct,          // boolean | null

  // Enrichment
  online_price,       // string | null  e.g. '₱3,500'
  f2f_price,          // string | null
  inclusion,          // string | null  e.g. 'with certificate'
  trainings_offered,  // string | null  e.g. 'COSH, BOSH, SO2'
  date,               // string | null  e.g. 'May 8, 2026'

  // Facebook-exclusive (null when coming from Google engine)
  likes,              // number | null
  category,           // string | null  e.g. 'Training center'
  address,            // string | null
  phone,              // string | null
  website,            // string | null

  // Meta
  weakness,           // string | null  — always null, filled manually in UI
  source,             // 'google_dork' | 'facebook_pages' | 'facebook_posts' | 'google_dork+facebook_pages'
  status,             // 'discovered' | 'approved' | 'rejected'
}
```

---

## Phase 2 — Google Dork Engine

**File:** `scrapers/engines/google.engine.js`  
**Credits:** 1 SerpAPI credit per page · default 3 pages = 3 credits per keyword

### What it does

- Builds a targeted Google dork query: `site:facebook.com "COSH" ("training center" OR "review center" OR ...)`
- Paginates using SerpAPI's `start` parameter (0, 10, 20...)
- Filters noise paths: `/groups/`, `/posts/`, `/events/`, `/people/`, `/photo/`, `/video/`, etc.
- Deduplicates by URL across pages
- Extracts from snippet: `type`, `online_price`, `f2f_price`, `inclusion`, `trainings_offered`, `date`
- Stops early when `serpapi_pagination.next` is absent

### Dork query structure

```
site:facebook.com "COSH" (
  "training center" OR "review center" OR "training provider" OR
  "training institute" OR "learning center" OR "safety training" OR
  "accredited training" OR "DOLE accredited" OR "TESDA accredited" OR
  "CPD provider" OR "seminar" OR "course"
)
```

### Exports

```javascript
searchGoogle(keyword, options)
// options: { maxPages = 3, location = 'Philippines' }
```

---

## Phase 3 — Facebook Search Engine

**File:** `scrapers/engines/facebook.engine.js`  
**Credits:** 2 SerpAPI credits per keyword (1 pages + 1 posts)

### What it does

Runs two SerpAPI Facebook searches per keyword:

| Pass | `type` | Purpose | Key fields |
|---|---|---|---|
| 1 | `pages` | Find provider Facebook Pages | `likes`, `category`, `address`, `phone`, `website` |
| 2 | `posts` | Find public posts with price/schedule | `snippet` with fee/date data |

After both passes, merges post data into page records where the provider URL or name matches. Post records that don't match any page are included as standalone records.

### Facebook-exclusive fields

These fields are only available from the Facebook engine — they are always `null` in Google engine results:

- `likes` — page like count (proxy for market presence)
- `category` — Facebook's own label (e.g. `"Training center"`, `"Education"`)
- `address` — physical address if listed on the page
- `phone` — contact number if listed
- `website` — external website if linked

### Exports

```javascript
searchFacebook(keyword, options)
// options: { includePostsSearch = true }
```

---

## Phase 4 — Discovery Service (Orchestrator)

**File:** `services/discovery.service.js`

### What it does

1. Runs selected engines in parallel via `Promise.all()`
2. Merges results and deduplicates by normalised URL
3. When both engines return the same URL — merges their fields:
   - Google record is the base
   - Facebook fills any `null` fields
   - Facebook-exclusive fields always come from Facebook
   - `source` is set to `'google_dork+facebook_pages'`
4. Passes merged records through `classifyCompetitor()`
5. Returns transient classified records — does **not** save to DB

### Engine selection via `engines` param

```javascript
discoverCompetitors('COSH', { engines: 'both' })     // 3+ credits
discoverCompetitors('COSH', { engines: 'google' })   // 1–3 credits
discoverCompetitors('COSH', { engines: 'facebook' }) // 2 credits
```

### Credit cost summary

| engines | Credits per keyword |
|---|---|
| `'google'` | 1 per page × maxPages (default 3) |
| `'facebook'` | 2 (pages + posts) |
| `'both'` | 3+ (google pages + fb pages + fb posts) |
| Free tier limit | 100 credits/month → ~25 keywords on `'both'` |

### URL normalisation for dedup

```javascript
// Both of these resolve to the same key:
'https://www.facebook.com/safetyhealth001/'
'https://facebook.com/safetyhealth001'
// → 'facebook.com/safetyhealth001'
```

### Exports

```javascript
discoverCompetitors(keyword, options)
// options: { engines = 'both', maxPages = 3, location = 'Philippines', includePostsSearch = true }
```

---

## Phase 5 — Update Route

**File:** `routes/discovery.routes.js` — edit only

Replace the direct scraper call with the new discovery service:

```javascript
// Before
const { scrapeFacebookSearch } = require('../scrapers/facebook-search.scraper');

router.post('/discover', async (req, res) => {
  const { keyword, maxPages = 3 } = req.body;
  const raw = await scrapeFacebookSearch(keyword, { maxPages });
  // ...
});

// After
const { discoverCompetitors } = require('../services/discovery.service');

router.post('/discover', async (req, res) => {
  const { keyword, engines = 'both', maxPages = 3 } = req.body;
  const results = await discoverCompetitors(keyword, { engines, maxPages });
  res.json({ success: true, count: results.length, data: results });
});
```

### Full route surface

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/discovery/discover` | Run discovery — returns transient results |
| `POST` | `/api/discovery/approve` | Save approved records to MongoDB |
| `PATCH` | `/api/discovery/:id` | Update a single field (price, weakness, etc.) |
| `GET` | `/api/discovery` | Fetch all approved competitors |

### Deprecate old scraper

Add `@deprecated` JSDoc tag to `facebook-search.scraper.js` but do not delete it until the new engines are confirmed working in production.

---

## Phase 6 — Testing

Three test scripts to validate each layer independently before wiring them together.

### test-google-engine.js

```javascript
require('dotenv').config();
const { searchGoogle } = require('./scrapers/engines/google.engine');

async function test() {
  const results = await searchGoogle('COSH', { maxPages: 1 });
  console.log(`Found: ${results.length}`);
  console.assert(results.length > 0, 'Should return results');
  console.assert(results[0].url.includes('facebook.com'), 'URLs should be Facebook');
  console.assert(results[0].source === 'google_dork', 'Source should be google_dork');
  console.log(results[0]);
}

test().catch(console.error);
```

### test-facebook-engine.js

```javascript
require('dotenv').config();
const { searchFacebook } = require('./scrapers/engines/facebook.engine');

async function test() {
  const results = await searchFacebook('COSH');
  console.log(`Found: ${results.length}`);
  console.assert(results.length > 0, 'Should return results');
  console.assert(results[0].url.includes('facebook.com'), 'URLs should be Facebook');
  // Facebook engine should provide at least some likes data
  const withLikes = results.filter(r => r.likes !== null);
  console.log(`Records with likes data: ${withLikes.length}/${results.length}`);
  console.log(results[0]);
}

test().catch(console.error);
```

### test-discovery-service.js

```javascript
require('dotenv').config();
const { discoverCompetitors } = require('./services/discovery.service');

async function test() {
  const results = await discoverCompetitors('COSH', { engines: 'both', maxPages: 1 });
  console.log(`Total after merge: ${results.length}`);

  const dualSourced = results.filter(r => r.source === 'google_dork+facebook_pages');
  const googleOnly  = results.filter(r => r.source === 'google_dork');
  const fbOnly      = results.filter(r => r.source.startsWith('facebook'));

  console.log(`Dual-sourced: ${dualSourced.length}`);
  console.log(`Google only:  ${googleOnly.length}`);
  console.log(`Facebook only: ${fbOnly.length}`);

  // Dedup check — no duplicate URLs
  const urls = results.map(r => r.url);
  const unique = new Set(urls);
  console.assert(urls.length === unique.size, 'No duplicate URLs after merge');

  console.log('\nSample result:');
  console.log(results[0]);
}

test().catch(console.error);
```

---

## Environment Variables

Ensure these are set in `.env` before running:

```env
SERPAPI_KEY=your_serpapi_key_here
MONGODB_URI=your_mongodb_connection_string
```

---

## Rollback Plan

If the new engines produce unexpected results in production:

1. Revert `discovery.routes.js` to call `scrapeFacebookSearch()` directly
2. The old `facebook-search.scraper.js` is untouched — it still works
3. Delete `scrapers/engines/` and `services/discovery.service.js`
4. No database migration needed — record shape is backwards compatible

---

## Completion Checklist

- [ ] Create `scrapers/engines/` folder
- [ ] Implement `google.engine.js`
- [ ] Implement `facebook.engine.js`
- [ ] Implement `discovery.service.js`
- [ ] Update `discovery.routes.js`
- [ ] Run `test-google-engine.js` — assert results > 0
- [ ] Run `test-facebook-engine.js` — assert results > 0
- [ ] Run `test-discovery-service.js` — assert no duplicate URLs
- [ ] Verify `POST /api/discovery/discover` returns classified results
- [ ] Verify `POST /api/discovery/approve` saves to MongoDB
- [ ] Mark `facebook-search.scraper.js` as `@deprecated`

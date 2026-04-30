# Web Scraper — Complete Implementation Plan

> **Author**: Lead Full-Stack Developer
> **Date**: April 30, 2026
> **Status**: Planning — Do NOT implement until approved

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Current Architecture (As-Is)](#2-current-architecture-as-is)
3. [Target Architecture (To-Be)](#3-target-architecture-to-be)
4. [Data Sources & Constraints](#4-data-sources--constraints)
5. [Phase 1 — Scraper Foundation Setup](#5-phase-1--scraper-foundation-setup)
6. [Phase 2 — Data Extraction & Normalization](#6-phase-2--data-extraction--normalization)
7. [Phase 3 — Multi-Source Scraping Strategy](#7-phase-3--multi-source-scraping-strategy)
8. [Phase 4 — Data Validation & Deduplication](#8-phase-4--data-validation--deduplication)
9. [Phase 5 — Database Integration](#9-phase-5--database-integration)
10. [Phase 6 — Scheduler & Automation](#10-phase-6--scheduler--automation)
11. [Phase 7 — Error Handling & Anti-Blocking](#11-phase-7--error-handling--anti-blocking)
12. [Phase 8 — Performance & Scalability](#12-phase-8--performance--scalability)
13. [File-by-File Change Matrix](#13-file-by-file-change-matrix)
14. [Testing Plan](#14-testing-plan)
15. [Migration Notes](#15-migration-notes)

---

## 1. Problem Statement

### Issues Identified

| # | Issue                                                        | Severity     |
| - | ------------------------------------------------------------ | ------------ |
| 1 | Manual competitor data entry is slow and inconsistent        | **High**     |
| 2 | No centralized pipeline for collecting training/seminar data | **Critical** |
| 3 | Data from Facebook and event sites is unstructured           | **High**     |
| 4 | Duplicate entries occur frequently                           | **Medium**   |
| 5 | No automation (data becomes outdated quickly)                | **Critical** |

---

## 2. Current Architecture (As-Is)

* No scraping system exists
* Data is:

  * manually inputted OR
  * not collected at all

### Flow

```
User → Manual Input → Database
```

**Limitations**:

* Not scalable
* No real-time updates
* No trend tracking

---

## 3. Target Architecture (To-Be)

### Data Pipeline

```
External Sources
    ↓
Scraper Engine (Puppeteer/Playwright)
    ↓
Parser & Normalizer
    ↓
Validation Layer
    ↓
Database
    ↓
Analytics Engine
```

### Key Principles

* Modular scrapers per source
* Clean normalized dataset
* Automated daily updates
* Resilient against failures

---

## 4. Data Sources & Constraints

### Sources

| Source            | Type            | Complexity |
| ----------------- | --------------- | ---------- |
| Facebook Pages    | Dynamic         | High       |
| Event Platforms   | Semi-structured | Medium     |
| Training Websites | Static/Dynamic  | Medium     |

### Constraints

* Anti-bot protections
* Dynamic loading (JS-heavy pages)
* Inconsistent formats
* Rate limits

---

## 5. Phase 1 — Scraper Foundation Setup

### 5.1 Project Structure

```
/scraper
  /core
  /sources
  /parsers
  /utils
  scraper.js
```

### 5.2 Core Setup

* Initialize Node.js project
* Install:

  * puppeteer OR playwright
  * axios
  * cheerio (optional)
  * dotenv

### 5.3 Base Scraper Class

Responsibilities:

* Launch browser
* Navigate pages
* Handle timeouts
* Close sessions safely

---

## 6. Phase 2 — Data Extraction & Normalization

### 6.1 Extract Fields

Required:

* title
* provider
* price
* date
* duration
* platform/source
* url

### 6.2 Normalization Rules

| Field    | Rule                            |
| -------- | ------------------------------- |
| Price    | Convert to number (₱ → numeric) |
| Date     | ISO format                      |
| Title    | Trim + remove duplicates        |
| Provider | Standardized naming             |

### 6.3 Output Format

```json
{
  "title": "AI for Educators",
  "provider": "XYZ Training Center",
  "price": 1500,
  "date": "2026-05-10",
  "source": "facebook",
  "url": "https://..."
}
```

---

## 7. Phase 3 — Multi-Source Scraping Strategy

### 7.1 Per-Source Modules

```
/sources
  facebook.scraper.js
  event.scraper.js
  website.scraper.js
```

Each module:

* knows its DOM structure
* extracts data independently

### 7.2 Strategy

| Source   | Approach                          |
| -------- | --------------------------------- |
| Facebook | Puppeteer (scroll + dynamic load) |
| Websites | Puppeteer or Axios + Cheerio      |
| Events   | Hybrid                            |

---

## 8. Phase 4 — Data Validation & Deduplication

### 8.1 Validation

Reject if:

* missing title
* invalid date
* price not numeric

### 8.2 Deduplication

Strategy:

* Hash = title + date + provider
* If exists → skip

---

## 9. Phase 5 — Database Integration

### Flow

```
Scraper → Clean Data → API / DB Insert
```

### Options

* Direct DB write (faster)
* API call (cleaner architecture)

### Recommended

Use backend API:

```
POST /api/trainings/bulk
```

---

## 10. Phase 6 — Scheduler & Automation

### Tool

* node-cron

### Jobs

| Job         | Frequency |
| ----------- | --------- |
| Scraping    | Daily     |
| Cleanup     | Weekly    |
| Re-analysis | Daily     |

### Example

```js
cron.schedule("0 0 * * *", async () => {
  await runAllScrapers();
});
```

---

## 11. Phase 7 — Error Handling & Anti-Blocking

### Techniques

* Random delays
* User-agent rotation
* Retry mechanism

### Error Types

| Type        | Action      |
| ----------- | ----------- |
| Timeout     | Retry       |
| Blocked     | Skip source |
| Invalid DOM | Log + alert |

---

## 12. Phase 8 — Performance & Scalability

### Improvements

* Parallel scraping (Promise.all with limits)
* Queue system (BullMQ optional)
* Caching results

### Future Scaling

* Distributed workers
* Cloud functions

---

## 13. File-by-File Change Matrix

| File                                   | Action                  |
| -------------------------------------- | ----------------------- |
| `/scraper/core/browser.js`             | Create browser manager  |
| `/scraper/sources/facebook.scraper.js` | Implement FB scraper    |
| `/scraper/sources/event.scraper.js`    | Implement event scraper |
| `/scraper/parsers/normalize.js`        | Data cleaning           |
| `/scraper/utils/dedupe.js`             | Deduplication           |
| `/scraper/scraper.js`                  | Entry point             |
| `/server/routes/trainings.js`          | Bulk insert endpoint    |

---

## 14. Testing Plan

### Manual Tests

| Scenario          | Expected       |
| ----------------- | -------------- |
| Scrape valid site | Data extracted |
| Duplicate entry   | Not inserted   |
| Missing fields    | Rejected       |
| Blocked request   | Retry/skip     |

---

## 15. Migration Notes

### Breaking Changes

* None (new module)

### Risks

* Scraper breaking if DOM changes
* Rate limiting

### Rollback Plan

* Disable cron jobs
* Revert scraper module

---

## Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
```

---

## Final Note

Start with:

* ONE source (e.g., Facebook or 1 website)

Then expand.

A working scraper > a complex broken system.

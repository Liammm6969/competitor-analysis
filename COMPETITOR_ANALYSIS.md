# Competitor Analysis System — Complete Implementation Plan

> **Author**: Lead Full-Stack Developer
> **Date**: April 30, 2026
> **Status**: Planning — Do NOT implement until approved

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Current Architecture (As-Is)](#2-current-architecture-as-is)
3. [Target Architecture (To-Be)](#3-target-architecture-to-be)
4. [Change Inventory](#4-change-inventory)
5. [Phase 1 — Core Data Model & CRUD System](#5-phase-1--core-data-model--crud-system)
6. [Phase 2 — Training & Competitor Linking](#6-phase-2--training--competitor-linking)
7. [Phase 3 — Analytics Engine](#7-phase-3--analytics-engine)
8. [Phase 4 — Trend Detection System](#8-phase-4--trend-detection-system)
9. [Phase 5 — Gap & Opportunity Analysis](#9-phase-5--gap--opportunity-analysis)
10. [Phase 6 — Dashboard & Visualization](#10-phase-6--dashboard--visualization)
11. [Phase 7 — AI Insight Engine (Optional)](#11-phase-7--ai-insight-engine-optional)
12. [File-by-File Change Matrix](#12-file-by-file-change-matrix)
13. [Testing Plan](#13-testing-plan)
14. [Migration Notes](#14-migration-notes)

---

## 1. Problem Statement

### Issues Identified

| # | Issue                                                        | Severity     |
| - | ------------------------------------------------------------ | ------------ |
| 1 | No centralized system to track competitor trainings/seminars | **Critical** |
| 2 | Training data is scattered and unstructured                  | **High**     |
| 3 | No way to compare pricing, topics, or frequency              | **High**     |
| 4 | No visibility into trends or emerging topics                 | **Critical** |
| 5 | No decision-support insights for planning new trainings      | **High**     |

---

## 2. Current Architecture (As-Is)

### Data Flow

```
Manual Input / External Sources → No Processing → No Insights
```

### Limitations

* No structured competitor database
* No analytics
* No automation
* No insights generation

---

## 3. Target Architecture (To-Be)

### System Overview

```
Scraped Data / Manual Input
        ↓
Backend API (Node.js)
        ↓
Database (Trainings + Competitors)
        ↓
Analytics Engine
        ↓
Insight Engine (AI)
        ↓
Frontend Dashboard
```

### Key Features

1. Centralized competitor database
2. Training/seminar tracking
3. Automated analytics
4. Trend detection
5. Strategic recommendations

---

## 4. Change Inventory

| File                                           | Action | Description       |
| ---------------------------------------------- | ------ | ----------------- |
| `/server/models/competitor.model.ts`           | CREATE | Competitor schema |
| `/server/models/training.model.ts`             | CREATE | Training schema   |
| `/server/controllers/competitor.controller.ts` | CREATE | CRUD logic        |
| `/server/controllers/training.controller.ts`   | CREATE | Training logic    |
| `/server/services/analytics.service.ts`        | CREATE | Analytics engine  |
| `/server/services/trend.service.ts`            | CREATE | Trend detection   |
| `/server/services/insight.service.ts`          | CREATE | AI insights       |
| `/client/pages/dashboard.tsx`                  | CREATE | Dashboard UI      |
| `/client/pages/competitors.tsx`                | CREATE | Competitor list   |
| `/client/pages/trainings.tsx`                  | CREATE | Training list     |

---

## 5. Phase 1 — Core Data Model & CRUD System

### 5.1 Competitor Model

Fields:

* id
* name
* category
* source_url

### 5.2 Training Model

Fields:

* id
* competitor_id
* title
* price
* duration
* audience
* date
* delivery_mode

### 5.3 API Endpoints

```
GET    /api/competitors
POST   /api/competitors
GET    /api/trainings
POST   /api/trainings
```

---

## 6. Phase 2 — Training & Competitor Linking

### Relationship

```
Competitor (1) → (Many) Trainings
```

### Implementation

* Foreign key: `competitor_id`
* Populate competitor data in training queries

### Example Output

```json
{
  "title": "AI Training",
  "competitor": "XYZ Institute",
  "price": 1500
}
```

---

## 7. Phase 3 — Analytics Engine

### Metrics

* Average price per topic
* Most frequent topics
* Trainings per month
* Competitor activity levels

### Endpoint

```
GET /api/analytics
```

### Example Output

```json
{
  "topTopics": ["AI", "Cybersecurity"],
  "avgPrice": 1200,
  "monthlyTrends": [...]
}
```

---

## 8. Phase 4 — Trend Detection System

### Logic

* Group trainings by topic
* Track frequency over time
* Detect increases/decreases

### Example

* "AI trainings increased by 40% this month"

### Output

```
GET /api/trends
```

---

## 9. Phase 5 — Gap & Opportunity Analysis

### Purpose

Identify:

* Missing topics
* Underserved audiences
* Pricing gaps

### Example Insights

* "No cybersecurity training this month"
* "Most trainings target teachers, not admins"

---

## 10. Phase 6 — Dashboard & Visualization

### Pages

* Dashboard
* Competitors
* Trainings
* Analytics

### Charts

* Bar chart (topics)
* Line chart (trends)
* Pie chart (distribution)

---

## 11. Phase 7 — AI Insight Engine (Optional)

### Input

* Analytics data
* Trends

### Output

* Strategic recommendations
* Suggested training topics
* Pricing advice

### Example

> "Competitors focus on compliance training. Introduce hands-on workshops to differentiate."

---

## 12. File-by-File Change Matrix

| #  | File                     | Phase | Action          |
| -- | ------------------------ | ----- | --------------- |
| 1  | competitor.model.ts      | P1    | Create          |
| 2  | training.model.ts        | P1    | Create          |
| 3  | competitor.controller.ts | P1    | CRUD            |
| 4  | training.controller.ts   | P2    | CRUD            |
| 5  | analytics.service.ts     | P3    | Compute metrics |
| 6  | trend.service.ts         | P4    | Trend logic     |
| 7  | insight.service.ts       | P5    | AI insights     |
| 8  | dashboard.tsx            | P6    | UI              |
| 9  | competitors.tsx          | P6    | UI              |
| 10 | trainings.tsx            | P6    | UI              |

---

## 13. Testing Plan

### Scenarios

| # | Scenario        | Expected Result          |
| - | --------------- | ------------------------ |
| 1 | Add competitor  | Saved in DB              |
| 2 | Add training    | Linked to competitor     |
| 3 | Fetch analytics | Correct metrics          |
| 4 | Detect trends   | Accurate trend output    |
| 5 | Dashboard load  | Charts display correctly |

---

## 14. Migration Notes

### Breaking Changes

* None (new system)

### Risks

* Incomplete data from scraper
* Incorrect trend calculations

### Rollback Plan

* Disable analytics engine
* Revert to basic CRUD

---

## Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 6 → Phase 4 → Phase 5 → Phase 7
```

### Reasoning

* Data first (P1–P2)
* Insights later (P3–P5)
* UI early for visibility (P6)

---

## Final Note

Do NOT start with AI or trends.

A clean data model + working CRUD is 80% of the system.

Everything else builds on that.

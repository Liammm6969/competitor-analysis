# Competitor IQ: Training Provider Analysis System

Competitor IQ is a specialized data intelligence platform designed to discover, track, and analyze training providers across social media and the web. By combining advanced search engine "dorking" with automated data extraction, the system transforms unstructured Facebook and web data into actionable market insights.

---

## 🚀 Core Capabilities

### 1. On-Demand Discovery (Facebook & Google)
- **SerpAPI Integration**: Uses Google Search dorks to bypass Facebook's aggressive bot detection and CAPTCHAs.
- **Dorking Strategy**: Targets specific institution-type terms (e.g., `"TESDA accredited"`, `"training center"`, `"DOLE accredited"`) to filter out noise and focus on actual business entities.
- **Targeted Filtering**: Automatically excludes non-provider content like group discussions, marketplace listings, and individual profile reels.

### 2. Intelligent Data Extraction
- **Automated Parsing**: Extracts critical business data directly from search snippets:
  - **Delivery Mode**: Auto-detects `Online` vs `In-Person` vs `Hybrid` training.
  - **Pricing**: Smart regex patterns extract local currency prices (₱, PHP).
  - **Inclusions**: Identifies provided materials (e.g., "with certificate", "free kit").
  - **Offerings**: Detects related training acronyms (BOSH, COSH, SO1-3, etc.).

### 3. Human-in-the-Loop Management
- **Editable Discovery Table**: Allows users to manually enrich or correct scraped data before committing it to the database.
- **Bulk Approval**: One-click persistence of discovered competitors into the permanent tracking database.
- **Weakness Analysis**: A dedicated field for manual entry of competitor vulnerabilities, enabling strategic positioning.

### 4. Advanced Analytics
- **Market Distribution**: Visualizes delivery modes and training categories.
- **Price Benchmarking**: Calculates average, minimum, and maximum market prices for specific keywords.
- **Competitor Activity**: Ranks providers by the volume and frequency of their training offerings.

---

## 🏗️ Technical Architecture

- **Frontend**: React (Vite) + TailwindCSS.
- **Backend**: Node.js + Express.
- **Database**: MongoDB (Mongoose) for flexible competitor and training schemas.
- **Scraping Engine**: Custom orchestrator utilizing **SerpAPI** for reliable, CAPTCHA-free web discovery.

---

## ⚠️ Known Weaknesses & Limitations

While the system is powerful, it has specific technical boundaries that users should understand:

### 1. Snippet Dependency
The "Discovery" phase relies entirely on Google/SerpAPI snippets. If a provider does not include their price or specific training dates in their Facebook page description or meta tags, the system will mark those fields as `—` (null), requiring manual user entry.

### 2. Dynamic Facebook Layouts
Facebook frequently changes its internal DOM. While the current system uses search engine dorks to avoid direct page scraping, any future expansion into deep-page scraping (e.g., fetching full course descriptions from Facebook "About" tabs) is highly susceptible to breakage when Facebook updates its UI.

### 3. Rate Limiting (Provider Level)
Excessive automated requests to search engines can lead to temporary IP flagging. This is mitigated by using **SerpAPI**, but high-volume users must monitor their API credits.

### 4. Ambiguity in "Online" Detection
The extraction logic is keyword-based. If a provider mentions "We are not doing Online training at this time," the current simple regex might still flag it as "Online." The human-in-the-loop review stage is critical for catching these context-heavy nuances.

---

## 🛠️ Development Setup

1. **Environment Variables**:
   - `MONGODB_URI`: Your database connection string.
   - `SERPAPI_KEY`: Required for the discovery feature.
2. **Installation**:
   ```bash
   npm install
   npm run dev # Starts both client and server
   ```
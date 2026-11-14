# MeetIntel AI — Pre-Meeting Intelligence Platform

> Walk into every meeting prepared. Transform the latest company developments into actionable meeting intelligence with your AI-powered research assistant.

MeetIntel AI is a premium SaaS application designed for founders, executives, and high-performance teams. Enter a company or person plus meeting details and purpose, and MeetIntel's 5-stage agent pipeline plans targeted search queries, pulls recent web ground truth via **Tavily**, analyzes and corroborates claims via **Google Gemini**, and synthesizes a concise, one-page, citation-backed dossier with strategic talking points and high-conviction open questions.

---

## 🎨 Design System

Inspired by modern premium SaaS design (Linear, Stripe, Atomize):
- **Typography:** Space Grotesk for bold headlines; Inter for clear body text.
- **Palette:**
  - Main Background: `#FFFFFF`
  - Secondary Surface: `#F8F8F8`
  - Primary Text: `#111111`
  - Secondary Text: `#777777`
  - Primary Accent: `#E83FCB` (Magenta used exclusively for important accents, badges, and interactions)
  - Dashboard Container: `#171717` (Dark dashboard preview container)
  - Border: `#EEEEEE`
- **Navigation:** Floating rounded translucent navbar (`bg-white/85 backdrop-blur-md`) with logo, links, and quick CTA.
- **Product Showcase:** Large dark preview container featuring a realistic **NVIDIA (Job Interview)** dossier with strategic talking points, suggested questions, importance tags, and 30-day grounded citations.
- **Features Section:** 6-item clean grid detailing Real-time Web Research, Meeting Context Intelligence, Development Ranking, Source-backed Findings, Smart Questions, and One-page Dossiers.
- **How It Works:** 3-step horizontal workflow (01 Research → 02 Understand → 03 Prepare).

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MeetIntel AI Frontend (Next.js 14)              │
│   • Floating rounded translucent navigation bar                        │
│   • Spacious Hero with Space Grotesk bold headline & CTAs              │
│   • Large Dark Dashboard Product Showcase (NVIDIA Job Interview demo)  │
│   • 6-item Features Grid & 3-step How It Works Section                 │
│   • Live Research Assistant form with Meeting Purpose & Context        │
│   • Live SSE vertical stepper for stage transitions                    │
│   • One-Page Editorial Briefing Card with PDF print & Markdown copy    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       POST /api/brief (SSE Stream)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Python Backend                          │
│   • Official Tavily Python SDK (`tavily-python`)                       │
│   • Official Google Gemini Python SDK (`google-genai`)                 │
│   • Secure backend/.env configuration (Never exposed to frontend)      │
│   • Standalone API diagnostic endpoints (/api/health, /api/test/...)   │
│   • SSE event streaming generator with robust error handling           │
├────────────────────────────────────────────────────────────────────────┤
│                     5-STEP AGENT RESEARCH WORKFLOW                     │
│                                                                        │
│   [STEP 1: PLAN]                                                       │
│   Google Gemini API generates 4-6 targeted, 30-day search queries      │
│                                                                        │
│   [STEP 2: SEARCH]                                                     │
│   Tavily Python SDK runs parallel queries (news & general indices)     │
│   • Strictly filters to last 30 days                                   │
│   • Deduplicates URLs and preserves publish dates                      │
│                                                                        │
│   [STEP 3: EXTRACT & VERIFY]                                           │
│   Corroborates cross-source claims:                                    │
│   • "Verified": 2+ independent sources agree                           │
│   • "Single-source": 1 primary source reporting                        │
│   • "Unconfirmed": Speculative or thin evidence flagged with caution   │
│                                                                        │
│   [STEP 4: SYNTHESIZE]                                                 │
│   Google Gemini API analyzes actual Tavily search results              │
│   • Strict system prompt: Grounded ONLY in retrieved evidence          │
│   • Every claim paired with source URL and citation bracket [1]        │
│                                                                        │
│   [STEP 5: VALIDATE]                                                   │
│   Programmatic Pydantic validator strips sourceless claims and         │
│   surfaces concise "No significant developments found" if news is thin │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart Guide

### 1. Backend Setup (FastAPI + Tavily + Gemini)

1. **Install Python dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Configure API Keys in `backend/.env`:**
   ```ini
   # Tavily Search API Key (https://tavily.com)
   TAVILY_API_KEY=tvly-your-tavily-api-key

   # Google Gemini API Key (https://aistudio.google.com)
   GEMINI_API_KEY=your-gemini-api-key

   # Gemini Model (e.g. gemini-1.5-flash or gemini-2.0-flash)
   GEMINI_MODEL=gemini-1.5-flash

   HOST=127.0.0.1
   PORT=8000
   ```

3. **Run Independent API Tests:**
   ```bash
   python -m pytest backend/tests -v
   ```

4. **Start the FastAPI Backend:**
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   - API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
   - Tavily Diagnostic: [http://127.0.0.1:8000/api/test/tavily](http://127.0.0.1:8000/api/test/tavily)
   - Gemini Diagnostic: [http://127.0.0.1:8000/api/test/gemini](http://127.0.0.1:8000/api/test/gemini)

---

### 2. Frontend Setup (Next.js 14)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Frontend development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 3 Example Subjects to Test

MeetIntel AI includes 1-click test chips for three distinct entities and meeting purposes:

1. **NVIDIA** *(Public Company • Purpose: Job Interview)*
   - **Research Focus:** Blackwell B200 hyperscaler shipment ramp, record data center revenue, liquid-cooling power density constraints, and sovereign AI clusters.

2. **Anthropic** *(AI Startup • Purpose: Enterprise Partnership)*
   - **Research Focus:** Claude 3.5 Sonnet "Computer Use" API public beta, Amazon's $4B expanded investment, Dario Amodei's manifesto, and prompt-injection safeguards.

3. **Satya Nadella** *(Executive • Purpose: Executive Briefing)*
   - **Research Focus:** Shift from copilots to autonomous enterprise agents in Copilot Studio, Three Mile Island nuclear restart power agreement, and EU antitrust cloud inquiries.

---

## 📄 License
MIT License. Built for high-conviction executive meeting intelligence.

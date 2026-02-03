# PolySci 📰

A web app that helps you understand political news through **balanced analysis**, **multiple perspectives**, and **quantitative government data** — no echo chambers, no single lens.

> **In a sentence:** Balanced analysis + primary sources + a contrarian that challenges your views (respectfully). Built to make you a more informed citizen, not to win arguments.

---

## Purpose 🎯

PolySci was built to combat misinformation and echo chambers in political discourse. Instead of one ideological lens, you get:

- **Balanced analysis** using real government data (BLS, Census, Congress.gov, etc.)
- **Multiple perspectives** on the same issue — see how different ideologies interpret the same facts
- **Primary sources** so you can verify every claim yourself
- **Your assumptions challenged** (respectfully) so you can strengthen or refine your views

The goal is **educational discourse** — helping you become a more informed citizen, not winning arguments.

---

## Getting Started 🚀

```bash
npm install
cp .env.example .env.local   # OPENAI_API_KEY required; add Newsdata.io, Firebase, gov API keys as needed

npm run dev                  # Run the app
npm test                     # Unit tests
npm run eval                 # AI evals (optional: npm run eval -- educational | contrarian)
```

**Docs** 📖

| Doc | What's inside |
|-----|----------------|
| Architecture & flows | `docs/architecture.md` |
| Case study (purpose, UX, tradeoffs, evals) | `docs/case-study-summary.md` |
| Project status & open work | `docs/project_state.md` |
| Context management (contributors) | `docs/context-management.md` |

---

## Features ✨

### Analysis 📰
Enter any political topic or news event and get a comprehensive breakdown:

- Quick summary · why it matters now · key parties involved
- Democratic and Republican perspectives
- Impact on everyday citizens
- Relevant statistics from government sources (with citations)
- Follow-up question suggestions

### Socratic Circle 🏛️
Pick a topic and see how **four ideological lenses** interpret the same issue:

| Lens | Focus |
|------|--------|
| **Liberalism** | Individual rights, social justice, regulated markets |
| **Conservatism** | Tradition, limited government, free markets |
| **Socialism** | Collective ownership, workers' rights, equality |
| **Libertarianism** | Individual liberty, minimal government |

*Same data, four lenses — ideology shapes interpretation.*

### The Contrarian 🤔
**Test and strengthen your views** with data-driven challenge (your views, not your ego):

1. **Select a topic** (15 topics) — opening question + neutral alignment scores (4 lenses).
2. **Educational path:** Say "I don't know," ask a question, or share thoughts → analysis + follow-up question. No stats until you commit a stance.
3. **Stance path:** Type your stance, then click **"I have a stance — challenge me"** (or confirm when asked). Two-stage pipeline: acknowledge your stance merits, then challenge with one stat for and one against (topic-specific, from government data only).
4. In contrarian mode, replies stay contrarian until **"I'm Done"** or you ask a question. Use **"Change my stance"** to submit a new stance and get a fresh challenge.
5. **Alignment scores** (1–10 per lens) update in real time; sources are clickable; CTAs ("Learn more," "Take action") when sources exist.

---

## Current Status 📍

**Completed** ✅

- Full-stack Next.js 14 · TypeScript · Tailwind CSS
- 6 government data APIs (BLS, USASpending, Census, Congress.gov, EIA, FRED) + topic-aware mapping
- News via Newsdata.io + Firebase caching (24h news, 6h gov data TTL)
- GPT-4o (analysis, Socratic, Contrarian) · gpt-4o-mini (classification: stance, question type, topic relevance)
- All three tabs: Analysis, Socratic Circle (4 perspectives in parallel), The Contrarian (educational/contrarian, two-stage pipeline)
- Alignment scoring (4 lenses, 60/40 weighting), hybrid topic validation, explicit stance flow + "Change my stance"
- Unit tests (Vitest, TDD) + AI evals (Braintrust + custom LLM scorers)

**Coming later** 🚀

- User authentication · URL parsing (paste article links) · personalized "why you should care"
- Deep-dive on output sections · related news from conversation · mobile-responsive improvements

---

## Architecture 🏗️

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌───────────┐  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  Analysis │  │ Socratic Circle │  │ The Contrarian │   │
│  └─────┬─────┘  └────────┬────────┘  └──────────┬──────────┘   │
└────────┼─────────────────┼──────────────────────┼───────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
│  /api/analyze  │  /api/socratic-circle  │  /api/contrarian/*    │
└────────┬─────────────────┬──────────────────────┬───────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────────┐    │
│  │ News Service│  │ Government APIs  │  │  Analysis Engine│    │
│  │ (Newsdata)  │  │ (BLS, Census,    │  │  (GPT-4o)       │    │
│  │             │  │  Congress, etc.) │  │                 │    │
│  └──────┬──────┘  └────────┬─────────┘  └─────────────────┘    │
│         │                  │                                     │
│         ▼                  ▼                                     │
│  ┌─────────────────────────────────────┐                        │
│  │     Firebase Firestore (Cache)      │                        │
│  │   News: 24hr TTL │ Gov Data: 6hr TTL│                        │
│  └─────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

**Tech stack**

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Next.js API Routes |
| Cache | Firebase Firestore (news 24h, gov data 6h TTL) |
| LLM | GPT-4o (analysis, Socratic, Contrarian, evals) · gpt-4o-mini (classification) |
| Testing | Vitest (unit) · Braintrust + custom LLM scorers (AI evals) |

**Data sources**

| Source | What you get |
|--------|----------------|
| Newsdata.io | News articles |
| Bureau of Labor Statistics | Unemployment, inflation, wages |
| USASpending.gov | Federal budget, spending |
| Census Bureau | Demographics, income |
| Congress.gov | Bills, legislation |
| EIA (optional) | Energy data |
| FRED (optional) | Economic indicators |



---

**License** — MIT

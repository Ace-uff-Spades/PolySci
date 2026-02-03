# PolySci 📰

A web app that helps you understand political news through **balanced analysis**, **multiple perspectives**, and **quantitative government data** — no echo chambers, no single lens.

## Purpose 🎯

PolySci was built to combat misinformation and echo chambers in political discourse. Instead of one ideological lens, you get:

- 📊 **Balanced analysis** using real government data (BLS, Census, Congress.gov, etc.)
- 👀 **Multiple perspectives** on the same issue — see how different ideologies interpret the same facts
- 🔗 **Primary sources** so you can verify every claim yourself
- 🤔 **Your assumptions challenged** (respectfully) so you can strengthen or refine your views

The goal is **educational discourse** — helping you become a more informed citizen, not winning arguments.

## Features ✨

### 📰 Analysis Tab
Enter any political topic or news event and get a comprehensive breakdown:
- 📝 Quick summary of the event
- ⏰ Why it matters now
- 👥 Key parties involved
- 🏛️ Democratic and Republican perspectives
- 🏠 Impact on everyday citizens
- 📈 Relevant statistics from government sources
- 💬 Follow-up question suggestions

### 🏛️ Socratic Circle Tab
Pick a topic and see how **four ideological lenses** interpret the same issue:
- **Liberalism** — Individual rights, social justice, regulated markets
- **Conservatism** — Tradition, limited government, free markets
- **Socialism** — Collective ownership, workers' rights, equality
- **Libertarianism** — Individual liberty, minimal government

Same data, four lenses. Ideology shapes interpretation — see it side by side.

### 🤔 The Contrarian Tab
**Test and strengthen your views** with data-driven challenge (your views, not your ego):
1. **Select a topic** (15 topics) — you get an opening question and neutral alignment scores (4 lenses: liberalism, conservatism, socialism, libertarianism).
2. **📚 Educational path:** Say "I don't know," ask a question, or share thoughts — you get analysis (common stances, values at stake) and a follow-up question. No stats until you commit a stance.
3. **⚔️ Stance path:** Type your stance, then click **"I have a stance — challenge me"** (or confirm when asked "Is X your stance?"). The Contrarian runs a two-stage pipeline: acknowledge your stance merits, then challenge with one stat for and one against (topic-specific, from government data only).
4. **In contrarian mode:** Replies stay contrarian until you click **"I'm Done"** or ask a question (then one educational answer). Use **"Change my stance"** to submit a new stance and get a fresh challenge.
5. **📊 Alignment scores** update in real time (1–10 per lens); sources are clickable. CTAs ("Learn more," "Take action") appear on challenge responses when sources exist.

## Current Status 📍

### ✅ Completed
- 🛠️ Full-stack Next.js 14 app with TypeScript and Tailwind CSS
- 📡 6 government data APIs (BLS, USASpending, Census, Congress.gov, EIA, FRED) + topic-aware mapping
- 📰 News via Newsdata.io + Firebase caching (24h news, 6h gov data TTL)
- 🤖 GPT-4o for analysis, Socratic, and Contrarian; gpt-4o-mini for classification (stance, question type, topic relevance)
- 🎛️ All three tabs: Analysis, Socratic Circle (4 perspectives in parallel), The Contrarian (educational/contrarian modes, two-stage pipeline)
- 📊 Alignment scoring (4 lenses, 60/40 weighting), hybrid topic validation, explicit stance flow + "Change my stance"
- 🧪 Unit tests (Vitest, TDD) + AI evals (Braintrust + custom LLM scorers: faithfulness, relevancy, alignment)

### 🚀 Future Enhancements
- 🔐 User authentication (save history, preferences)
- 🔗 URL parsing (paste article links instead of typing summaries)
- 📍 Personalized "why you should care" (location, situation)
- 🔍 Deep-dive on any output section
- 📰 Related news based on conversation
- 📱 Mobile-responsive improvements

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

### 🛠️ Tech Stack
| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 14, React, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Cache** | Firebase Firestore (news 24h, gov data 6h TTL) |
| **LLM** | GPT-4o (analysis, Socratic, Contrarian, evals) · gpt-4o-mini (classification) |
| **Testing** | Vitest (unit) · Braintrust + custom LLM scorers (AI evals) |

### 📊 Data Sources
| Source | What you get |
|--------|----------------|
| Newsdata.io | 📰 News articles |
| Bureau of Labor Statistics | 📈 Unemployment, inflation, wages |
| USASpending.gov | 💵 Federal budget, spending |
| Census Bureau | 👥 Demographics, income |
| Congress.gov | 📜 Bills, legislation |
| EIA (optional) | ⚡ Energy data |
| FRED (optional) | 📉 Economic indicators |

## Getting Started 🚀

```bash
# 1. Install dependencies
npm install

# 2. Set up env (OPENAI_API_KEY required; Newsdata.io, Firebase, gov API keys as needed)
cp .env.example .env.local

# 3. Run the app
npm run dev

# 4. Run unit tests
npm test

# 5. Run AI evals (optional: EVAL_LIMIT=N, dataset: educational | contrarian | all)
npm run eval
npm run eval -- educational
npm run eval -- contrarian
```

## Docs 📖

| Doc | What's inside |
|-----|----------------|
| **Architecture & flows** | `docs/architecture.md` |
| **Case study** (purpose, UX, tradeoffs, evals) | `docs/case-study-summary.md` |
| **Project status & open work** | `docs/project_state.md` |
| **Context management** (for contributors) | `docs/context-management.md` |

## License 📄

MIT

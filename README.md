# PolySci

A web application that helps users understand political news through balanced analysis, multiple perspectives, and quantitative government data.

## Purpose

PolySci was created to combat misinformation and echo chambers in political discourse. Instead of presenting news through a single ideological lens, it:

- Provides balanced analysis using real government data (BLS, Census, Congress.gov, etc.)
- Shows multiple political perspectives on the same issue
- Cites primary sources so users can verify claims themselves
- Challenges users to examine their own political assumptions

The goal is **educational discourse** - helping users become more informed citizens, not winning arguments.

## Features

### Analysis Tab
Enter any political topic or news event and receive a comprehensive analysis including:
- Quick summary of the event
- Why it matters now
- Key parties involved
- Democratic and Republican perspectives
- Impact on everyday citizens
- Relevant statistics from government sources
- Follow-up question suggestions

### Socratic Circle Tab
Select from predefined political topics and see how four different ideological lenses interpret the same issue:
- **Liberalism** - Individual rights, social justice, regulated markets
- **Conservatism** - Tradition, limited government, free markets
- **Socialism** - Collective ownership, workers' rights, equality
- **Libertarianism** - Individual liberty, minimal government

Each perspective is backed by the same government data, showing how ideology shapes interpretation.

### The Contrarian Tab
Test and strengthen your political views with data-driven challenge:
1. **Select a topic** (15 topics) — you get an initial question and neutral alignment scores (4 lenses: liberalism, conservatism, socialism, libertarianism).
2. **Educational path:** Say "I don't know," ask a question, or share thoughts — you get analysis (common stances, values at stake) and a follow-up question. No statistics until you commit a stance.
3. **Stance path:** Type your stance, then click **"I have a stance — challenge me"** (or confirm when asked "Is X your stance?"). The Contrarian runs a two-stage pipeline: acknowledge your stance merits, then challenge with one statistic for and one against (topic-specific, from government data only).
4. **In contrarian mode:** Replies stay contrarian until you click **"I'm Done"** or ask a question (then one educational answer). Use **"Change my stance"** to submit a new stance and get a fresh challenge.
5. **Alignment scores** update in real time (1–10 per lens); sources are cited with clickable links. CTAs ("Learn more," "Take action") appear on challenge responses when sources exist.

## Current Status

### Completed
- Full-stack Next.js 14 app with TypeScript and Tailwind CSS
- Integration with 6 government data APIs (BLS, USASpending, Census, Congress.gov, EIA, FRED) and topic-aware data mapping
- News integration via Newsdata.io with Firebase caching (24h news, 6h gov data TTL)
- GPT-4o for analysis, Socratic perspectives, and Contrarian; gpt-4o-mini for classification (stance, question type, topic relevance)
- All three feature tabs: Analysis (news + gov data → structured analysis), Socratic Circle (4 perspectives in parallel), The Contrarian (educational/contrarian modes, two-stage pipeline, JSON output)
- Alignment scoring (4 lenses, 60/40 weighting), hybrid topic validation, explicit stance flow and "Change my stance"
- Unit tests (Vitest, TDD) and AI evals (Braintrust + custom LLM scorers: faithfulness, relevancy, alignment)

### Future Enhancements
- User authentication (save conversation history, preferences)
- URL parsing (paste article links instead of typing summaries)
- Personalized "why you should care" based on user location/situation
- Deep-dive capability on any output section
- Related news suggestions based on conversation topics
- Mobile-responsive design improvements

## Architecture

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

### Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Cache**: Firebase Firestore (news 24h, gov data 6h TTL)
- **LLM**: OpenAI GPT-4o (analysis, Socratic, Contrarian, evals); gpt-4o-mini (classification)
- **Testing**: Vitest (unit), Braintrust + custom LLM scorers (AI evals)

### Data Sources
| Source | Data Provided |
|--------|---------------|
| Newsdata.io | News articles |
| Bureau of Labor Statistics | Unemployment, inflation, wages |
| USASpending.gov | Federal budget, spending |
| Census Bureau | Demographics, income |
| Congress.gov | Bills, legislation |
| EIA (optional) | Energy data |
| FRED (optional) | Economic indicators |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local: OPENAI_API_KEY required; Newsdata.io, Firebase, gov API keys as needed

# Run development server
npm run dev

# Run unit tests
npm test

# Run AI evals (requires OPENAI_API_KEY; optional EVAL_LIMIT=N, dataset: all | contrarian | educational)
npm run eval
npm run eval -- educational
npm run eval -- contrarian
```

## Docs

- **Architecture & flows:** `docs/architecture.md`
- **Case study (purpose, UX, tradeoffs, evals):** `docs/case-study-summary.md`
- **Project status & open work:** `docs/project_state.md`
- **Context management (for contributors):** `docs/context-management.md`

## License

MIT

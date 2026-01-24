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

### Contrarian Challenge Tab
Test and strengthen your political views:
1. Select a topic and share your stance
2. An AI contrarian challenges you with statistics from an opposing perspective
3. Track your alignment scores across all four political lenses in real-time
4. Refine your arguments or update your views based on the data

## Current Status

### Completed
- Full-stack Next.js application with TypeScript
- Integration with 6 government data APIs (BLS, USASpending, Census, Congress.gov, EIA, FRED)
- News integration via Newsdata.io with Firebase caching
- GPT-4o powered analysis with source citations
- All three feature tabs fully functional
- Alignment scoring system with weighted updates
- Comprehensive test coverage (TDD methodology)

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
│  │  Analysis │  │ Socratic Circle │  │ Contrarian Challenge│   │
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
- **Database**: Firebase Firestore (caching)
- **LLM**: OpenAI GPT-4o
- **Testing**: Vitest

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

# Set up environment variables (copy .env.example to .env.local)
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Run tests
npm test
```

## License

MIT

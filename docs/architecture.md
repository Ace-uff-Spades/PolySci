# PolySci MVP Architecture

## Overview

PolySci is a Next.js full-stack application that provides balanced political news analysis by combining multiple data sources and GPT-4o analysis.

## Data Flow

### Analysis Feature
```
User Input (Topic)
    ↓
gatherContext() - Parallel fetch:
    ├─→ getNewsForQuery() → Newsdata.io API → Firebase Cache
    └─→ gatherGovernmentData() → Multiple Gov APIs (BLS, USASpending, Census, Congress)
    ↓
AnalysisContext (topic, articles, govData, history)
    ↓
generateAnalysis() → GPT-4o → Full response → Store in history
    ↓
JSON response → Frontend (2-panel layout)
    ├─→ Left panel: User inputs + suggestions
    └─→ Right panel: Formatted analysis output
```

### Socratic Circle Feature
```
User selects topic from predefined list
    ↓
gatherGovernmentData() → Multiple Gov APIs
    ↓
Generate 4 perspectives in parallel:
    ├─→ Liberalism prompt → GPT-4o
    ├─→ Conservatism prompt → GPT-4o
    ├─→ Socialism prompt → GPT-4o
    └─→ Libertarianism prompt → GPT-4o
    ↓
JSON response → Frontend (tabbed interface)
    ├─→ Topic selector (top)
    ├─→ Perspective tabs (middle)
    └─→ Selected perspective content (bottom)
```

### Contrarian Challenge Feature
```
User selects topic from predefined list
    ↓
/api/contrarian/start → Initial question + neutral scores (all 5)
    ↓
User provides stance
    ↓
/api/contrarian/challenge:
    ├─→ gatherGovernmentData() → Multiple Gov APIs
    ├─→ determineOpposingLens() → Based on alignment scores
    ├─→ generateContrarianChallenge() → GPT-4o with opposing lens
    ├─→ updateScores() → GPT-4o calculates 4 alignment scores (1-10)
    └─→ extractSources() → Parse citations
    ↓
JSON response → Frontend (conversation interface)
    ├─→ Alignment score box (top-right, 4 meters)
    ├─→ Conversation area (messages with citations)
    └─→ Input area (user stance + "I'm Done" button)
```

## Key Components

### Phase 1-3: Data Layer ✅
- **News Service** (`src/lib/news-service.ts`)
  - Caches Newsdata.io responses in Firebase (24hr TTL)
  - Provides `getNewsForQuery()` and `getFeaturedStories()`

- **Government APIs** (`src/lib/government/`)
  - BLS: Unemployment, inflation data
  - USASpending: Federal budget, spending, topic-specific spending search
  - Census: Demographics, income
  - Congress.gov: Bills, legislation
  - EIA: Energy data (for climate/energy topics, optional API key)
  - FRED: Economic indicators (GDP, trade, debt, income, housing, optional API key)
  - Topic mapping: Intelligent data source selection based on topic keywords
  - Caching: 6-hour TTL in Firebase Firestore
  - Unified `gatherGovernmentData()` - topic-aware, fetches relevant data in parallel with graceful failures

### Phase 4: Analysis Engine ✅
- **OpenAI Client** (`src/lib/openai.ts`)
  - Singleton client with streaming support
  - `streamCompletion()` for real-time responses

- **Prompt Builder** (`src/lib/analysis/prompts.ts`)
  - `buildAnalysisSystemPrompt()` - Defines analyst role and output format
  - `buildAnalysisUserPrompt()` - Formats context (topic + articles + gov data)
  - `buildFollowUpPrompt()` - Creates follow-up question prompts
  - `formatGovernmentData()` - Helper to format gov data for prompts

- **Analysis Service** (`src/lib/analysis/index.ts`)
  - `gatherContext()` - Fetches all data sources in parallel
  - `generateAnalysis()` - Returns full GPT-4o analysis (non-streaming)
  - `streamAnalysis()` - Legacy streaming function (kept for follow-up endpoint)
  - `streamFollowUp()` - Async generator for follow-up questions
  - `generateFollowUpSuggestions()` - Contextual follow-up suggestions
  - `AnalysisContext` - Tracks conversation state (topic, articles, gov data, history)

- **Socratic Circle Service** (`src/lib/socratic/index.ts`)
  - `generateAllPerspectives()` - Generates 4 perspectives in parallel
  - `generatePerspective()` - Generates single perspective with specific lens
  - Reuses `gatherGovernmentData()` for quantitative data

- **Socratic Prompts** (`src/lib/socratic/prompts.ts`)
  - `buildLiberalismSystemPrompt()` - Liberal perspective prompt
  - `buildConservatismSystemPrompt()` - Conservative perspective prompt
  - `buildSocialismSystemPrompt()` - Socialist perspective prompt
  - `buildLibertarianismSystemPrompt()` - Libertarian perspective prompt
  - `buildSocraticUserPrompt()` - Formats topic and government data

- **Contrarian Challenge Service** (`src/lib/contrarian/index.ts`)
  - `generateContrarianChallenge()` - Generates challenge from opposing lens
  - `determineOpposingLens()` - Identifies contrarian perspective based on alignment
  - Reuses `gatherGovernmentData()` for quantitative data

- **Contrarian Prompts** (`src/lib/contrarian/prompts.ts`)
  - `buildContrarianSystemPrompt()` - Contrarian AI persona prompt
  - `buildContrarianUserPrompt()` - Formats topic, user stance, government data, history

- **Contrarian Scoring** (`src/lib/contrarian/scoring.ts`)
  - `calculateAlignmentScore()` - GPT-4o semantic analysis (1-10 per lens)
  - `updateScores()` - Weighted score updates (60% recent, 40% current)

## Output Format

GPT-4o analysis includes these sections:
1. Quick Summary (2-3 sentences)
2. Why This Matters Now (2 sentences)
3. Key Parties Involved (up to 5 entities)
4. Democratic Perspective (with sources)
5. Republican Perspective (with sources)
6. Impact on the Common Joe (practical implications)
7. By the Numbers (statistics with sources)
8. Sources (numbered list)

## Caching Strategy

- **News Cache**: Firebase Firestore, 24-hour TTL
  - Key: MD5 hash of normalized query
  - Reduces API calls to Newsdata.io (200 credits/day limit)

- **Government Data Cache**: Firebase Firestore, 6-hour TTL
  - Key: MD5 hash of normalized topic
  - Reduces API calls and enables data reuse across perspectives
  - Government data updates less frequently than news
  - Efficient: same topic uses cached data for all 4 Socratic perspectives

## Testing

- All modules have comprehensive test coverage
- Using Vitest for unit tests
- TDD methodology: RED-GREEN-REFACTOR
- Tests mock external dependencies (APIs, Firebase)

## Phase 5-7: Complete ✅

- **Phase 5**: API Routes ✅
  - `/api/featured` - Featured stories endpoint
  - `/api/analyze` - Analysis endpoint (JSON response, non-streaming)
  - `/api/followup` - Follow-up questions with context management (still uses SSE)
  - `/api/socratic-circle` - Socratic Circle endpoint (generates 4 perspectives)
  - `/api/contrarian/start` - Contrarian Challenge initialization
  - `/api/contrarian/challenge` - Generates contrarian response with updated scores

- **Phase 6**: Frontend UI ✅
  - 2-panel layout (left: inputs/suggestions, right: analysis)
  - AnalysisOutput component with enhanced markdown formatting
  - FeaturedStories component with loading states
  - ChatInput component
  - Main page with non-streaming integration

- **Phase 7**: Integration Testing ✅
  - TypeScript compilation verified
  - All components integrated
  - Ready for manual testing

- **Phase 8**: Socratic Circle Feature ✅
  - Tab navigation (Analysis | Socratic Circle)
  - 4 political lens prompts (Liberalism, Conservatism, Socialism, Libertarianism)
  - Parallel perspective generation
  - 10 predefined topics
  - SocraticCircle component with topic selector
  - PerspectiveView component with color-coded styling
  - Source extraction and clickable citations

- **Phase 9**: Contrarian Challenge Feature ✅
  - Tab navigation (Analysis | Socratic Circle | Contrarian Challenge)
  - 15 political topics from `political_topics.md`
  - Contrarian AI that challenges user stances with statistics
  - Real-time alignment scoring (4 lenses, 1-10 scale)
  - AlignmentScoreBox component with visual meters
  - Conversation interface with source citations
  - `/api/contrarian/start` and `/api/contrarian/challenge` endpoints
  - TDD: 19 tests passing (prompts, scoring, service)

## Context Management

See `docs/context-management.md` for best practices on managing AI context window usage.

## Data Sources Documentation

See `docs/government-data-sources.md` for detailed information about:
- All 6 government data sources (BLS, USASpending, Census, Congress.gov, EIA, FRED)
- API key requirements and registration
- Rate limits and limitations
- Caching strategy
- Topic-aware data selection

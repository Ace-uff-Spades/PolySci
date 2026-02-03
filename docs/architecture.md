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

### The Contrarian Feature
```
User selects topic → /api/contrarian/start → Initial question + neutral scores
    ↓
Client sends: topic, userStance, conversationHistory, currentScores, mode, explicitStanceAction?, confirmedStance?, stanceHistory?
    ↓
/api/contrarian/challenge:
    ├─→ If explicitStanceAction: use confirmedStance ?? userStance as stance → contrarian path
    ├─→ Else if mode === 'contrarian': contrarian path (follow-up)
    └─→ Else (educational): validateTopicRelevance() → gatherGovernmentData()
        ├─→ detectStanceWithParaphrase() (cheap LLM): stance detected?
        │   ├─→ Yes: return confirmation prompt (educational-type, confirmationPrompt + paraphrasedStance); do NOT run contrarian yet
        │   └─→ No: generateQuestionResponse() → analysis + followUpQuestion only (no stats/legislation)
        └─→ Contrarian path: two-stage (analyzeStance → generateContrarian), stats/legislation only when direct match; updateScores()
    ↓
Frontend: mode from last response type; "I have a stance — challenge me" button in educational when user has sent a message; confirmation → yes = explicit action (send confirmedStance); CTAs (Learn more, Take action) on challenge responses with sources. When chat starts: hide other topics, highlight selected topic; stance history in bottom-left; stanceHistory sent to API for LLM context. Data-lack handling: one brief notice max; analysis focuses exclusively on stats we have; follow-up question must not be about lack of data.
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
  - Congress.gov: Bills, legislation (enhanced with `searchBillsForQuestion()` for legislation queries)
  - EIA: Energy data (for climate/energy topics, optional API key)
  - FRED: Economic indicators (GDP, trade, debt, income, housing, optional API key)
  - Topic mapping (`topic-mapping.ts`): Data source selection by topic; includes Abortion/Reproductive, LGBTQ+, Racial Justice, Criminal Justice & Policing, Free Speech, Religion in Public Life; Foreign Policy + military; plus Healthcare, Gun, Education, Trade, etc.
  - `format.ts`: Shared `formatGovernmentData()` used by analysis, socratic, contrarian prompts and evals
  - Caching: 6-hour TTL in Firebase Firestore
  - Unified `gatherGovernmentData()` - topic-aware, fetches relevant data in parallel with graceful failures

### Phase 4: Analysis Engine ✅
- **OpenAI Client** (`src/lib/openai.ts`)
  - Singleton client with streaming support
  - `streamCompletion()` for real-time responses
  - `getJSONCompletion()` for structured JSON output with schema enforcement

- **Prompt Builder** (`src/lib/analysis/prompts.ts`)
  - `buildAnalysisSystemPrompt()` - Defines analyst role and output format
  - `buildAnalysisUserPrompt()` - Formats context (topic + articles + gov data via `formatGovernmentData` from `lib/government/format`)
  - `buildFollowUpPrompt()` - Creates follow-up question prompts

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

- **The Contrarian Service** (`src/lib/contrarian/index.ts`)
  - `generateContrarian()` - Two-stage pipeline: stance analysis → challenge (JSON Mode)
  - `determineOpposingLens()` - Identifies contrarian perspective based on alignment
  - Reuses `gatherGovernmentData()` for quantitative data

- **Stance Analysis Service** (`src/lib/contrarian/stance-analysis.ts`)
  - `analyzeStance()` - Analyzes user stance merits, finds supporting statistics (JSON Mode)
  - Stage 1 of two-stage pipeline

- **Contrarian Prompts** (`src/lib/contrarian/prompts.ts`)
  - `buildContrarianSystemPrompt()` - Contrarian AI persona prompt (help strengthen views, not devil's advocate); when conversation history present: do not repeat same statistics, prefer different data category
  - `buildContrarianUserPrompt()` - Formats topic, user stance, government data (via `lib/government/format`), history, stanceHistory
  - `buildQuestionResponsePrompt()` - For when user asks questions instead of stating stance

- **Contrarian Response Formatter** (`src/lib/contrarian/response-formatter.ts`)
  - `formatForDisplay()` - Links citations, formats sections for UI
  - No parsing needed - JSON mode handles structure

- **Contrarian Validation** (`src/lib/contrarian/validation.ts`)
  - `validateTopicRelevance()` - Hybrid validation (keyword + GPT-4o); core keyword match for ambiguous range; optional contextQuestion
  - `extractTopicKeywords()` - Extracts keywords from topic
  - `checkKeywordsMatch()` - Fast keyword-based relevance check

- **Contrarian Question Handler** (`src/lib/contrarian/question-handler.ts`)
  - `detectStanceWithParaphrase()` - Detects substantive stance + one-sentence paraphrase (for confirmation prompt); cheap model
  - `generateQuestionResponse()` - Educational: analysis (common stances, origination, values challenged) + followUpQuestion only; no stats/legislation
  - Exchange count drives question style (yes/no early, open-ended later)

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
  - `/api/contrarian/start` - The Contrarian initialization
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

- **Phase 9**: The Contrarian Feature ✅
  - Component: `Contrarian.tsx` (was ContrarianChallenge)
  - Tab navigation (Analysis | Socratic Circle | The Contrarian)
  - **Explicit stance flow:** Client sends `mode` (educational | contrarian); "I have a stance — challenge me" button; `explicitStanceAction` + `confirmedStance` for button click or "yes" to confirmation
  - **Stance detection:** In educational mode, typed stance without button → confirmation prompt ("Is X your stance?"); yes → contrarian with paraphrased stance, no → stay educational
  - Educational: analysis + followUpQuestion only (no stats/legislation); contrarian: stats/legislation only when direct match; CTAs (Learn more, Take action) on challenge responses
  - 15 topics; JSON Mode; two-stage pipeline for contrarian; alignment scoring (4 lenses); validation; `/api/contrarian/start`, `/api/contrarian/challenge`

## Eval System

**AI Eval Framework** (`src/lib/evals/`):
- Two datasets: `contrarian.ts` (CONTRARIAN_DATASET, 7 cases) and educational-responses.ts (7 cases)
- Custom LLM scorers: Faithfulness (skipped for educational), Relevancy+FollowUp (educational) or Relevancy+Alignment (challenge)
- Per-case `relevancyThreshold` for no-data educational cases; runner uses real API calls (no mocks)
- Run: `npm run eval [all|contrarian|educational]`; optional `EVAL_LIMIT=N` for first N cases
- See `docs/evals/evals-issues-analysis.md` for scoring design and resolution status

## Context Management

See `docs/context-management.md` for best practices on managing AI context window usage.

## Data Sources Documentation

See `docs/data-sources/government-data-sources.md` for detailed information about:
- All 6 government data sources (BLS, USASpending, Census, Congress.gov, EIA, FRED)
- API key requirements and registration
- Rate limits and limitations
- Caching strategy
- Topic-aware data selection

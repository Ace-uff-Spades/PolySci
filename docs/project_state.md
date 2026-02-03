# Project State: GenEvals (PolySci MVP)

## Current Focus
Building **PolySci** - a web app that helps users understand political news through balanced analysis, primary sources, and factual government data.

**Current Task:** Manual test of contrarian flow (stance button, confirmation, mode transitions, CTAs, anti-repetition in follow-ups). Optional: full eval suite, evals for stance/confirmation.

## Implementation Progress

### Phase 1: Project Foundation ✅
- ✅ Task 1.1: Next.js project initialized with TypeScript, Tailwind, ESLint
- ✅ Task 1.2: Environment variables configured (.env.local, .env.example)
- ✅ Task 1.3: Firebase Firestore setup complete

### Phase 2: News Data Integration ✅
- ✅ Task 2.1: Newsdata.io client (`src/lib/newsdata.ts`) with tests
- ✅ Task 2.2: News cache layer (`src/lib/news-cache.ts`) with Firebase integration
- ✅ Task 2.3: Unified news service (`src/lib/news-service.ts`)

### Phase 3: Government Data APIs ✅
- ✅ Task 3.1: BLS (Bureau of Labor Statistics) client (`src/lib/government/bls.ts`)
- ✅ Task 3.2: USASpending client (`src/lib/government/usaspending.ts`)
- ✅ Task 3.3: Census Bureau client (`src/lib/government/census.ts`)
- ✅ Task 3.4: Congress.gov client (`src/lib/government/congress.ts`)
- ✅ Task 3.5: Unified government data service (`src/lib/government/index.ts`)
- ✅ Task 3.6: EIA (Energy Information Administration) client (`src/lib/government/eia.ts`)
- ✅ Task 3.7: FRED (Federal Reserve Economic Data) client (`src/lib/government/fred.ts`)
- ✅ Task 3.8: Topic-to-data mapping system (`src/lib/government/topic-mapping.ts`)
- ✅ Task 3.9: Government data caching layer (`src/lib/government/cache.ts`)
- ✅ Task 3.10: Topic-aware data gathering (refactored `gatherGovernmentData()`)

### Phase 4: GPT-4o Analysis Engine ✅
- ✅ Task 4.1: OpenAI client (`src/lib/openai.ts`) with streaming support
- ✅ Task 4.2: Analysis prompt builder (`src/lib/analysis/prompts.ts`) with comprehensive tests
- ✅ Task 4.3: Analysis service (`src/lib/analysis/index.ts`) with full test coverage

### Phase 5: API Routes ✅
- ✅ Task 5.1: Featured stories endpoint (`src/app/api/featured/route.ts`)
- ✅ Task 5.2: Analysis endpoint (`src/app/api/analyze/route.ts`) - Changed from SSE to JSON response
- ✅ Task 5.3: Follow-up endpoint (`src/app/api/followup/route.ts`) with in-memory context store

### Phase 6: Frontend UI ✅
- ✅ Task 6.1: Message component (`src/components/Message.tsx`) with ReactMarkdown
- ✅ Task 6.2: FeaturedStories component (`src/components/FeaturedStories.tsx`) with loading states
- ✅ Task 6.3: ChatInput component (`src/components/ChatInput.tsx`) with suggestions support
- ✅ Task 6.4: Main chat page (`src/app/page.tsx`) - Refactored to 2-panel layout (non-streaming)
- ✅ Task 6.5: AnalysisOutput component (`src/components/AnalysisOutput.tsx`) - Enhanced formatting
- ✅ Task 6.6: Global styles verified (Tailwind CSS configured)

### Phase 7: Integration Testing ✅
- ✅ TypeScript compilation verified (no errors)
- ✅ All components created and integrated
- ✅ Ready for manual testing (see testing checklist below)

### Phase 8: Socratic Circle Feature ✅
- ✅ Task 8.1: Political lens prompt system (`src/lib/socratic/prompts.ts`) - 4 perspectives
- ✅ Task 8.2: Socratic service (`src/lib/socratic/index.ts`) with parallel generation
- ✅ Task 8.3: Topics constant (`src/lib/socratic/topics.ts`) - 10 predefined topics
- ✅ Task 8.4: API endpoint (`src/app/api/socratic-circle/route.ts`)
- ✅ Task 8.5: SocraticCircle component (`src/components/SocraticCircle.tsx`) with topic selector
- ✅ Task 8.6: PerspectiveView component (`src/components/PerspectiveView.tsx`) with color-coded styling
- ✅ Task 8.7: Tab navigation in header (Analysis | Socratic Circle)
- ✅ Task 8.8: Conditional rendering integration in main page

### Phase 9: The Contrarian Feature ✅
- ✅ Task 9.1: Added "The Contrarian" tab to navigation
- ✅ Task 9.2: Parsed 15 topics from `docs/data-sources/political_topics.md` (`src/lib/contrarian/topics.ts`)
- ✅ Task 9.3: Created Contrarian component (The Contrarian) with 2-panel layout
- ✅ Task 9.4: Topic selector UI with descriptions
- ✅ Task 9.5: Basic conversation UI (user/AI messages)
- ✅ Task 9.6: Contrarian service types (`src/lib/contrarian/index.ts`)
- ✅ Task 9.7: Contrarian prompts (`src/lib/contrarian/prompts.ts`) - TDD: 9 tests
- ✅ Task 9.8: Scoring service with GPT-4o (`src/lib/contrarian/scoring.ts`) - TDD: 6 tests
- ✅ Task 9.9: generateContrarian service - TDD: 4 tests
- ✅ Task 9.10: `/api/contrarian/start` endpoint
- ✅ Task 9.11: `/api/contrarian/challenge` endpoint
- ✅ Task 9.12: AlignmentScoreBox component with 4 meters
- ✅ Task 9.13: Integrated score box (top-right, real-time updates)
- ✅ Task 9.14: Connected scoring to API responses
- ✅ Task 9.15: Loading states and error handling
- ✅ Task 9.16: Source citation rendering (clickable [n] links)
- ✅ Task 9.17: "I'm Done" button
- ✅ Task 9.18: Input area with Send button
- ✅ Task 9.19: Response formatter for structured responses (`response-formatter.ts`)
- ✅ Task 9.20: Input validation with hybrid off-topic detection (`validation.ts`)
- ✅ Task 9.21: Question handler for user questions (`question-handler.ts`)
- ✅ Task 9.22: Updated prompts for concise, structured responses
- ✅ Task 9.23: Fixed citation linking to handle all formats
- ✅ Task 9.24: ContrarianResponse component for structured display
- ✅ Task 9.25: Post-processing to avoid walls of text
- ✅ Task 9.26: JSON Mode implementation - Zero parsing issues, structured output
- ✅ Task 9.27: Two-stage pipeline - Stance analysis → challenge
- ✅ Task 9.28: Dual statistics sections (Supporting/Challenging user stance)
- ✅ Task 9.29: Enhanced Congress.gov integration for legislation queries
- ✅ Task 9.30: Educational question handler with JSON mode

### Phase 10: AI Eval System ✅
- ✅ Task 10.1: Installed Braintrust and autoevals packages (industry standard for TypeScript/Next.js)
- ✅ Task 10.2: Created eval directory structure (`src/lib/evals/`)
- ✅ Task 10.3: Created The Contrarian dataset (7 test cases with probing questions)
- ✅ Task 10.4: Created educational responses dataset (7 test cases)
- ✅ Task 10.5: Implemented faithfulness scorer (validates statistics are in government data)
- ✅ Task 10.6: Implemented relevancy scorer (checks response addresses user stance)
- ✅ Task 10.7: Implemented alignment accuracy scorer (LLM-as-a-judge for alignment scores)
- ✅ Task 10.8: Built eval runner (loads datasets, calls real APIs, runs scorers, outputs results)
- ✅ Task 10.9: Added `npm run eval` script for running evals
- ✅ Task 10.10: Split datasets into separate files (contrarian.ts, educational-responses.ts)
- ✅ Task 10.11: Fixed OpenAI JSON schema issues (additionalProperties, required arrays, nullable syntax)
- ✅ Task 10.12: Fixed Firebase lazy loading (prevents initialization errors in evals)
- ✅ Task 10.13: Fixed scorer parameter issues (added input/context to Faithfulness and Relevancy)
- ✅ Task 10.14: Added dataset filtering (`npm run eval:educational`, `npm run eval:contrarian`)
- ✅ Task 10.15: Added individual error handling for scorers (prevents one failure from blocking others)
- ✅ Task 10.16: Created analysis document for scoring issues (`docs/evals/evals-issues-analysis.md`)

## Recent Sessions

### 2026-01-31 (Validation fix, data-lack, UI, stance history, internal refactor)
- **Validation:** "maintaining lower taxes" for Taxes & Wealth Redistribution was falsely flagged off-topic. Fixed: (1) core keyword match in ambiguous range (0.2–0.6)—if input contains any topic keyword, treat as on-topic; (2) improved GPT prompt for short stance answers; (3) pass last AI message as context to validator.
- **Data-lack:** Prompts updated so model doesn't dwell on missing data—one brief notice max, then analysis uses only stats we have; follow-up question must not focus on lack of data.
- **UI:** When chat starts, hide other topics and highlight selected; stance history in bottom-left; stance history passed to API and LLM context.
- **Internal refactor:** Renamed "Contrarian Challenge" → "The Contrarian" throughout. ContrarianChallenge → Contrarian (component); ContrarianChallengeResponse → ContrarianOutput; generateContrarianChallenge → generateContrarian; contrarianChallengeSchema → contrarianSchema; contrarian-challenge.ts → contrarian.ts; CONTRARIAN_CHALLENGE_DATASET → CONTRARIAN_DATASET.

### 2026-01-31 (Codebase refactor, contrarian anti-repetition, topic-mapping)
- **Refactor:** Shared `lib/government/format.ts` for `formatGovernmentData()` (analysis, socratic, contrarian, evals); shared `app/api/utils.ts` (jsonError, requireTopic, invalidTopicResponse); socratic lens prompts templated + `LENS_DESCRIPTIONS` exported for contrarian; `NO_STANCE_PHRASES` in validation only, imported by question-handler. Tests updated (analysis mocks getOpenAIClient; contrarian mocks getJSONCompletion + stance-analysis; newsdata error test mock has `text()`).
- **Contrarian anti-repetition:** When conversation history is present, system and user prompts instruct: do not repeat same statistics already cited; prefer different data category (e.g. if previously cited bill count, use unemployment/spending/income or specific bill next).
- **Topic-mapping:** Added/expanded entries so contrarian topics get on-topic Congress (and where relevant spending) data: Abortion/Reproductive, LGBTQ+ Rights, Racial Justice & Systemic Racism, Criminal Justice & Policing, Free Speech & Cancel Culture, Religion in Public Life; Foreign Policy extended with military/defense.

### 2026-01-31 (Contrarian / Educational architecture & UX)
- **Design:** `docs/plans/2026-01-31-contrarian-educational-architecture.md` — End goals (educational: user has stance and articulates it; explicit action to state stance. Contrarian: strengthen understanding, change stance, learn legislation, take action; explicit surfacing). Option A: "I have a stance — challenge me" button; confirmation when user types stance without clicking ("Is X your stance?" → yes = contrarian, no = stay educational). Articulation: user types in chat first, then clicks. Contrarian surfacing: end-of-flow summary + CTAs (Learn legislation, Take action).
- **Implementation:** API accepts `mode`, `explicitStanceAction`, `confirmedStance`; routes by explicit action → contrarian, mode=contrarian → contrarian, else `detectStanceWithParaphrase()` → confirmation or educational. Educational: analysis + followUp only (no stats). `detectStanceWithParaphrase()` in question-handler (cheap model). Contrarian UI: stance button, mode tracking, confirmation flow (affirmative reply = explicit action with confirmedStance), placeholders by mode. ContrarianResponse: educational analysis as ReactMarkdown; CTAs (Learn more, Take action) for challenge when sources present.

### 2026-01-28–31 (Eval pipeline & educational relevancy)
- **Eval pipeline:** Faithfulness skipped for educational responses. Government data: topic-mapping added for Taxes, Education, Gun, Size/Scope; client-side `filterBillsByTopic()` so bills shown are topic-relevant. Faithfulness scorer: "data does not contain X" statements treated as supported when context lacks X. Contrarian prompts: avoid unsupported claims, prefer "in the data we have we don't see X," no interpretive leaps.
- **Educational relevancy:** Question-type detection expanded (e.g. "give me a stance", "what do you think" → opinion-seeking). Educational prompts: opinion-seeking = no-stance + perspectives first; factual-no-data = "we don't have that" + related data + follow-up offering to show data; legislation = only cite bills matching question topic; legislation bills filtered by question-topic words (no unrelated bills in prompt). Required at least one stat + valid sources so criteria pass. Per-case `relevancyThreshold` (0.3/0.5) and relaxed follow-up threshold for climate-factual, education-legislation, gun-control-factual. Educational dataset passes 7/7.
- **Eval runner:** `EVAL_LIMIT` env var for quick runs (e.g. first N cases). Failed-criteria logging for educational. Dataset type: `npm run eval -- educational` or `contrarian` or `all`.

### 2026-01-24 (AI Eval System Setup & Fixes)
- Set up Braintrust eval framework for PolySci
  - Installed `braintrust` and `autoevals` packages (industry standard for TypeScript/Next.js)
  - Created eval system structure: datasets, scorers, runner
- Created comprehensive eval datasets
  - The Contrarian dataset: 7 test cases covering different topics and stances
  - Educational responses dataset: 7 test cases (unknown stance, "what do you think", factual questions)
  - Each case includes expected criteria and probing questions
  - Split into separate files for clarity
- Implemented three scorers
  - Faithfulness: Uses Braintrust's Faithfulness evaluator (requires input, output, context)
  - Relevancy: Uses AnswerRelevancy (requires input, output, context)
  - Alignment Accuracy: Custom LLM-as-a-judge scorer for alignment score validation
- Fixed schema issues for OpenAI JSON mode
  - Added `additionalProperties: false` to all object schemas
  - Added all properties to `required` arrays (including nullable fields)
  - Changed nullable syntax from `nullable: true` to `type: ["number", "null"]`
- Fixed Firebase initialization
  - Made Firebase lazy-load (only initializes when accessed)
  - Added graceful degradation for missing credentials
  - Cache functions handle missing Firebase gracefully
- Eval runner improvements
  - Added `.env.local` loading for tsx execution
  - Individual error handling for each scorer (prevents one failure from blocking others)
  - Always displays all three scores (including alignment accuracy for educational responses)
  - Added dataset filtering: `npm run eval:educational` or `npm run eval:contrarian`
- Created analysis document (`docs/evals/evals-issues-analysis.md`)
  - Documented root causes for scoring issues (alignment 100%, faithfulness 0%, relevancy low)
  - Provided solutions and recommendations

### 2026-01-24 (Latest - JSON Mode + Two-Stage Pipeline Refactor)
- Implemented JSON Mode architecture for The Contrarian
  - Created JSON schemas for stance analysis, The Contrarian, and educational responses
  - Added `getJSONCompletion()` to OpenAI client with schema enforcement
  - Eliminated parsing issues - JSON mode guarantees structured output
- Implemented two-stage pipeline for balanced responses
  - Stage 1: Stance analysis service (`stance-analysis.ts`) - Analyzes user stance merits first
  - Stage 2: challenge - Uses stance analysis results for balanced challenge
  - Always acknowledges stance merits before challenging
- Enhanced response structure
  - Dual statistics sections: "Statistics Supporting Your Stance" and "Statistics Challenging Your Stance" (1 stat each)
  - Simplified response formatter (removed regex parsing, JSON mode handles it)
  - Updated ContrarianResponse component to handle both challenge and educational responses
- Improved educational question handling
  - Converted question handler to JSON mode
  - Added legislation detection and automatic Congress.gov bill fetching
  - Educational responses now include direct answers, statistics, and legislation links
- UI improvements
  - Updated loading message to "the AI is thinking"
  - Separate text blocks for each section (no more wall of text)
- Plan cleanup
  - Archived completed plans to `docs/plans/archive/`
  - Moved PRD.md to docs/specs/
  - Updated context-management.md

### 2026-01-24 (Earlier - Contrarian Conversation Improvements)
- Refactored The Contrarian conversation system
  - Created structured response formatter (`response-formatter.ts`) - parses responses into sections
  - Fixed citation linking to handle `[n1]`, `[1]`, `[n]` formats
  - Updated prompts to generate concise, bullet-point responses (max 150 words)
  - Added input validation with hybrid approach (keyword + GPT-4o) for off-topic detection
  - Created question handler to detect and respond to user questions appropriately
  - Post-processing ensures no walls of text, emphasizes statistics
  - New `ContrarianResponse` component displays structured sections (acknowledgment, statistics, analysis, question)
  - Goal changed from "devil's advocate" to "help users strengthen their stances"
- Updated API route to integrate validation, question detection, and structured responses
- All citations now properly linked in statistics

### 2026-01-24 (UI Refactor)
- Complete UI redesign with Modern Forum/Debate Hall aesthetic
  - Color palette: Slate blue, sage green, warm gray, amber accents
  - Typography: DM Sans (display) + IBM Plex Sans (body)
  - Background: Subtle gradient mesh (slate blue → sage green)
  - Staggered page load animations (100ms increments)
  - Message slide-in animations (user from right, AI from left)
  - Updated all components with new color scheme and styling
  - Score meter transitions (400ms ease-out)
  - Hover effects and micro-interactions throughout
- Moved alignment scores from right panel header to left panel
- Changed topics grid from 1-column to 2-column for compactness
- Right panel is now chat-only

### 2026-01-23 (The Contrarian Bug Fixes)
- Initialized git repo (was missing .git directory)
- Fixed repetitive responses bug: stale React state was passing old conversation history to API
- Gave chat UI more space: changed from 50/50 to 1/3-2/3 split
- Investigated repeated sources: confirmed expected behavior (government data sources are fixed agencies)
- Audited alignment scoring: verified GPT-4o semantic analysis + 60/40 weighting works correctly

### 2026-01-23 (Earlier - The Contrarian UI Fixes)
- Fixed The Contrarian UI issues:
  - Input text was blending with background (added explicit text colors)
  - Score box was covering conversation (moved to inline header)
  - Response overflow (restructured to flexbox layout)
  - Improved markdown formatting for AI responses
- Created `/housekeep` Claude Code command (`.claude/commands/housekeep.md`)
- Cleaned up lint issues in Contrarian component

### 2026-01-22 (The Contrarian Feature)
- Implemented The Contrarian feature
  - Created contrarian AI service that challenges user stances with quantitative evidence
  - Built alignment scoring system (GPT-4o semantic analysis, 1-10 scale per lens)
  - Added 15 political topics from `political_topics.md`
  - Created AlignmentScoreBox component with 4 color-coded meters (real-time updates)
  - Built conversation interface with source citations
  - Added `/api/contrarian/start` and `/api/contrarian/challenge` endpoints
  - Followed TDD: 19 tests passing (prompts, scoring, service)
  - Tab navigation: Analysis | Socratic Circle | The Contrarian
- Socratic Circle improvements
  - Condensed summaries to 1-2 sentences
  - Fixed [n] citations to always be clickable links
  - Removed Quantitative Evidence bullet limit
  - Made Key Points section more succinct
- Manual integration testing completed
  - All features tested: Analysis, Socratic Circle, The Contrarian
  - All endpoints verified working
  - UI/UX verified across all features
  - Error handling and loading states verified

### 2026-01-21 (Government Data Improvements)
- Enhanced quantitative data gathering
  - Added EIA (Energy Information Administration) API client for energy/climate topics
  - Added FRED (Federal Reserve Economic Data) API client for economic indicators
  - Created topic-to-data-series mapping system for intelligent data selection
  - Refactored `gatherGovernmentData()` to be topic-aware (fetches relevant data per topic)
  - Implemented government data caching layer (6-hour TTL, Firebase Firestore)
  - Updated data formatting to include EIA, FRED, and topic-specific spending data
  - Documented limitations of all 6 data sources in `docs/data-sources/government-data-sources.md`
  - Fixed FRED API authentication (changed to Bearer token header for v2 API)
  - Improved EIA API endpoint structure
  - Created API key verification utility
- UI improvements
  - Improved text contrast in Socratic Circle UI
  - Refactored Socratic Circle to match Analysis 2-panel layout

### 2026-01-21 (Socratic Circle)
- Implemented Socratic Circle feature
  - Created 4 political lens prompts (Liberalism, Conservatism, Socialism, Libertarianism)
  - Built service to generate all 4 perspectives in parallel
  - Added 10 predefined topics for discussion
  - Created API endpoint `/api/socratic-circle` with topic validation
  - Built SocraticCircle component with topic selector and perspective tabs
  - Created PerspectiveView component with color-coded styling and source extraction
  - Added tab navigation in header to switch between Analysis and Socratic Circle
  - Integrated conditional rendering in main page

### 2026-01-21 (Earlier)
- Removed streaming from analyze endpoint
  - Created `generateAnalysis()` function for non-streaming responses
  - Changed `/api/analyze` from SSE to JSON response
  - Improved output formatting and readability
- Refactored UI to 2-panel layout
  - Left panel: User inputs and suggestions
  - Right panel: Analysis output with loading states
  - Created `AnalysisOutput` component with enhanced markdown styling
  - Moved suggestions to left panel for better UX
- Fixed Newsdata.io 422 error
  - Removed `timeframe` parameter (not available on free plan)
  - Improved error messages with API response text

### 2026-01-21 (Earlier)
- Fixed streaming word duplication issue
  - Updated SSE parsing to use proper message boundaries (`\n\n`)
  - Added index tracking to prevent reprocessing messages
  - Changed streaming to yield chunks directly instead of collecting first
- Fixed source link rendering
  - Added custom link component to ReactMarkdown
  - Updated GPT-4o prompt to format sources as markdown links
- Fixed Firebase private key parsing
  - Improved key parsing to handle various formats
  - Added better error messages
  - Changed to lazy initialization

- Completed Phase 6: Frontend UI
  - Created all UI components (Message, FeaturedStories, ChatInput)
  - Implemented main chat page with streaming support
  - Installed react-markdown for markdown rendering
  - Full integration with API endpoints

- Completed Phase 7: Integration Testing
  - TypeScript compilation verified (no errors)
  - All components properly typed
  - Ready for manual testing

- Completed Phase 5: API Routes
  - Created `/api/featured` endpoint - Returns featured stories from Newsdata.io
  - Created `/api/analyze` endpoint - Streams GPT-4o analysis via Server-Sent Events
  - Created `/api/followup` endpoint - Handles follow-up questions with context management
  - All endpoints include proper error handling and streaming support

- Completed Task 4.3: Analysis Service
  - Created `src/lib/analysis/index.ts` with:
    - `gatherContext()` - Fetches news and government data in parallel
    - `streamAnalysis()` - Async generator that streams GPT-4o analysis chunks
    - `streamFollowUp()` - Async generator for follow-up questions
    - `generateFollowUpSuggestions()` - Generates contextual follow-up suggestions
    - `AnalysisContext` interface - Tracks topic, articles, government data, and analysis history
  - Created comprehensive test suite (`src/lib/analysis/index.test.ts`) - 7 tests, all passing
  - Followed TDD methodology (RED-GREEN-REFACTOR)
  - Phase 4 (GPT-4o Analysis Engine) now complete

- Completed Task 4.2: Analysis Prompt Builder
  - Created `src/lib/analysis/prompts.ts` with:
    - `buildAnalysisSystemPrompt()` - System prompt with guidelines and output format
    - `buildAnalysisUserPrompt()` - Formats topic, news articles, and government data
    - `formatGovernmentData()` - Helper to format government data
    - `buildFollowUpPrompt()` - Creates follow-up question prompts
  - Created comprehensive test suite (`src/lib/analysis/prompts.test.ts`) - 6 tests, all passing
  - Followed TDD methodology (RED-GREEN-REFACTOR)

### 2026-01-19
- Set up documentation organization: journal (SQLite) + per-project project_state.md
- Set up tag taxonomy for journal entries
- Modified journal-auto-capture hook to also remind about project_state.md updates
- **Scrapped GenEvals app** - nuked all source files, kept only `.claude/` and `.mcp.json`
- Started PolySci MVP implementation

## Current Issues & Debugging

### Issue 1: Word Duplication in Streaming Output
**Problem**: Words are being duplicated in the streaming analysis output (e.g., "Quick Quick Summary Summary")

**Solution**: Removed streaming entirely - changed to regular JSON responses for better formatting control and readability

**Status**: Resolved - Streaming removed, UI refactored to 2-panel layout

**Files Modified**:
- `src/lib/analysis/index.ts` - Added `generateAnalysis()` function
- `src/app/api/analyze/route.ts` - Changed from SSE to JSON response
- `src/app/page.tsx` - Complete rewrite with 2-panel layout
- `src/components/AnalysisOutput.tsx` - New component with enhanced formatting

### Issue 2: Sources Not Rendering as Links
**Problem**: Sources in the analysis output are plain text instead of clickable markdown links

**Attempted Fixes**:
1. ✅ Added custom link component to ReactMarkdown with proper styling
2. ✅ Updated prompt to instruct GPT-4o to format sources as markdown links
3. ✅ Added example format in prompt: `[Source Name](URL)`

**Status**: Fixed - ReactMarkdown now renders links properly, prompt updated

**Files Modified**:
- `src/components/Message.tsx` - Added custom link component
- `src/lib/analysis/prompts.ts` - Updated prompt with link formatting instructions

### Issue 3: Firebase Private Key Parsing
**Problem**: Firebase initialization failing with "Invalid PEM formatted message" error

**Attempted Fixes**:
1. ✅ Improved private key parsing to handle escaped newlines (`\\n` and `\n`)
2. ✅ Added quote stripping for surrounding quotes
3. ✅ Added better error messages showing which variable is missing
4. ✅ Changed to lazy initialization (only init when needed)

**Status**: Fixed - Better error handling and key parsing

**Files Modified**:
- `src/lib/firebase.ts` - Improved key parsing and error messages

## Open Work
- [x] Manual Integration Testing ✅
  - [x] Test featured stories endpoint
  - [x] Test analysis endpoint (verify formatting and readability)
  - [x] Test follow-up questions
  - [x] Verify 2-panel layout works correctly
  - [x] Verify sources render as clickable links
  - [x] Test loading states
  - [x] Test Socratic Circle feature
    - [x] Test topic selection
    - [x] Test all 4 perspectives generate correctly
    - [x] Verify perspective tabs work
    - [x] Verify sources are extracted and clickable
  - [x] Test The Contrarian feature
    - [x] Test topic selection (15 topics)
    - [x] Test conversation flow (initial question → user stance → challenge)
    - [x] Verify alignment scores update in real-time
    - [x] Verify score box displays correctly (4 meters, 1-10 scale)
    - [x] Verify contrarian challenges use opposing lens
    - [x] Verify sources are extracted and clickable
    - [x] Test "I'm Done" button
    - [x] Test error handling and loading states
  - [x] Test topic-aware government data gathering
    - [x] Verify EIA data for climate/energy topics
    - [x] Verify FRED data for economic topics
    - [x] Verify topic-specific spending searches
    - [x] Test caching (same topic should use cache)
- [x] **The Contrarian Issues (Priority)** ✅
  - [x] Fix contrarian agent repetitive responses - was stale React state bug (now passes [...conversation, userMessage])
  - [x] Audit alignment score tracking - verified: GPT-4o semantic analysis + 60/40 weighting works correctly
  - [x] Give chat UI more space - changed to 1/3-2/3 split (was 50/50)
  - [x] Investigate repeated sources - expected behavior: government sources ARE from fixed agencies (BLS, Census, etc.)
- [x] Fix eval scoring issues (see `docs/evals/evals-issues-analysis.md`) ✅
  - [x] Alignment: skip for educational; custom LLM judge for challenge
  - [x] Faithfulness: skip for educational; custom judge; "data does not contain" supported when true
  - [x] Relevancy: custom scorers; educational prompts + per-case thresholds for no-data cases
- [x] Run AI evals and tune ✅
  - [x] Educational dataset passes 7/7 (`npm run eval -- educational`)
  - [x] EVAL_LIMIT for quick iteration; dataset filter (educational | contrarian | all)
- [x] **Contrarian UX with new architecture** ✅
  - [x] Explicit stance: "I have a stance — challenge me" button; client sends mode, explicitStanceAction, confirmedStance
  - [x] Stance detection + confirmation prompt when user types stance without clicking; yes/no handling
  - [x] Educational: analysis + followUp only; contrarian: stats only when direct match; CTAs on challenge
- [x] **Codebase refactor** ✅ (shared government format, API utils, socratic lens template, NO_STANCE_PHRASES; tests fixed)
- [x] **Contrarian anti-repetition** ✅ (prompts: when history present, do not repeat same statistics; prefer different data category)
- [x] **Topic-mapping for contrarian topics** ✅ (Abortion, LGBTQ+, Racial Justice, Criminal Justice, Free Speech, Religion; Foreign Policy + military)
- [x] **Validation fix** ✅ (core keyword match for ambiguous range; "maintaining lower taxes" on-topic)
- [x] **Data-lack handling** ✅ (brief notice, stats-only analysis, non-lack follow-up questions)
- [x] **The Contrarian UI** ✅ (hide topics when chat starts; stance history bottom-left; stance history in LLM context)
- [x] **Internal refactor** ✅ (Contrarian component, ContrarianOutput, generateContrarian, contrarian.ts dataset, contrarianSchema)
- [ ] Run full eval suite (`npm run eval` or `npm run eval -- all`) and tune contrarian pass rate if needed
- [ ] Test new contrarian flow (stance button, confirmation, mode transitions, CTAs)
- [ ] Test JSON Mode + Two-Stage Pipeline (stance analysis, dual stats, response parsing)
- [ ] Test UI refactor across all features (Analysis, Socratic Circle, The Contrarian)
- [ ] Add error boundaries for better error handling in UI
- [ ] Consider adding retry logic for failed API calls
- [ ] Update follow-up endpoint to use non-streaming (currently still uses SSE)
- [ ] Register and configure optional API keys (EIA_API_KEY, FRED_API_KEY) for enhanced data
- [ ] Update tests for JSON mode responses (remove parsing tests, add JSON schema tests)
- [ ] Consider evals for explicit stance/confirmation flows (contrarian)
- [ ] Add evals for Analysis feature
- [ ] Add evals for Socratic Circle feature

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Firebase Firestore (news caching, government data caching)
- **LLM**: OpenAI GPT-4o
- **APIs**: 
  - News: Newsdata.io
  - Government: BLS, USASpending, Census, Congress.gov, EIA (optional), FRED (optional)
- **Testing**: Vitest (TDD methodology) + Braintrust (AI evals)
- **Response Format**: JSON (streaming removed for better formatting)
- **Features**: Analysis, Socratic Circle, The Contrarian
- **The Contrarian Architecture**: Explicit stance (button or confirm "yes"); mode (educational | contrarian); stance detection → confirmation or educational; JSON Mode + two-stage; stats only when direct match; CTAs (Learn more, Take action); anti-repetition in follow-ups (when history present, vary statistics/data category); stance history in LLM context; data-lack: brief notice only, focus on stats we have. Topic-mapping: all 15 topics have specific Congress (and where relevant spending) keywords. Component: `Contrarian.tsx`; types: `ContrarianOutput`; service: `generateContrarian()`; dataset: `contrarian.ts`, `CONTRARIAN_DATASET`.
- **Eval System**: Custom scorers (faithfulness, relevancy+followUp/relevancy+alignment); 14 cases (7 challenge + 7 educational); faithfulness skipped for educational; per-case relevancy thresholds; `EVAL_LIMIT` env; `npm run eval [all|contrarian|educational]`

## Approaches & Lessons
- Claude Code hooks are reminder-based, not automation - they prompt the agent but can't perform context-aware file operations themselves
- Following TDD strictly: write failing test first, verify it fails, implement minimal code, verify it passes
- Using superpowers:executing-plans skill for systematic implementation

## Context Management Guidelines

**To reduce context window usage:**

1. **Avoid reading large files unnecessarily:**
   - Don't read `docs/plans/2026-01-21-newd-mvp.md` (1929 lines) - use `architecture.md` and `project_state.md` instead
   - Use `codebase_search` for specific questions instead of reading entire files
   - Only read files when actively modifying them

2. **Primary context sources:**
   - `project_state.md` - Current status and progress
   - `architecture.md` - System overview and data flow
   - `AGENTS.md` - Rules and protocols
   - Currently active files being worked on

3. **Avoid re-reading:**
   - Completed implementation files (unless modifying)
   - Test files (unless actively testing)
   - Large plan files (reference architecture docs instead)

4. **When to read files:**
   - Before modifying a file (read only the relevant section)
   - When debugging a specific issue (read only related files)
   - When implementing new features (read related files, not entire codebase)

## Future Enhancements

### Data Flow Documentation
Document the complete data flow through the application:
- User input → API endpoint → Data gathering (news + government APIs) → GPT-4o analysis → JSON response → Frontend display (2-panel layout)
- Include diagrams showing:
  - Request/response flow
  - Caching layers (Firebase)
  - Error handling paths
  - Context management for follow-up questions
  - 2-panel UI architecture
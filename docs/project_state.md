# Project State: GenEvals (PolySci MVP)

## Current Focus
Building **PolySci** - a web app that helps users understand political news through balanced analysis, primary sources, and factual government data.

**Current Task:** Fixing Contrarian Challenge UX issues discovered during testing.

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

### Phase 9: Contrarian Challenge Feature ✅
- ✅ Task 9.1: Added "Contrarian Challenge" tab to navigation
- ✅ Task 9.2: Parsed 15 topics from `political_topics.md` (`src/lib/contrarian/topics.ts`)
- ✅ Task 9.3: Created ContrarianChallenge component with 2-panel layout
- ✅ Task 9.4: Topic selector UI with descriptions
- ✅ Task 9.5: Basic conversation UI (user/AI messages)
- ✅ Task 9.6: Contrarian service types (`src/lib/contrarian/index.ts`)
- ✅ Task 9.7: Contrarian prompts (`src/lib/contrarian/prompts.ts`) - TDD: 9 tests
- ✅ Task 9.8: Scoring service with GPT-4o (`src/lib/contrarian/scoring.ts`) - TDD: 6 tests
- ✅ Task 9.9: generateContrarianChallenge service - TDD: 4 tests
- ✅ Task 9.10: `/api/contrarian/start` endpoint
- ✅ Task 9.11: `/api/contrarian/challenge` endpoint
- ✅ Task 9.12: AlignmentScoreBox component with 4 meters
- ✅ Task 9.13: Integrated score box (top-right, real-time updates)
- ✅ Task 9.14: Connected scoring to API responses
- ✅ Task 9.15: Loading states and error handling
- ✅ Task 9.16: Source citation rendering (clickable [n] links)
- ✅ Task 9.17: "I'm Done" button
- ✅ Task 9.18: Input area with Send button

## Recent Sessions

### 2026-01-23 (Latest - Contrarian Challenge UI Fixes)
- Fixed Contrarian Challenge UI issues:
  - Input text was blending with background (added explicit text colors)
  - Score box was covering conversation (moved to inline header)
  - Response overflow (restructured to flexbox layout)
  - Improved markdown formatting for AI responses
- Created `/housekeep` Claude Code command (`.claude/commands/housekeep.md`)
- Cleaned up lint issues in ContrarianChallenge component

### 2026-01-22 (Contrarian Challenge Feature)
- Implemented Contrarian Challenge feature
  - Created contrarian AI service that challenges user stances with quantitative evidence
  - Built alignment scoring system (GPT-4o semantic analysis, 1-10 scale per lens)
  - Added 15 political topics from `political_topics.md`
  - Created AlignmentScoreBox component with 4 color-coded meters (real-time updates)
  - Built conversation interface with source citations
  - Added `/api/contrarian/start` and `/api/contrarian/challenge` endpoints
  - Followed TDD: 19 tests passing (prompts, scoring, service)
  - Tab navigation: Analysis | Socratic Circle | Contrarian Challenge
- Socratic Circle improvements
  - Condensed summaries to 1-2 sentences
  - Fixed [n] citations to always be clickable links
  - Removed Quantitative Evidence bullet limit
  - Made Key Points section more succinct
- Manual integration testing completed
  - All features tested: Analysis, Socratic Circle, Contrarian Challenge
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
  - Documented limitations of all 6 data sources in `docs/government-data-sources.md`
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
  - [x] Test Contrarian Challenge feature
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
- [ ] **Contrarian Challenge Issues (Priority)**
  - [ ] Fix contrarian agent repetitive responses (keeps saying same thing)
  - [ ] Audit alignment score tracking (verify scores update meaningfully)
  - [ ] Give chat UI more space
  - [ ] Investigate repeated sources (may be using only cached data)
- [ ] Add error boundaries for better error handling in UI
- [ ] Consider adding retry logic for failed API calls
- [ ] Update follow-up endpoint to use non-streaming (currently still uses SSE)
- [ ] Register and configure optional API keys (EIA_API_KEY, FRED_API_KEY) for enhanced data

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Firebase Firestore (news caching, government data caching)
- **LLM**: OpenAI GPT-4o
- **APIs**: 
  - News: Newsdata.io
  - Government: BLS, USASpending, Census, Congress.gov, EIA (optional), FRED (optional)
- **Testing**: Vitest (TDD methodology)
- **Response Format**: JSON (streaming removed for better formatting)
- **Features**: Analysis, Socratic Circle, Contrarian Challenge

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
# The Contrarian Feature - Implementation Plan

## Overview
Implement The Contrarian feature following the brainstorm document. This feature allows users to engage with a quantitative contrarian AI that challenges their political stances using statistics.

## Implementation Strategy
Execute in phases: Foundation → Core Functionality → Scoring → Polish

---

## Phase 1: Foundation

### Task 1.1: Add "The Contrarian" Tab to Navigation
**File**: `src/app/page.tsx`
- Add `'contrarian'` to `ActiveTab` type
- Add third tab button in header navigation
- Add conditional rendering for contrarian tab
- Set default tab state handling

**Verification**: Tab appears in navigation, clicking switches views

---

### Task 1.2: Parse Topics from political_topics.md
**File**: `src/lib/contrarian/topics.ts` (new)
- Read `docs/data-sources/political_topics.md`
- Parse markdown headings (### Topic Name) to extract topics
- Create `CONTRARIAN_TOPICS` constant array
- Export topic list and validation function

**Topics to extract**:
- Abortion Rights
- LGBTQ+ Rights
- Gun Control
- Racial Justice & Systemic Racism
- Immigration & Border Policy
- Taxes & Wealth Redistribution
- Size & Scope of Government
- Healthcare System
- Climate Change & Environmental Regulation
- Criminal Justice & Policing
- Free Speech & Cancel Culture
- Foreign Policy & Military
- Education Policy
- Trade & Globalization
- Religion in Public Life

**Verification**: Topics array contains all 15 topics

---

### Task 1.3: Create ContrarianChallenge Component (Basic Layout)
**File**: `src/components/ContrarianChallenge.tsx` (new)
- Create component with left/right panel layout
- Left panel: Topic selector (placeholder for now)
- Right panel: Conversation area (placeholder)
- Add state for selectedTopic, conversation, isLoading
- Match styling with SocraticCircle component

**Verification**: Component renders with two panels, no errors

---

### Task 1.4: Topic Selector UI
**File**: `src/components/ContrarianChallenge.tsx`
- Import topics from `src/lib/contrarian/topics.ts`
- Display topics in grid/list layout (3-4 columns)
- Add click handler to select topic
- Highlight selected topic
- Show topic description on selection (from markdown)
- Add "Change Topic" button when topic selected

**Verification**: Topics display, selection works, highlighting works

---

### Task 1.5: Basic Conversation UI
**File**: `src/components/ContrarianChallenge.tsx`
- Create Message interface (id, role, content, timestamp)
- Display conversation messages in right panel
- User messages: right-aligned, blue background
- AI messages: left-aligned, gray background
- Add scrollable container
- Auto-scroll to latest message

**Verification**: Messages display correctly, scrolling works

---

## Phase 2: Core Functionality

### Task 2.1: Create Contrarian Service Types
**File**: `src/lib/contrarian/index.ts` (new)
- Define `AlignmentScores` interface (liberalism, conservatism, socialism, libertarianism: number 1-10)
- Define `ContrarianMessage` interface (id, role, content, timestamp, sources?)
- Define `ContrarianContext` interface (topic, conversationHistory, alignmentScores, governmentData)
- Export all types

**Verification**: Types compile, no errors

---

### Task 2.2: Create Contrarian Prompts
**File**: `src/lib/contrarian/prompts.ts` (new)
- Import `PoliticalLens` from `src/lib/socratic/prompts.ts`
- Create `buildContrarianSystemPrompt(opposingLens, topic)`: Returns system prompt for contrarian AI
  - Role: Quantitative political contrarian
  - Tone: Respectful but firm, data-driven
  - Goal: Challenge with statistics, not opinions
- Create `buildContrarianUserPrompt(topic, userStance, governmentData, conversationHistory)`: Returns user prompt
  - Include topic, user stance, government data, conversation context
  - Instruction to challenge with quantitative evidence
  - Format: Challenge + statistics + follow-up question

**Verification**: Prompts compile, format looks correct

---

### Task 2.3: Create Scoring Service (GPT-4o)
**File**: `src/lib/contrarian/scoring.ts` (new)
- Import `PoliticalLens`, `AlignmentScores`
- Create `calculateAlignmentScore(userStance, lens, topic)`: Returns Promise<number>
  - Use GPT-4o to analyze user stance
  - Compare against lens characteristics
  - Return 1-10 score
- Create `updateScores(currentScores, userResponse, topic)`: Returns Promise<AlignmentScores>
  - Calculate all 4 scores for latest response
  - Weight recent 60%, older 40%
  - Return updated scores

**Verification**: Functions compile, return correct types

---

### Task 2.4: Implement generateContrarianChallenge Service
**File**: `src/lib/contrarian/index.ts`
- Import dependencies (OpenAI, government data, prompts, scoring)
- Create `generateContrarianChallenge(context, userStance)`: Returns Promise with challenge, updatedScores, followUpQuestion
  - Analyze user stance to determine primary alignment lens
  - Identify opposing lens (contrarian perspective)
  - Gather government data (reuse `gatherGovernmentData`)
  - Build contrarian prompt with opposing lens
  - Call GPT-4o to generate challenge
  - Update alignment scores
  - Extract sources from response
  - Return challenge, scores, follow-up question

**Verification**: Function compiles, logic flow correct

---

### Task 2.5: Create /api/contrarian/start Endpoint
**File**: `src/app/api/contrarian/start/route.ts` (new)
- POST handler
- Accept `{ topic: string }` in body
- Return `{ initialQuestion: string, alignmentScores: AlignmentScores }`
- Initial question: "What's your stance on [topic]?"
- Initial scores: All 5 (neutral)

**Verification**: Endpoint returns correct structure, handles errors

---

### Task 2.6: Create /api/contrarian/challenge Endpoint
**File**: `src/app/api/contrarian/challenge/route.ts` (new)
- POST handler
- Accept `{ topic, userStance, conversationHistory, currentScores }`
- Call `generateContrarianChallenge()`
- Return `{ challenge, updatedScores, followUpQuestion, sources }`
- Handle errors gracefully

**Verification**: Endpoint generates challenges, updates scores correctly

---

## Phase 3: Scoring System

### Task 3.1: Create AlignmentScoreBox Component
**File**: `src/components/AlignmentScoreBox.tsx` (new)
- Accept `alignmentScores: AlignmentScores` prop
- Display 4 meters (one per lens)
- Each meter: Label + Visual progress bar (1-10) + Number
- Color-coded: Liberal (blue), Conservative (red), Socialist (yellow), Libertarian (purple)
- Compact card layout, fixed position (top-right)
- Add tooltip on hover: "Your responses align X/10 with [Lens]"

**Verification**: Component displays scores correctly, colors match

---

### Task 3.2: Integrate Score Box into ContrarianChallenge
**File**: `src/components/ContrarianChallenge.tsx`
- Import `AlignmentScoreBox`
- Add state for `alignmentScores` (initial: all 5)
- Render score box in top-right of right panel
- Update scores state when API returns updated scores
- Add smooth animation when scores update (CSS transition)

**Verification**: Score box appears, updates when conversation progresses

---

### Task 3.3: Connect Scoring to API Responses
**File**: `src/components/ContrarianChallenge.tsx`
- When `/api/contrarian/challenge` returns `updatedScores`, update state
- Trigger re-render of `AlignmentScoreBox`
- Ensure scores update after each user response

**Verification**: Scores update in real-time as user responds

---

## Phase 4: Polish

### Task 4.1: Add Loading States
**File**: `src/components/ContrarianChallenge.tsx`
- Show "AI is challenging your view..." when `isLoading` is true
- Disable input during loading
- Show loading spinner or skeleton

**Verification**: Loading states display correctly

---

### Task 4.2: Add Error Handling
**File**: `src/components/ContrarianChallenge.tsx`
- Catch API errors
- Display error message: "Failed to generate challenge. Try again."
- Add retry button
- Allow user to continue or restart

**Verification**: Errors handled gracefully, user can recover

---

### Task 4.3: Source Citation Rendering
**File**: `src/components/ContrarianChallenge.tsx`
- Import `extractSources` and `makeCitationsClickable` from `src/lib/analysis/sources.ts`
- Extract sources from AI messages
- Make [n] citations clickable links
- Display sources section at bottom of AI messages (similar to PerspectiveView)

**Verification**: Citations are clickable, sources display correctly

---

### Task 4.4: Add "I'm Done" Button
**File**: `src/components/ContrarianChallenge.tsx`
- Add "I'm Done" button at bottom of conversation area
- Prominent styling (red/orange)
- On click: Show final state, disable input
- Optional: Call `/api/contrarian/finish` endpoint (if created)

**Verification**: Button appears, click disables conversation

---

### Task 4.5: Integrate ContrarianChallenge into Main Page
**File**: `src/app/page.tsx`
- Import `ContrarianChallenge` component
- Add conditional rendering for `activeTab === 'contrarian'`
- Ensure tab switching works correctly

**Verification**: Tab switches to contrarian view, component loads

---

### Task 4.6: Add Input Area
**File**: `src/components/ContrarianChallenge.tsx`
- Add text input at bottom of right panel
- Add submit button
- On submit: Send user message to `/api/contrarian/challenge`
- Add user message to conversation
- Wait for AI response, add to conversation
- Disable input during loading

**Verification**: User can type and submit, messages appear correctly

---

## Verification Checklist

After all tasks complete:
- [ ] Tab navigation works (Analysis, Socratic Circle, The Contrarian)
- [ ] Topics display and can be selected
- [ ] Conversation starts when topic selected
- [ ] User can type and submit responses
- [ ] AI generates challenges with statistics
- [ ] Scores update in real-time
- [ ] Citations are clickable links
- [ ] "I'm Done" button works
- [ ] Loading states display
- [ ] Errors handled gracefully
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

---

## Notes

- Reuse existing infrastructure: `gatherGovernmentData()`, `getOpenAIClient()`, `extractSources()`, `makeCitationsClickable()`
- Follow existing code style and patterns (see SocraticCircle component)
- Keep files <500 LOC, split if needed
- Use TDD where appropriate (but not required for MVP)
- Test manually after each phase

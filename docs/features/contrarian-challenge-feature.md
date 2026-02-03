# The Contrarian Feature - Brainstorm & Design

**Note (2026-01-24)**: Recent improvements include structured response formatting, input validation, question handling, and citation linking fixes. See `project_state.md` for details.

**Note (2026-01-31)**: **New architecture implemented.** Explicit stance: user articulates in chat, then clicks "I have a stance — challenge me" (or confirms "yes" when we ask "Is X your stance?"). Client sends `mode` (educational | contrarian), `explicitStanceAction`, `confirmedStance`. Stance detection in educational → confirmation prompt; no assumption that typed text is stance until explicit action. Educational: analysis + followUp only (no stats/legislation). Contrarian: stats/legislation only when direct match; CTAs (Learn more, Take action). Implementation: API routing, `detectStanceWithParaphrase`, stance button, confirmation flow, CTAs in ContrarianResponse. See `docs/plans/2026-01-31-contrarian-educational-architecture.md`.

## Feature Overview

**Name**: "The Contrarian" or "Challenge Your Views"

**Purpose**: Help users strengthen their political views by engaging with a quantitative contrarian AI that challenges their stances using accurate statistics and data. The feature tracks user alignment with four political lenses (Liberalism, Conservatism, Socialism, Libertarianism) on a 1-10 scale. **Goal is to help users strengthen their views, not just play devil's advocate.**

**Value Proposition**: 
- Users test the strength of their beliefs through rigorous challenge
- Quantitative evidence-based counterarguments (not just opinion)
- Real-time alignment scoring across political lenses
- Educational: exposes users to data they may not have considered

---

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header: PolySci                                          │
│ Tabs: [Analysis] [Socratic Circle] [The Contrarian]│
└─────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────┐
│                  │ ┌──────────────────────────────────┐ │
│ Topic Selector   │ │  Alignment Score Box (Top Right) │ │
│ (Left Panel)     │ │  ┌──────────┬─────────────────┐  │ │
│                  │ │  │ Lens    │ Meter (1-10)   │  │ │
│ - Topic list     │ │  ├──────────┼─────────────────┤  │ │
│ - Selected topic │ │  │ Liberal  │ ████████░░ 8   │  │ │
│                  │ │  │ Conserv. │ ████░░░░░░ 4   │  │ │
│                  │ │  │ Socialist│ ██████░░░░ 6   │  │ │
│                  │ │  │ Libert.  │ ███░░░░░░░ 3   │  │ │
│                  │ │  └──────────┴─────────────────┘  │ │
│                  │ │                                   │ │
│                  │ │  Conversation Area (Main)        │ │
│                  │ │  ┌─────────────────────────────┐ │ │
│                  │ │  │ Topic: Immigration Policy    │ │ │
│                  │ │  │                             │ │ │
│                  │ │  │ AI: "What's your stance on   │ │ │
│                  │ │  │      immigration?"          │ │ │
│                  │ │  │                             │ │ │
│                  │ │  │ User: "I support open       │ │ │
│                  │ │  │        borders..."          │ │ │
│                  │ │  │                             │ │ │
│                  │ │  │ AI: [Challenge with stats]  │ │ │
│                  │ │  │                             │ │ │
│                  │ │  └─────────────────────────────┘ │ │
│                  │ │                                   │ │
│                  │ │  [I'm Done] button (bottom)      │ │
│                  │ └──────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

### Key UI Components

1. **Score Box** (Top Right, Fixed Position)
   - Compact card with 4 meters
   - Each meter: Label + Visual bar (1-10) + Number
   - Color-coded: Liberal (blue), Conservative (red), Socialist (yellow), Libertarian (purple)
   - Updates in real-time as conversation progresses
   - Tooltip on hover: "Your responses align X/10 with [Lens]"

2. **Topic Selector** (Left Panel)
   - Grid or list of topics from `docs/data-sources/political_topics.md`
   - Selected topic highlighted
   - Click to start/reset conversation
   - Shows topic description on selection

3. **Conversation Area** (Right Panel, Main)
   - Chat-like interface
   - Messages: User (right-aligned, blue) vs AI (left-aligned, gray)
   - AI messages include:
     - Challenge statement
     - Statistics with [n] citations (clickable links)
     - Follow-up question
   - Scrollable, auto-scroll to latest

4. **Input Area** (Bottom)
   - Text input for user responses
   - "I'm Done" button (prominent, maybe red/orange)
   - Disabled during AI response

5. **State Indicators**
   - Loading: "AI is challenging your view..."
   - Empty: "Select a topic to begin"
   - Error: "Failed to generate challenge. Try again."

---

## Data Flow & Architecture

### State Management

```typescript
interface ContrarianState {
  selectedTopic: string | null;
  conversation: Message[];
  alignmentScores: {
    liberalism: number;      // 1-10
    conservatism: number;     // 1-10
    socialism: number;        // 1-10
    libertarianism: number;   // 1-10
  };
  isLoading: boolean;
  isDone: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: Source[];  // For AI messages with citations
}
```

### API Endpoints

#### 1. `/api/contrarian/start`
**POST** - Initialize conversation
```json
Request: { topic: "Immigration & Border Policy" }
Response: {
  initialQuestion: "What's your stance on immigration policy?",
  alignmentScores: { liberalism: 5, conservatism: 5, socialism: 5, libertarianism: 5 }
}
```

#### 2. `/api/contrarian/challenge`
**POST** - Generate contrarian response
```json
Request: {
  topic: "Immigration & Border Policy",
  userStance: "I support open borders and pathways to citizenship for all immigrants.",
  conversationHistory: Message[],
  currentScores: AlignmentScores
}
Response: {
  challenge: "While open borders may seem compassionate, consider that...",
  updatedScores: { liberalism: 8, conservatism: 2, socialism: 7, libertarianism: 3 },
  followUpQuestion: "How do you reconcile this with economic concerns?",
  sources: Source[]
}
```

#### 3. `/api/contrarian/finish`
**POST** - Finalize conversation (optional, for analytics)
```json
Request: {
  topic: string,
  finalScores: AlignmentScores,
  messageCount: number
}
Response: { success: true }
```

### Service Layer

#### `src/lib/contrarian/index.ts`
```typescript
export interface ContrarianContext {
  topic: string;
  conversationHistory: Message[];
  alignmentScores: AlignmentScores;
  governmentData: GovernmentData;  // Reuse existing gatherGovernmentData
}

export async function generateContrarianChallenge(
  context: ContrarianContext,
  userStance: string
): Promise<{
  challenge: string;
  updatedScores: AlignmentScores;
  followUpQuestion: string;
}> {
  // 1. Analyze user stance to determine which lens it aligns with
  // 2. Identify opposing/contrarian lens
  // 3. Gather relevant government data for that lens
  // 4. Generate challenge using contrarian prompt
  // 5. Update alignment scores based on user's response
  // 6. Generate follow-up question
}
```

#### `src/lib/contrarian/prompts.ts`
```typescript
export function buildContrarianSystemPrompt(
  opposingLens: PoliticalLens,
  topic: string
): string {
  // Role: Quantitative political contrarian
  // Goal: Challenge user's stance with statistics
  // Tone: Respectful but firm, data-driven
  // Format: Challenge statement + statistics + follow-up question
}

export function buildContrarianUserPrompt(
  topic: string,
  userStance: string,
  governmentData: GovernmentData,
  conversationHistory: Message[]
): string {
  // Include:
  // - Topic
  // - User's current stance
  // - Relevant government data (quantitative)
  // - Previous conversation context
  // - Instruction to challenge with statistics
}
```

#### `src/lib/contrarian/scoring.ts`
```typescript
export function calculateAlignmentScore(
  userStance: string,
  lens: PoliticalLens,
  topic: string
): number {
  // Analyze user's stance text
  // Compare against lens characteristics
  // Return 1-10 score
  // Could use GPT-4o for semantic analysis, or keyword-based
}

export function updateScores(
  currentScores: AlignmentScores,
  userResponse: string,
  topic: string
): AlignmentScores {
  // Recalculate all 4 scores based on latest response
  // Weight recent responses more heavily
  // Return updated scores
}
```

---

## Scoring Algorithm

### Approach 1: GPT-4o Semantic Analysis (Recommended)
- Send user response + lens definition to GPT-4o
- Ask: "Rate alignment 1-10 between this stance and [Lens]"
- Pros: Accurate, understands nuance
- Cons: API calls, cost, latency

### Approach 2: Keyword-Based Scoring
- Define keywords/phrases for each lens
- Count matches, normalize to 1-10
- Pros: Fast, free
- Cons: Less accurate, misses nuance

### Approach 3: Hybrid
- Use keyword-based for initial estimate
- Use GPT-4o for final score (batch updates)
- Pros: Balance of speed and accuracy
- Cons: More complex

### Score Update Strategy
- **Initial**: All scores at 5 (neutral)
- **After each response**: Recalculate all 4 scores
- **Weighting**: Recent responses weighted 60%, older 40%
- **Display**: Smooth animation when scores update

---

## Prompt Engineering

### Contrarian AI Persona

```
You are a quantitative political contrarian. Your role is to challenge users' 
political stances using accurate statistics and government data. You are:
- Respectful but firm
- Data-driven, not opinion-based
- Focused on quantitative evidence
- Educational, not combative
- Goal: Help users strengthen their views through rigorous challenge

When challenging a stance:
1. Acknowledge the user's position respectfully
2. Present quantitative counter-evidence (statistics, data)
3. Cite sources with [n] notation
4. Ask a follow-up question that probes deeper
5. Never be dismissive or condescending
```

### Challenge Generation Strategy

1. **Identify Opposing Lens**: If user aligns with Liberalism, challenge from Conservative/Libertarian perspective
2. **Select Relevant Data**: Use topic-aware government data gathering
3. **Frame Challenge**: "While [user stance], consider that [statistic] suggests [contrarian point]"
4. **Cite Sources**: Always include [n] citations linking to government data
5. **Follow-up**: Ask probing question that requires deeper thought

### Example Challenge Flow

**User**: "I support universal healthcare because everyone deserves access."

**AI Challenge** (from Conservative/Libertarian lens):
```
I understand the goal of universal access. However, consider these data points:

- The U.S. currently spends $4.3 trillion annually on healthcare [1], 
  representing 18.3% of GDP [2]
- Countries with universal systems like the UK spend 10.2% of GDP [3]
- Wait times for non-emergency procedures average 18 weeks in the UK [4]

Given these statistics, how do you balance universal access with cost control 
and efficiency? What mechanisms would you propose to prevent the cost overruns 
seen in other universal systems?

[Sources section with links]
```

---

## Topic Integration

### Topic List from `docs/data-sources/political_topics.md`

Parse the markdown file to extract topics:
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

### Topic Selection UI

- Grid layout: 3-4 columns
- Each card: Topic name + brief description
- Click to select → starts conversation
- Selected topic highlighted
- "Change Topic" button to reset

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Add "The Contrarian" tab to navigation
- [ ] Create `ContrarianChallenge` component (basic layout)
- [ ] Parse topics from `docs/data-sources/political_topics.md`
- [ ] Topic selector UI
- [ ] Basic conversation UI (messages)

### Phase 2: Core Functionality
- [ ] Create `/api/contrarian/start` endpoint
- [ ] Create `/api/contrarian/challenge` endpoint
- [ ] Implement `generateContrarianChallenge()` service
- [ ] Build contrarian prompts
- [ ] Integrate government data gathering

### Phase 3: Scoring System
- [ ] Create scoring algorithm (start with GPT-4o)
- [ ] Build score box component
- [ ] Implement score updates after each response
- [ ] Add visual meters (progress bars)

### Phase 4: Polish
- [ ] Add loading states
- [ ] Error handling
- [ ] Source citation rendering
- [ ] "I'm Done" button and final state
- [ ] Smooth score animations
- [ ] Mobile responsiveness

### Phase 5: Enhancement (Future)
- [ ] Conversation history persistence (Firebase)
- [ ] Export conversation as PDF
- [ ] Share alignment scores
- [ ] Topic-specific statistics dashboard
- [ ] Multi-turn conversation optimization

---

## Technical Considerations

### Reusing Existing Infrastructure

1. **Government Data**: Reuse `gatherGovernmentData()` from `src/lib/government/index.ts`
2. **OpenAI Client**: Reuse `getOpenAIClient()` from `src/lib/openai.ts`
3. **Source Extraction**: Reuse `extractSources()` and `makeCitationsClickable()` from `src/lib/analysis/sources.ts`
4. **Topic Mapping**: Reuse topic-aware data selection from `src/lib/government/topic-mapping.ts`

### New Components Needed

1. `src/components/ContrarianChallenge.tsx` - Main component
2. `src/components/AlignmentScoreBox.tsx` - Score meters
3. `src/components/ContrarianMessage.tsx` - Message component (similar to Message.tsx)
4. `src/lib/contrarian/index.ts` - Service layer
5. `src/lib/contrarian/prompts.ts` - Prompt builders
6. `src/lib/contrarian/scoring.ts` - Scoring logic
7. `src/lib/contrarian/topics.ts` - Topic list parser
8. `src/app/api/contrarian/start/route.ts` - Start endpoint
9. `src/app/api/contrarian/challenge/route.ts` - Challenge endpoint

### State Management

- Use React `useState` for component state
- Consider `useReducer` for complex conversation state
- No need for external state management (Redux/Zustand) for MVP

### Performance

- Score updates: Debounce if using GPT-4o (batch updates)
- Conversation history: Limit to last 10 messages for context
- Government data: Cache per topic (reuse existing cache)

---

## Edge Cases & Error Handling

1. **No Government Data Available**
   - Fallback to general statistics
   - Acknowledge limitation: "Limited data available, but consider..."

2. **User Provides Vague Response**
   - Ask clarifying question
   - "Could you elaborate on [specific aspect]?"

3. **User Changes Topic Mid-Conversation**
   - Reset conversation
   - Reset scores to neutral (5)
   - Confirm: "Starting new conversation on [topic]"

4. **API Failures**
   - Retry once
   - Show error message
   - Allow user to continue or restart

5. **Scoring Failures**
   - Fallback to keyword-based if GPT-4o fails
   - Show "Score unavailable" if both fail

6. **Empty/Invalid User Input**
   - Disable submit button
   - Show validation message

---

## Success Metrics (Future)

- Average conversation length
- Score distribution across lenses
- Most challenged topics
- User retention (do they come back?)
- Most effective challenges (which stats resonate?)

---

## Open Questions

1. **Scoring Method**: GPT-4o vs keyword-based vs hybrid?
   - **Recommendation**: Start with GPT-4o for accuracy, optimize later

2. **Conversation Length**: Limit turns or unlimited?
   - **Recommendation**: Unlimited, but track for analytics

3. **Score Persistence**: Save scores per user?
   - **Recommendation**: Not for MVP, add later with auth

4. **Challenge Intensity**: How aggressive should AI be?
   - **Recommendation**: Respectful but firm, data-driven

5. **Topic Descriptions**: Show full description or just name?
   - **Recommendation**: Show description on hover/selection

---

## Next Steps

1. Review this brainstorm with Abhi
2. Confirm scoring approach
3. Finalize UI/UX mockups
4. Create implementation plan with tasks
5. Start Phase 1 implementation

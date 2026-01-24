# PolySci MVP Testing Checklist

## Prerequisites
- [ ] Environment variables configured in `.env.local`:
  - `NEWSDATA_API_KEY`
  - `OPENAI_API_KEY`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - (Optional) `CONGRESS_API_KEY`

## Manual Integration Testing

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Test Featured Stories
1. [ ] Open http://localhost:3000
2. [ ] Verify 2-panel layout appears (left: featured stories, right: empty analysis panel)
3. [ ] Verify 5 featured stories appear in left panel (or loading skeleton while fetching)
4. [ ] Verify stories are clickable
5. [ ] Click a story and verify:
   - [ ] Story appears in left panel as user input
   - [ ] Loading state appears in right panel
   - [ ] Analysis appears in right panel when complete

### Step 3: Test Custom Topic Analysis
1. [ ] Type "federal budget 2026" in the input field at bottom
2. [ ] Click "Analyze" button
3. [ ] Verify:
   - [ ] Topic appears in left panel as user input
   - [ ] Loading skeleton appears in right panel
   - [ ] Full analysis appears in right panel when complete (not streaming)
4. [ ] Verify all sections appear with proper formatting:
   - [ ] Quick Summary
   - [ ] Why This Matters Now
   - [ ] Key Parties Involved
   - [ ] Democratic Perspective
   - [ ] Republican Perspective
   - [ ] Impact on the Common Joe
   - [ ] By the Numbers
   - [ ] Sources
5. [ ] Verify sources are clickable links
6. [ ] Verify markdown formatting (headings, lists, etc.) renders correctly

### Step 4: Test Follow-up Questions
1. [ ] After analysis completes, verify suggestion buttons appear in left panel
2. [ ] Click a suggestion button
3. [ ] Verify:
   - [ ] Suggestion appears in left panel as user input
   - [ ] New analysis appears in right panel
4. [ ] Type a custom follow-up question
5. [ ] Submit and verify response appears in right panel

### Step 5: UI/UX Verification
1. [ ] Verify header displays "PolySci" correctly
2. [ ] Verify 2-panel layout (50/50 split)
3. [ ] Verify left panel shows user inputs and suggestions
4. [ ] Verify right panel shows formatted analysis
5. [ ] Verify markdown formatting renders correctly (headings with borders, lists, links)
6. [ ] Verify loading states (skeleton loader in right panel during analysis)
7. [ ] Verify disabled states (input disabled during analysis)
8. [ ] Verify error handling (graceful error messages in right panel)

### Step 6: Test Socratic Circle Feature
1. [ ] Click "Socratic Circle" tab in header
2. [ ] Verify topic selector appears in left panel (10 topics)
3. [ ] Select a topic
4. [ ] Verify:
   - [ ] Loading state appears
   - [ ] 4 perspective tabs appear (Liberalism, Conservatism, Socialism, Libertarianism)
   - [ ] Selected perspective content displays
   - [ ] Sources are extracted and clickable
5. [ ] Switch between perspective tabs
6. [ ] Verify each perspective has proper color coding and formatting

### Step 7: Test Contrarian Challenge Feature
1. [ ] Click "Contrarian Challenge" tab in header
2. [ ] Verify topic selector appears in left panel (15 topics)
3. [ ] Select a topic (e.g., "Healthcare System")
4. [ ] Verify:
   - [ ] Initial question appears: "What's your stance on [topic]?"
   - [ ] Alignment score box appears in top-right (4 meters, all at 5/10)
5. [ ] Type your stance in input field (e.g., "I support universal healthcare")
6. [ ] Click "Send"
7. [ ] Verify:
   - [ ] Loading state: "AI is challenging your view..."
   - [ ] Contrarian challenge appears with statistics
   - [ ] Alignment scores update in real-time (meters animate)
   - [ ] Sources are clickable [n] citations
   - [ ] Follow-up question appears
8. [ ] Continue conversation (respond to follow-up)
9. [ ] Verify scores continue updating based on responses
10. [ ] Click "I'm Done" button
11. [ ] Verify conversation ends, input disabled

### Step 8: Error Scenarios
1. [ ] Test with invalid API keys (should show error message)
2. [ ] Test with network disconnected (should handle gracefully)
3. [ ] Test with empty topic (should not submit)
4. [ ] Test Contrarian Challenge error handling (retry button works)

## Expected Behavior

### Featured Stories Endpoint (`/api/featured`)
- Returns JSON: `{ stories: NewsArticle[] }`
- Stories cached in Firebase (24hr TTL)
- Handles errors gracefully

### Analysis Endpoint (`/api/analyze`)
- Accepts POST with `{ topic: string }`
- Returns JSON: `{ analysis: string, suggestions: string[] }`
- Non-streaming response (full analysis returned at once)
- Includes formatted markdown analysis and follow-up suggestions

### Follow-up Endpoint (`/api/followup`)
- Accepts POST with `{ question: string, context: AnalysisContext }`
- Streams follow-up response
- Maintains conversation history

### Socratic Circle Endpoint (`/api/socratic-circle`)
- Accepts POST with `{ topic: string }`
- Returns JSON: `{ perspectives: { liberalism, conservatism, socialism, libertarianism } }`
- Generates 4 perspectives in parallel

### Contrarian Challenge Endpoints
- `/api/contrarian/start`: Accepts `{ topic: string }`, returns `{ initialQuestion, alignmentScores }`
- `/api/contrarian/challenge`: Accepts `{ topic, userStance, conversationHistory, currentScores }`, returns `{ challenge, updatedScores, followUpQuestion, sources }`

## Known Limitations (MVP)
- Context store is in-memory (lost on server restart)
- No user authentication
- No conversation persistence
- No URL parsing for articles
- No personalized recommendations
- Contrarian Challenge scores reset on page refresh (no persistence)

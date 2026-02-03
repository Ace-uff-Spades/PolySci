# PolySci — Case Study Summary

## Purpose & Vision

**PolySci** is a web app that helps users understand political news and topics through **balanced analysis**, **primary sources**, and **factual government data**. The product does not sway users toward any political opinion or debate them; it aims to educate and strengthen critical thinking.

**Goals:**
- Increase awareness of different perspectives on political issues
- Help users better understand their own political views
- Encourage reliance on primary sources (government data, cited news) as a basis for opinions
- Reduce dependence on low-quality or fraudulent news and discourse

**Target users:** Politically non-active, passively active, and semi-active users (from “don’t read news” to “read 5x/week, research when impacted”).

**Theme:** “Discourse to become more aware of the world” — educational and enlightening, not combative.

---

## Architecture

### Tech Stack
- **Frontend:** Next.js 14, React, Tailwind CSS (2-panel layouts, tab navigation)
- **Backend:** Next.js API routes (Node.js)
- **Data / cache:** Firebase Firestore (news cache 24h TTL, government data cache 6h TTL)
- **LLM:** OpenAI GPT-4o (analysis, Socratic perspectives, Contrarian, validation, question classification)
- **News:** Newsdata.io (featured + query-based articles; 200 credits/day free tier)
- **Government data:** BLS, USASpending, Census, Congress.gov, EIA (optional), FRED (optional) — topic-aware selection via `topic-mapping.ts`
- **Testing:** Vitest (TDD), Braintrust (AI evals: faithfulness, relevancy, alignment accuracy)

### Why This Tech Stack

**Next.js + API routes.** We wanted a single codebase for MVP: frontend and backend colocated, no separate server to deploy or maintain. Next.js API routes give us serverless-style endpoints with TypeScript end-to-end and easy Vercel deployment later. Tradeoff: we don’t get long-lived WebSockets or heavy background jobs in-process; for our flows (request → gather data → LLM → respond) that’s acceptable.

**Firebase Firestore for cache.** Newsdata.io has a strict free-tier limit (200 credits/day); government APIs can be rate-limited or slow. We needed a cache to avoid burning credits on repeated queries and to reuse government data across features (Analysis, Socratic, Contrarian). Firestore was already in the PRD for “future auth/history,” so we use it for cache keys (MD5 of normalized topic/query) and TTLs. We made Firebase **lazy-load** and handle missing credentials so evals and local dev can run without Firebase; cache calls degrade gracefully when Firebase isn’t configured.

**GPT-4o.** We need strong reasoning, instruction-following, and structured output for analysis, multi-perspective generation, and Contrarian (acknowledge-then-challenge). We use **gpt-4o-mini** only for narrow classification: stance detection, question-type detection, topic relevance when keyword scoring is ambiguous — to keep cost and latency down on hot paths.

**Tailwind CSS.** Fast iteration and consistent spacing/typography without maintaining a separate design system for MVP. We use CSS variables for theming (e.g. debate-hall palette) so we can tune the look in one place.

**Vitest + Braintrust.** Unit tests (Vitest) with TDD for business logic; AI evals (Braintrust) for LLM behavior. We chose Braintrust because it’s common in TypeScript/Next.js stacks and supports custom scorers and real API calls (no mocks in evals), so we get a realistic signal on faithfulness, relevancy, and alignment.

### Technical Tradeoffs

**JSON response instead of streaming.** We initially streamed analysis (SSE) for a “ChatGPT-like” feel. We hit **word duplication** in the stream (e.g. “Quick Quick Summary Summary”) and weaker control over section boundaries and formatting. We **switched to a single JSON response** for the main analysis and Contrarian: the server waits for the full LLM reply, then returns one JSON payload. Tradeoff: slightly higher perceived latency for the first token, in exchange for correct formatting, reliable sections, and simpler frontend (no stream parsing). Follow-up still uses streaming where it’s kept for legacy; we may align it to JSON later.

**JSON mode for Contrarian (and related flows).** We had fragile regex parsing of markdown for “acknowledgment,” “statistics for/against,” “sources,” etc. We moved to **OpenAI JSON mode** with strict schemas (`additionalProperties: false`, explicit `required` arrays, `type: ["number", "null"]` for optional fields). That gives **zero parsing failures** and a single contract between backend and frontend. Tradeoff: we depend on OpenAI’s JSON-mode behavior and schema support; we accept that constraint for reliability and debuggability.

**Two-stage pipeline for Contrarian.** Instead of one LLM call that both “acknowledges and challenges,” we run **Stage 1: stance analysis** (merits, one supporting stat from government data) and **Stage 2: contrarian challenge** (stats for/against, deeper analysis, follow-up). Rationale: a single call tended to underweight acknowledgment or blur it with the challenge. Two stages force “acknowledge first, then challenge” and let us pass structured output from Stage 1 into Stage 2. Tradeoff: two sequential API calls and a bit more latency; we accepted that for clearer UX and more balanced responses.

**Hybrid topic validation (keyword + GPT).** We need to reject clearly off-topic input without blocking short, on-topic stance answers (e.g. “maintaining lower taxes” for Taxes & Wealth Redistribution). We use a **keyword match** first (fast, free); only in ambiguous bands (e.g. score 0.2–0.6) or when keyword score is very low do we call GPT for relevance. We also treat **no-stance phrases** (“I don’t know,” “idk,” etc.) as always on-topic so we don’t punish users who are still exploring. Rationale: minimize LLM cost and latency while avoiding false off-topic rejections.

**Caching TTLs: 24h news, 6h government.** News changes daily; we cache Newsdata.io for 24 hours to stay fresh but avoid re-hitting the 200/day limit. Government data (BLS, Census, Congress, etc.) changes less often; we use a **6h TTL** so we reuse the same topic payload across Analysis, Socratic, and Contrarian in a session without over-fetching. Same topic in Socratic uses one cached gov-data fetch for all four perspectives.

**Topic-to-data mapping.** Government APIs aren’t topic-labeled; we maintain a **topic-mapping** (e.g. “Abortion Rights” → Congress search terms, relevant spending keywords) so we only request and show data that’s **directly relevant** to the selected topic. That avoids generic stats (e.g. “20 bills in Congress,” unemployment) for topics like Abortion; we explicitly forbid those in prompts and prefer topic-specific legislation/spending/demographics. Tradeoff: we maintain a mapping per topic; in return we get more relevant, defensible statistics.

**Shared `formatGovernmentData()`.** Analysis, Socratic, Contrarian, and evals all need the same government-data string shape for prompts. We centralize formatting in `lib/government/format.ts` so prompts stay consistent and we don’t duplicate formatting logic or drift between features.

**Evals with real APIs, no mocks.** Our Braintrust evals call the real Contrarian/educational APIs (and thus real OpenAI and government data) so we measure **end-to-end** behavior: faithfulness to provided data, relevancy to the user’s stance/question, and alignment-score reasonableness. Tradeoff: evals are slower and depend on API keys and network; we use `EVAL_LIMIT` and dataset filters (e.g. `npm run eval -- educational`) for fast iteration.

**Stateless API, client-held mode.** We don’t store conversation or “mode” (educational vs contrarian) on the server. The client sends **conversation history, mode, stanceHistory**, and optional **explicitStanceAction/confirmedStance** on each request. Rationale: simpler backend, no session store or cleanup, and easier to reason about; the client is the source of truth for the current flow. Tradeoff: larger request payloads and reliance on the client sending correct state.

### High-Level Data Flow
1. **User input** (topic, question, or stance) → API route
2. **Context gathering:** News (Newsdata.io, cached) and/or government data (6 APIs, cached) in parallel
3. **LLM:** GPT-4o with structured prompts and, where used, JSON-mode outputs
4. **Response:** JSON to frontend; formatted with citations and sources

### Key Components
- **Data layer:** `news-service.ts`, `government/index.ts` + `topic-mapping.ts`, `government/format.ts` (shared formatting), `government/cache.ts`
- **Analysis:** `analysis/index.ts` (gatherContext, generateAnalysis, follow-up), `analysis/prompts.ts`
- **Socratic:** `socratic/index.ts` (4 perspectives in parallel), `socratic/prompts.ts` (Liberalism, Conservatism, Socialism, Libertarianism)
- **Contrarian:** `contrarian/index.ts` (two-stage: stance analysis → challenge), `stance-analysis.ts`, `question-handler.ts`, `validation.ts`, `scoring.ts`, `response-formatter.ts`; prompts enforce topic-specific stats only, no generic bill counts or tangential economic stats
- **Evals:** `evals/runner.ts`, datasets (contrarian + educational), scorers (faithfulness, relevancy, alignment-accuracy)

### Caching
- **News:** Firebase, 24h TTL; key = hash of normalized query
- **Government data:** Firebase, 6h TTL; key = hash of normalized topic; shared across Analysis, Socratic, and Contrarian

### API Endpoints
- `POST /api/featured` — featured stories
- `POST /api/analyze` — topic analysis (news + gov data → GPT-4o → JSON)
- `POST /api/followup` — follow-up questions (in-memory context)
- `POST /api/socratic-circle` — 4 perspectives for a topic
- `POST /api/contrarian/start` — start Contrarian conversation (initial question, neutral alignment scores)
- `POST /api/contrarian/challenge` — educational or contrarian response; validation, stance detection, question detection, two-stage challenge

---

## AI Technical Details

### Models and When We Use Them
- **GPT-4o** (primary): Analysis (generateAnalysis), Socratic (4 perspectives in parallel), Contrarian (stance analysis + challenge), alignment scoring (calculateAlignmentScore), faithfulness/relevancy/alignment evals. Used wherever we need strong reasoning, long context, or structured JSON output.
- **gpt-4o-mini** (OPENAI_MODEL_QUICK): Topic relevance (validateWithGPT when keyword score is ambiguous), stance detection (detectStanceWithParaphrase), question-type classification (detectQuestionType). Used for fast, cheap classification so we don’t burn GPT-4o on yes/no or categorical decisions.

### Structured Output (JSON Mode)
- **OpenAI JSON mode** with `response_format: { type: 'json_schema', json_schema: { name, schema, strict: true } }`. We use `getJSONCompletion<T>(systemPrompt, userPrompt, schema)` everywhere we need a parseable contract: stance analysis, contrarian challenge, educational response, evals (faithfulness supported array, relevancy scores, alignment accuracy).
- **Schema discipline:** `additionalProperties: false` on all objects; every property in `required` where applicable; optional numbers as `type: ["number", "null"]` (OpenAI doesn’t support `nullable: true` in the way we need). This eliminated regex/markdown parsing failures and gave a single contract between backend and frontend.

### Contrarian AI Pipeline
1. **Topic validation:** `validateTopicRelevance(topic, userInput, contextQuestion?)`. Step 0: no-stance phrases (“I don’t know,” “idk,” etc.) → always on-topic. Step 1: keyword match (extractTopicKeywords, checkKeywordsMatch). Step 2: ambiguous band (0.2–0.6) + core keyword match → on-topic. Step 3: low keyword score → GPT (gpt-4o-mini) with context hint (last AI message so short answers like “maintaining lower taxes” are treated as on-topic).
2. **Question vs stance:** `detectQuestionType(userStance, topic)` returns `'factual' | 'opinion-seeking' | 'mixed' | 'stance'`. Uses NO_STANCE_PHRASES and OPINION_OR_HELP_PHRASES first; then question mark or question words; else gpt-4o-mini for final classification. In contrarian/challenge mode, only `'stance'` goes to contrarian path; all others get educational response.
3. **Stance confirmation:** When user types a stance without clicking “I have a stance — challenge me,” we call `detectStanceWithParaphrase(userStance, topic)` (gpt-4o-mini, JSON): returns `{ isStance, paraphrasedStance }`. If isStance and paraphrasedStance, we return a confirmation prompt (“Is X your stance?”); yes → explicit action with confirmedStance → contrarian path.
4. **Two-stage contrarian:** Stage 1 `analyzeStance(topic, userStance, governmentData)` (GPT-4o, JSON): acknowledgment, supportingStatistics (1), validPoints. Stage 2 `generateContrarian(context, userStance)` (GPT-4o, JSON): uses stance analysis, produces acknowledgment, statisticsFor, statisticsAgainst, deeperAnalysis, followUpQuestion, sources. Prompts forbid generic bill counts and tangential economic stats; require topic-specific statistics only.
5. **Alignment scoring:** `calculateAlignmentScore(userStance, topic)` (GPT-4o) returns 1–10 per lens (liberalism, conservatism, socialism, libertarianism). `updateScores(current, userStance, topic)` applies 60% recent / 40% current weighting so scores evolve across the conversation.

### Prompt Design Principles
- **Government data only:** Every stat must come from the provided GOVERNMENT DATA block; no external studies, think tanks, or invented numbers. “Data does not contain X” is allowed when context lacks X.
- **Topic-specific stats:** No generic “X bills in Congress” or unemployment for non-economy topics; prefer specific legislation, topic-relevant spending, or demographics. If no directly relevant stat, omit or say so briefly.
- **Anti-repetition:** When conversation history is present, prompts instruct: do not repeat the same statistics; prefer a different data category (e.g. if bill count was cited, use spending/income or a specific bill next).
- **Data-lack:** At most one brief sentence (e.g. “We have limited data on this topic”); then focus only on what we have. Follow-up question must not be about lack of data.
- **Educational vs challenge:** Educational = analysis (common stances, values at stake) + followUpQuestion only; no stats/legislation unless directly relevant. Challenge = acknowledgment + stats for/against + deeper analysis + follow-up; CTAs (“Learn more,” “Take action”) when sources exist.

### Eval Scorers (AI-as-Judge)
- **Faithfulness:** Custom LLM (GPT-4o, JSON). Input: formatted government data (same as model context) + list of statistical claims from response (keyStatisticsFor, keyStatisticsAgainst). Output: `supported: boolean[]` per claim. Rules: same numbers/metric/meaning = supported; “data does not contain X” = supported when context lacks X. Score = share of claims supported. Skipped for educational responses.
- **Relevancy (educational):** Custom LLM (GPT-4o, JSON). One call scores both answer relevancy and follow-up relevancy. Input: topic (+ description), user question, model answer, follow-up question. Output: answerRelevancy, followUpRelevancy (0–1). Used for educational cases only.
- **Relevancy + alignment (challenge):** Custom LLM (GPT-4o, JSON). Input: topic, user stance, response sections, updated alignment scores, expectedAlignmentDirection. Output: relevancy (does response address stance?) and alignmentAccuracy (do scores reflect stance?). Alignment scorer uses strict rubric (primary direction, 7–10 for that lens, 1–4 for others). Skipped for educational (neutral scores not meaningful).

---

## UX Flows

### 1. Analysis
- User sees **featured stories** and/or enters a **topic/summary**.
- App fetches news (Newsdata.io) and government data (BLS, USASpending, Census, Congress, etc.) in parallel.
- GPT-4o produces a structured analysis: Quick Summary, Why This Matters Now, Key Parties, Democratic/Republican perspectives, Impact on the Common Joe, By the Numbers, Sources.
- **2-panel layout:** left = input + suggestions; right = analysis with clickable citations.
- User can ask **follow-up questions**; context is maintained for the session.

### 2. Socratic Circle
- User selects a **topic** from a predefined list (10 topics).
- App fetches government data once; GPT-4o generates **4 perspectives in parallel** (Liberalism, Conservatism, Socialism, Libertarianism).
- **Tabbed UI:** topic selector at top, perspective tabs, selected perspective content with sources.
- Goal: expose users to multiple political lenses on the same topic with shared quantitative data.

### 3. The Contrarian (Stance-Based Challenge)
- **Start:** User selects one of **15 topics** → `/api/contrarian/start` → initial question + neutral alignment scores (4 lenses, 1–10).
- **Layout:** Left = topic, alignment score box (4 meters), stance history; right = conversation. When chat starts, other topics are hidden; selected topic is highlighted.
- **Modes:**
  - **Educational:** User hasn’t committed a stance (or said “I don’t know,” asked a question). App gives analysis (common stances, values at stake) + follow-up question; no statistics/legislation unless directly relevant. Off-topic warning, when shown, appears **at the bottom** above the input so it’s visible in long threads.
  - **Contrarian:** User has stated a stance and either clicked **“I have a stance — challenge me”** or confirmed a paraphrased stance (“Is X your stance?” → Yes). App runs **two-stage pipeline:** (1) stance analysis (merits, supporting stat from gov data), (2) contrarian challenge with one stat for and one against (topic-specific only), deeper analysis, follow-up question, CTAs (“Learn more,” “Take action”) when sources exist.
- **Stance flow:** Only the **first** submitted stance enters “contrarian mode”; after that, replies stay contrarian until the user clicks **“I’m Done”** or **asks a question** (then one educational answer). **“Change my stance”** appears after the first stance; user clicks it, types new stance, sends → that message is sent as explicit new stance (same API as confirmation flow).
- **Question detection:** In contrarian/challenge mode, if the user’s message is classified as a **question** (factual, opinion-seeking, or mixed), the app responds with an **educational** answer; otherwise it continues with a **contrarian** challenge.
- **Validation:** Hybrid (keywords + GPT) for topic relevance; “I don’t know” / “idk” / uncertainty phrases are always treated as on-topic and routed to educational.
- **Alignment scores:** Updated after each contrarian response (GPT-4o semantic analysis, 60% recent / 40% current weighting).
- **Stance history** is shown in the left panel and sent to the API for LLM context; anti-repetition in prompts (vary statistics/data category across turns).

---

## Key Implementation Details

- **JSON mode** for Contrarian and stance analysis: structured outputs, no parsing failures.
- **Topic-to-data mapping:** All 15 Contrarian topics map to Congress (and where relevant spending) keywords so legislation and spending are topic-relevant.
- **Topic-specific statistics only:** Prompts forbid generic bill counts and broad economic stats (e.g., unemployment) unless the topic is explicitly about legislation volume or the economy.

---

## Evals

### What We Tried
We built an **AI eval system** for The Contrarian (and its educational path) to measure quality end-to-end without mocks. We tried three kinds of scorers:

1. **Faithfulness** — Do the statistics in the response come from the government data we provided? We started with Braintrust’s Faithfulness evaluator; it expected exact or near-exact text matches. Our model paraphrases stats (e.g. “Unemployment stands at 4.4%” vs “Unemployment Rate: 4.4% (December 2025)”), so we got **0% or very low scores** even when the meaning was correct. We also had cases where the model said “the data does not contain X” and the judge marked that as NOT SUPPORTED because the judge was doing literal claim extraction. We **replaced** with a **custom LLM scorer** (GPT-4o, JSON): we pass the same formatted government context we give the model, extract each statistical claim from the response (keyStatisticsFor, keyStatisticsAgainst), and ask the judge to return a `supported: boolean[]` per claim. Rules: same numbers, same metric, same meaning = supported; explicit “data does not contain X” = supported when context indeed lacks X. Faithfulness is **skipped for educational responses** because those don’t promise stat-only support.

2. **Relevancy** — Does the response address the user’s question or stance? We started with Braintrust’s AnswerRelevancy; passing only `topic` as context was too narrow and educational vs challenge response shapes differed, so scores were inconsistent (e.g. 60% or 0%). We **replaced** with **custom LLM scorers**: (a) **Educational:** one GPT-4o JSON call that scores both *answer relevancy* (does the analysis address the question?) and *follow-up relevancy* (is the follow-up question on-topic and a logical next step?). (b) **Challenge:** one GPT-4o JSON call that scores *relevancy* (does the response address the stance?) and *alignment accuracy* (do the updated alignment scores reflect the stance?). We pass topic + topic description and full response sections so the judge has enough context.

3. **Alignment accuracy** — Do the 1–10 alignment scores (liberalism, conservatism, socialism, libertarianism) match the user’s stance? We initially parsed a free-text judge output (e.g. “1.0”, “Perfect match: 1.0”) and got **100%** on everything — partly because educational responses have neutral scores (5/5/5/5) and the judge was lenient. We **skipped alignment for educational** (not meaningful) and **switched to JSON mode** for the challenge scorer with a **strict rubric**: 1.0 = primary direction correct and score 7–10 for that lens, others 1–4; 0.8 = primary correct, minor issues; 0.6 = primary correct but score off by 2+; 0.4 = wrong direction or score way off; 0.0 = completely wrong. That gave us a realistic signal.

### How We Structured Them
- **Datasets:** Two files, same `EvalCase` interface. **Contrarian dataset** (`contrarian.ts`): 7 cases — different topics and clear stances (e.g. healthcare universal, immigration strict, taxes progressive, government minimal, climate action, gun rights, abortion). Each case has `id`, `topic`, `userStance`, `expectedCriteria` (human-readable), `expectedResponseType: 'challenge'`, `expectedAlignmentDirection`, `expectedFollowUpQuestions` (optional). **Educational dataset** (`educational-responses.ts`): 7 cases — unknown stance (“I don’t know my stance”), opinion-seeking (“What do you think?”, “Give me a stance”), factual question (“What is the current rate of global temperature increase?”), legislation question (“What legislation has been passed recently about education funding?”), gun-control factual. Each has `expectedResponseType: 'educational'` and, where we don’t have data or the answer is “we don’t have that,” a **per-case `relevancyThreshold`** (e.g. 0.3 or 0.5) so we don’t fail for honest “no data” answers.
- **Runner:** `runEvals(datasetType: 'all' | 'contrarian' | 'educational')`. Loads `.env.local` so evals run with real API keys. For each case: (1) **Real API:** `gatherGovernmentData(topic, { skipCache: true })`, then same routing as production — `detectQuestionType` → educational path (`generateQuestionResponse`) or contrarian path (`generateContrarian`). (2) **Scorers:** Faithfulness (skip if educational), Relevancy+FollowUp (educational) or Relevancy+Alignment (challenge). Each scorer runs in a try/catch so one failure doesn’t block others. (3) **Criteria:** Besides scores we check structural criteria (e.g. acknowledgment present, supporting/challenging stat present, sources valid URLs, alignment updated, probing questions present, analysis present, follow-up relevant, AI no-stance message for opinion-seeking). **Pass** = all criteria true + faithfulness ≥ 0.7 (or skipped) + relevancy ≥ threshold (per-case for educational) + alignment ≥ 0.7 (or skipped). Results written to `evals/results/eval-results-<timestamp>.json`. Optional **EVAL_LIMIT** env var runs only the first N cases for fast iteration.
- **Why this structure:** (1) **Single EvalCase type** so we can mix contrarian and educational in one runner and filter by `datasetType`. (2) **Real APIs, no mocks** so we measure production behavior (data shape, topic-mapping, prompt changes). (3) **Per-case relevancyThreshold** for educational cases where we knowingly don’t have data (e.g. temperature rate) or where the “right” answer is “we don’t have that” + related data + follow-up; default 0.7 would fail those. (4) **Criteria + scores** so we catch both “wrong shape” (e.g. missing acknowledgment) and “wrong quality” (low faithfulness/relevancy). (5) **Individual scorer error handling** so a flaky judge or network error doesn’t zero out the whole run.

### How They Helped Improve User Experience
- **Faithfulness fixes:** Low faithfulness often meant the model was **citing data not in the provided context** (hallucination or prior knowledge). We tightened prompts: “Every statistic MUST come ONLY from the GOVERNMENT DATA section”; “Do not state well-known facts unless they appear in the GOVERNMENT DATA”; “data does not contain X” is allowed when context lacks X. We also improved **topic-mapping** and **topic-specific stats** so the model has relevant data and doesn’t fall back to generic bill counts or unemployment. Result: responses stay grounded in what we actually give the model.
- **Relevancy fixes:** Low relevancy on educational cases led us to **improve educational prompts**: opinion-seeking (“what do you think”) → explicit “AI doesn’t have a stance” + perspectives first; factual-no-data → “we don’t have that” + related data + follow-up offering to show data; legislation → only cite bills that match the topic, filter by question-topic words. We added **per-case relevancyThreshold** and **follow-up relevancy** so we don’t penalize honest “we don’t have that” answers and we reward good follow-up questions. Result: educational replies stay on-topic and guide users toward stating their stance.
- **Alignment + structure:** Alignment scorer and criteria (acknowledgment, supporting/challenging stat, probing questions) pushed us to keep **two-stage pipeline** and **JSON structure** so we always have acknowledgment, dual stats, and a follow-up question. Result: users get a consistent, balanced challenge format.
- **Eval-driven prompts:** The evals-issues-analysis doc and scorer logs (e.g. “claim N NOT SUPPORTED — reason: …”) made it obvious when the model was going beyond context or when the judge was too strict. We iterated on prompt wording and judge rules (e.g. “data does not contain X” = supported) until educational dataset passed 7/7 and contrarian behavior improved.

### Future Enhancements (Evals)
- **Full suite run and tuning:** Run `npm run eval -- all` regularly; tune contrarian pass rate (prompts, topic-mapping, or thresholds) based on results.
- **Evals for explicit stance/confirmation flows:** Add cases where the user clicks “I have a stance — challenge me” or confirms “yes” to a paraphrased stance; assert correct routing and response type.
- **Evals for Analysis feature:** Dataset of topic + expected analysis sections; scorers for factual grounding (news + gov data) and structure.
- **Evals for Socratic Circle:** Dataset of topic + expected perspectives; scorer for balance and citation to government data.
- **Stricter faithfulness:** Semantic similarity or normalized number extraction so paraphrased stats still pass when meaning matches.
- **Regression suite:** Pin a subset of cases as “must pass” in CI so we don’t regress when changing prompts or data flow.

---

## Future Enhancements (from PRD & project state)

**Product / UX**
- User authentication (save history, preferences)
- URL parsing (paste article link instead of typing summary)
- Personalized “why you should care” (e.g., location, situation)
- Deep dives from selected analysis sections
- Post-conversation: relevant news from past ~2 months based on conversation
- Broader political discourse on common topics

**Technical / Quality**
- Full eval suite run and contrarian pass-rate tuning
- Evals for explicit stance/confirmation flows, Analysis feature, Socratic Circle
- Error boundaries and retry logic for API calls
- Follow-up endpoint moved to non-streaming (consistent with analyze)
- Optional EIA/FRED API keys for richer data
- Data flow documentation and diagrams (request/response, caching, error paths, 2-panel UI)

---

## Summary Table

| Aspect | Detail |
|--------|--------|
| **Product** | PolySci — balanced political news/topic analysis with primary sources |
| **Purpose** | Educate, surface perspectives, ground opinions in data — not debate or persuade |
| **Users** | Non-active to semi-active politically; want to understand news and their own views |
| **Core features** | Analysis (news + gov data), Socratic Circle (4 lenses), The Contrarian (stance challenge) |
| **Data** | Newsdata.io; BLS, USASpending, Census, Congress, EIA, FRED; Firebase cache |
| **LLM** | GPT-4o; JSON mode where structure matters; topic-specific stats in Contrarian |
| **UX** | 2-panel layouts; tab nav; explicit stance + “Change my stance” + question detection in Contrarian |
| **Quality** | TDD (Vitest), AI evals (Braintrust + custom LLM scorers); see **Evals** section |

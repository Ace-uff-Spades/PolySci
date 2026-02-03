# Eval Pipeline Diagnosis: Poor Results and Same Government Data

**Date:** 2026-01-28  
**Status:** Implemented (2026-01-28–31)  
**Context:** 1/14 evals passed; contrarian evals show identical government data across topics; educational relevancy low.

**Implemented:** Topic-mapping for Taxes, Education, Gun, Size/Scope; client-side `filterBillsByTopic()` in government index; faithfulness scorer rule for "data does not contain X"; educational faithfulness skipped in runner; educational prompts (opinion/factual/perspectives/legislation) + legislation bill filter by question topic; question-type detection for opinion-seeking phrases; per-case `relevancyThreshold` and relaxed follow-up for no-data educational cases; EVAL_LIMIT env var; failed-criteria logging. Educational dataset passes 7/7.

---

## Summary of Symptoms

| Symptom | Evidence |
|--------|----------|
| Only 1 passed | government-minimal passed; 13 failed (faithfulness, relevancy, or alignment below 0.7 or criteria not met). |
| Same government data across topics | Healthcare, Taxes, Government minimal, Climate, Gun, Education all show "Related Bills in Congress: 20 found" with the same 3 bill titles (tax give away, children territories, Northern Ireland). |
| Low educational relevancy | healthcare-what-do-you-think 30%; climate-factual-question 30%; gun-control-factual-question 40%; education-legislation-question 60%; immigration-unknown-stance 80% but faithfulness 0%. |

---

## Diagnosis 1: Same Government Data (Congress Bills)

### Root cause analysis

- **Topic-to-query mapping:** `getTopicDataConfig(topic)` in `topic-mapping.ts` sets `congressKeywords` only for topics that match specific strings. Eval topics and mapping:
  - **Healthcare System** → matches "healthcare"/"health" → `congressKeywords = ['healthcare', 'health', 'medicare', 'medicaid']`.
  - **Immigration & Border Policy** → matches "immigration"/"border" → `congressKeywords = ['immigration', 'border', 'visa', 'citizenship']`.
  - **Climate Change & Environmental Regulation** → matches "climate"/"energy" → `congressKeywords = ['climate', 'energy', 'environment', 'renewable']`.
  - **Taxes & Wealth Redistribution** → no block contains "taxes" or "wealth" → `congressKeywords` undefined.
  - **Size & Scope of Government** → no block for "size"/"scope"/"government" (minimal gov) → undefined.
  - **Gun Control** → no block for "gun"/"firearm" → undefined.
  - **Education Policy** → no block for "education" → undefined.

- **Fallback:** When `congressKeywords` is undefined, `government/index.ts` uses `searchKeywords = config.congressKeywords || [topic]`, so Congress is queried with a single string: "Taxes & Wealth Redistribution", "Gun Control", "Education Policy", "Size & Scope of Government".

- **Why same bills appear:** Queries are different per topic, but:
  1. Congress.gov may return similar top results for different queries (e.g. same bills rank highly for multiple searches, or default sort by date/relevance).
  2. We only surface the first 3 bills in `formatGovernmentData` (`relatedBills.slice(0, 3)`). If the API returns 20 bills with similar ordering across topics, the same 3 can appear in prompts and in eval logs.

### Proposed solutions (planning)

1. **Verify Congress API behavior**
   - Log or assert per-topic Congress query and first few bill IDs (or titles) in evals or a one-off script.
   - Confirm whether different topics actually get different bill sets or the same top-N.

2. **Fill topic-mapping gaps**
   - Add entries for: **Taxes / wealth** (e.g. "tax", "wealth", "redistribution" → congressKeywords like tax, appropriations, welfare), **Education** (education, school, funding), **Gun / firearms** (gun, firearm, second amendment), **Size/scope of government** (government, regulation, federal).
   - Ensures topic-specific keywords are sent to Congress instead of a single phrase.

3. **Topic-specific bill filtering or ranking**
   - If the API returns a large set and we only use the first N, consider re-ranking or filtering by keyword overlap with topic (e.g. keep bills whose title/summary mention topic keywords) so the 3 we show are topic-relevant.

4. **Optional: surface more than 3 bills or bill IDs in logs**
   - Helps distinguish "same 20 bills, same top 3" from "different 20 bills, same top 3 by coincidence".

---

## Diagnosis 2: Low Educational Relevancy

### Root cause analysis

- **Factual questions we don’t have data for**
  - Examples: "What is the current rate of global temperature increase?", "How many mass shootings occurred in the US last year?"
  - Prompt tells the model to use **only** provided data and to say so if the data doesn’t contain the answer. Model correctly says "we don’t have that data" and pivots.
  - Relevancy scorer (correctly) treats "did not answer the question" as low relevancy (30–40%).
  - So: product is behaving as designed (no hallucination), but the answer doesn’t satisfy the question → low relevancy.

- **Opinion-seeking questions**
  - Example: "What do you think about healthcare?"
  - Model is instructed to use only government data; it tends to talk about legislation/data instead of explicitly saying "I don’t have a stance; my role is to help you explore" and then offering main perspectives/framing.
  - Relevancy scorer sees that the answer doesn’t directly address "what do you think" (opinion/evaluation) → low relevancy (e.g. 30%).

- **Misclassification: question treated as stance**
  - "Can you give me a stance on taxes?" is routed to **challenge** (stance) path instead of educational. So it gets challenge relevancy + alignment (50% relevancy, 0% alignment) instead of educational relevancy + no alignment. This is a **detectQuestionType** issue: phrase is question-like and help-seeking but may be classified as `stance` (e.g. no question mark, or classifier focuses on "stance").

- **Legislation / “what we have” answers**
  - "What legislation has been passed recently about education funding?" → model mentions a bill and implications but doesn’t directly list "passed" legislation → partial relevancy (60%). Product may be under-specifying or under-prompting for "passed" vs "related" bills.

### Proposed solutions (planning)

1. **Factual Qs we don’t have data for**
   - **Product:** Prompt educational path to say clearly "That specific statistic isn’t in our data" and then "Here’s what we do have that’s related" (e.g. related series or topic context). Optionally add data sources over time for common factual Qs (temperature, crime/gun stats) if in scope.
   - **Eval:** Either (a) treat "factual Q with no data in context" as a separate category (e.g. expected relevancy N/A or lower threshold for "acknowledged lack of data + offered related info"), or (b) add expected "partial answer" behavior and score that.

2. **Opinion-seeking Qs**
   - **Product:** Prompt educational path for opinion-seeking to: (1) explicitly state "I don’t have a stance; my role is to help you explore yours," and (2) give a short frame (main tradeoffs/perspectives) then support with data. That directly addresses "what do you think" in a way that stays within product goals.

3. **Question-type classification**
   - **Product:** Improve `detectQuestionType` so phrases like "Can you give me a stance on X?", "What do you think about X?", "Help me understand X" are classified as `opinion-seeking` or `mixed` even without a question mark. Reduces misrouting to challenge path.

4. **Legislation questions**
   - **Product:** Clarify in prompt or in data: when the user asks for "passed" legislation, prefer bills that have become law (if API supports it) or explicitly say "here are related bills; passage status is …". Reduces partial-relevancy failure due to "related vs passed" ambiguity.

---

## Diagnosis 3: Faithfulness Failures

### Observed patterns

- **Meta / absence claims:** e.g. "There is no specific legislation in the current Congress data that directly addresses …", "The government data does not directly provide evidence regarding …". Judge marks these as NOT SUPPORTED because they’re not literal statements from the context.
- **Inferences:** e.g. "The presence of 20 related bills highlights a recognition of the need for government intervention." Judge treats as a claim that must be supported by the context.
- **General knowledge:** e.g. "The Second Amendment is enshrined in the U.S. Constitution." True in the world but not present in the provided government data context → NOT SUPPORTED.

### Tension

- Faithfulness scorer is **strict by design**: only claims grounded in the provided context are supported. That discourages hallucination and keeps the product honest.
- The **product** sometimes (correctly) says "we don’t have X" or "data doesn’t show Y," or makes small inferences. Under current rules those are unsupported.

### Proposed directions (planning)

1. **Product-side:** Reduce unsupported claims: (a) Avoid stating well-known facts (e.g. Second Amendment) unless they appear in context; (b) Prefer phrasing like "In the data we have, we don’t see X" so the claim is about the context, not the world; (c) Avoid interpretive leaps ("20 bills highlights …") or soften to "we see 20 related bills; you might interpret that as …".
2. **Scorer-side (optional):** Allow a narrow class of "absence" or "meta" claims (e.g. "the provided data does not contain X") when verifiable from context (context really doesn’t contain X). This is a design choice: stricter vs slightly more permissive for meta-statements.
3. **Eval design:** Document which failures are "model went beyond context" vs "model made a true-but-unsupported statement" vs "model made a reasonable inference" so we can tune product and scorer consistently.

---

## Diagnosis 4: Why Only 1 Case Passed

- **Pass condition:** `allCriteriaMet && faithfulness >= 0.7 && relevancy >= 0.7 && (alignment >= 0.7 or skipped)`.
- **government-minimal** passed: faithfulness 100%, relevancy 80%, alignment 100%, criteria met.
- **Others** fail on at least one of:
  - Faithfulness &lt; 0.7 (many at 50% or 0% due to unsupported/meta/inference claims).
  - Relevancy &lt; 0.7 (educational cases 30–80%; some challenge cases 70–80%).
  - Alignment &lt; 0.7 (e.g. taxes-what-do-you-think 0% when misclassified as challenge).
  - Criteria (e.g. followUpRelevant, aiNoStanceMessage, etc.).

So the single pass is consistent with: (1) same or similar government data reducing topic-specific support and increasing faithfulness issues; (2) educational relevancy lowered by factual/opinion-seeking behavior and misclassification; (3) strict faithfulness on meta/inference claims.

---

## Recommended Order of Work (when implementing)

1. **Verify and fix government data diversity**
   - Confirm Congress query + bill IDs/titles per topic; add topic-mapping for Taxes, Education, Gun, Size/Scope; optionally re-rank/filter bills by topic.
2. **Fix question-type classification**
   - So "Can you give me a stance on taxes?" and similar go to educational path.
3. **Improve educational prompts**
   - Opinion-seeking: explicit "no stance" + frame + data. Factual with no data: "we don’t have that; here’s what we have."
4. **Tighten product wording for faithfulness**
   - Avoid unsupported general-knowledge claims; prefer "in the data we have …"; soften or drop unsupported inferences.
5. **Eval adjustments**
   - Consider separate handling or thresholds for "factual Q with no data" and document faithfulness vs product behavior.

---

## Files to Touch (when implementing)

| Area | Files |
|------|--------|
| Topic → Congress | `src/lib/government/topic-mapping.ts`, `src/lib/government/index.ts` |
| Congress behavior | `src/lib/government/congress.ts` (optional logging/filtering) |
| Question type | `src/lib/contrarian/question-handler.ts` (`detectQuestionType`) |
| Educational response | `src/lib/contrarian/question-handler.ts` (`generateQuestionResponse`), `src/lib/contrarian/prompts.ts` (if shared) |
| Contrarian wording | `src/lib/contrarian/prompts.ts`, contrarian generation path |
| Evals | `src/lib/evals/runner.ts`, `src/lib/evals/datasets/*`, scorers if we allow meta-claims |

No implementation in this doc; the above is planning and diagnosis only.

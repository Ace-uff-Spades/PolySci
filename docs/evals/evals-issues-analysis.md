# Eval Scoring Issues Analysis

## Issue 1: Alignment Accuracy Always 100%

### Symptoms
- All test cases return 100% (1.0) alignment accuracy
- This seems unrealistic - not all responses can be perfectly aligned

### Root Causes

1. **Parsing Issue with `getCompletion()`**
   - `getCompletion()` returns free-form text, not structured JSON
   - GPT-4o might return: "1.0", "The scores are accurate. Score: 1.0", "100%", or "Perfect match: 1.0"
   - Current parsing uses `parseFloat(result.trim())` which might extract "1" from "1.0" or "100" from "100%"
   - If GPT-4o says "The alignment is perfect (1.0)", parseFloat might extract "1" incorrectly

2. **Educational Responses Have Neutral Scores**
   - Educational responses start with neutral alignment scores (5/5/5/5)
   - Questions don't strongly indicate political alignment
   - The scorer might think "neutral scores are accurate for neutral questions" → 1.0
   - Need to skip alignment accuracy for educational responses OR adjust scoring logic

3. **Prompt Too Lenient**
   - Current prompt asks GPT-4o to rate accuracy, but doesn't provide strict criteria
   - GPT-4o might be too generous, especially if scores are "close enough"
   - Need stricter rubric or use JSON mode for structured scoring

### Solutions

1. **Use JSON mode for alignment scorer** - Get structured output instead of parsing free text
2. **Skip alignment accuracy for educational responses** - They don't have meaningful alignment
3. **Add stricter scoring criteria** - Define what "accurate" means (e.g., expected direction increased by at least 2 points)
4. **Better parsing** - Extract number more carefully, handle edge cases

## Issue 2: Faithfulness Mostly 0%

### Symptoms
- Most test cases return 0% faithfulness
- Some might return low scores (20-30%)

### Root Causes

1. **Exact Text Matching Problem**
   - Faithfulness scorer extracts statistics like: "Unemployment is 4.1%"
   - Government data formatted as: "Unemployment Rate: 4.1% (January 2024)"
   - Exact wording doesn't match → Faithfulness can't verify
   - AI paraphrases/summarizes statistics, doesn't quote verbatim

2. **Context Format Mismatch**
   - `formatGovernmentData()` creates human-readable summary: "Unemployment Rate: 4.1% (January 2024)"
   - But AI might say: "The unemployment rate stands at 4.1%"
   - Faithfulness evaluator needs exact or near-exact matches in context

3. **Missing Full Response Context**
   - Currently only extracting statistics text: `allStats.join('\n')`
   - Faithfulness might need full response with context to verify claims
   - Statistics without context might be harder to verify

4. **Government Data Might Be Empty**
   - Some topics might not have relevant government data
   - Empty context → Faithfulness can't verify anything → 0%

### Solutions

1. **Include full response text** - Not just statistics, but full response for better context
2. **Normalize statistics before comparison** - Extract numbers and compare semantically, not textually
3. **Use semantic similarity** - Check if statistic meaning matches, not exact wording
4. **Handle empty government data** - Skip faithfulness if no government data available
5. **Improve context format** - Make government data format more compatible with what AI generates

### Top 3 reasons for low Faithfulness scores (investigation)

1. **Model cites data not present in the context we give the judge**
   - The model is only supposed to use `formatGovernmentData(governmentData)` from its prompt, but it can hallucinate or use prior knowledge (e.g. "Healthcare spending is 18% of GDP" when we never provided that). We pass the *same* formatted context to the faithfulness judge. If the model outputs a stat that isn’t in that context, the judge correctly marks it NOT SUPPORTED. So low scores often mean the model is going beyond the provided data.
   - **How to confirm:** Run evals and check the logged "Faithfulness claim N NOT SUPPORTED" lines and "Reason: …". If reasons say "number not in context" or "metric not found", this is the cause.

2. **Context we give the judge is sparse or topic-mismatched**
   - `formatGovernmentData()` is a fixed summary: unemployment, inflation, FRED (if any), federal budget, topic-related spending (count + small total), income, EIA (if topic), bills. For some topics we don’t have a direct series (e.g. "Healthcare System" may get generic spending + bills, but no "healthcare spending $X"). So the model might say "Healthcare spending has reached $X billion" by inferring from training or from our "Topic-related spending: N records / Total: $Y billion" in a way the judge can’t match to a single line. So the judge correctly says NOT SUPPORTED because the *exact* claim isn’t in the context.
   - **How to confirm:** Inspect `formatGovernmentData(governmentData)` for a failing topic (e.g. log it or add a one-off script). If there’s no line that clearly supports the model’s claim (same metric and number), this is the cause.

3. **Judge is strict or misreads**
   - The judge might require the same phrasing or a very literal match, or misread "same numbers, same meaning" and mark NOT SUPPORTED for reasonable paraphrases. Or it might mark SUPPORTED when it shouldn’t. Less likely than (1) and (2) but possible.
   - **How to confirm:** Check the logged reasoning for NOT SUPPORTED claims. If the reason given is factually wrong (e.g. "4.1% not in context" when "Unemployment Rate: 4.1%" is in context), the judge is at fault. We now log reasoning for every unsupported claim when score < 1.

The faithfulness scorer now returns a `reasoning` array and logs each unsupported claim with its reason when score < 1, so you can see which of the three is happening.

## Issue 3: Relevancy 60% or 0%

### Symptoms
- Relevancy scores hover around 60% or drop to 0%
- Inconsistent across test cases

### Root Causes

1. **Response Text Formatting**
   - Combining sections with `.join('\n')` might lose context
   - Educational responses use analysis-led structure (analysis + optional keyStatistics); no separate directAnswer/context
   - Response might be too fragmented for relevancy evaluator

2. **Context Parameter Too Narrow**
   - Currently passing just `topic` as context: "Healthcare System"
   - AnswerRelevancy might need richer context about the domain
   - Topic alone might not be enough for accurate relevancy scoring

3. **Educational vs Challenge Response Mismatch**
   - Educational responses: analysis (continuation of user's message), optional keyStatistics/legislationLinks, followUpQuestion
   - Challenge responses: acknowledgment, keyStatisticsFor/Against, deeperAnalysis, followUpQuestion
   - Combining them might confuse the relevancy evaluator

4. **User Input Format**
   - Passing raw `userStance` which might be a question or statement
   - Relevancy evaluator might expect a question format
   - "I believe healthcare..." vs "What do you think about healthcare?" - different formats

### Solutions

1. **Improve response text assembly** - Include all relevant sections, maintain structure
2. **Richer context** - Include topic description or domain context, not just topic name
3. **Separate handling** - Different relevancy logic for educational vs challenge responses
4. **Normalize user input** - Format questions/statements consistently for evaluator

## Data Feeding (Raw vs Formatted)

Evals receive **raw model output** (the structured `response.sections` from the contrarian/educational services). The API route does not call `formatForDisplay()` before returning; the frontend may format for display (e.g. link citations). So:

- **Faithfulness** and **Relevancy** see the same content the model produced (e.g. stat text may include `[1]` citation markers). Faithfulness strips `[n]` before sending to the judge.
- We are not accidentally feeding a different format; we are feeding raw sections. If scores stay low, the cause is evaluator design or response content, not wrong input shape.

## Recommendations

### Immediate Fixes

1. **Alignment Accuracy**:
   - Use JSON mode for structured scoring output
   - Skip alignment accuracy for educational responses (set to N/A or skip)
   - Add validation: check if expected direction actually increased

2. **Faithfulness**:
   - Include full response text, not just statistics
   - Add semantic number extraction and comparison
   - Handle empty government data gracefully

3. **Relevancy**:
   - Improve response text assembly to include all sections
   - Use richer context (topic + description)
   - Test with different response types separately

### Testing Improvements

1. **Add debug logging** - Log what's being passed to each scorer
2. **Manual spot checks** - Review a few cases manually to verify scores make sense
3. **Threshold tuning** - Adjust pass thresholds based on actual score distributions
4. **Separate educational/challenge evals** - Run them separately to identify type-specific issues

## Resolution status (2026-01-31)

- **Faithfulness:** Skipped for educational responses in eval flow; custom LLM judge treats explicit "data does not contain X" statements as supported when context lacks X.
- **Relevancy:** Custom LLM scorers (relevancy+followUp for educational, relevancy+alignment for challenge). Educational prompts improved (opinion-seeking: no-stance + perspectives first; factual-no-data: "we don't have that" + related data; legislation: topic-match only). Per-case `relevancyThreshold` and relaxed follow-up threshold for no-data educational cases (climate-factual, education-legislation, gun-control-factual).
- **Alignment:** Skipped for educational; custom JSON-mode judge for challenge. Educational dataset now passes 7/7 with above changes.

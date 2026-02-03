# The Contrarian Fixes - Alternative Architecture (JSON Mode + Two-Stage Pipeline)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all The Contrarian response issues using JSON Mode for reliable parsing and a two-stage pipeline for balanced responses.

**Architecture:** Use OpenAI's JSON mode for structured output (eliminates parsing issues), implement two-stage pipeline (stance analysis → challenge), and add smart data fetching for legislation queries.

**Tech Stack:** OpenAI GPT-4o with JSON mode, TypeScript, Next.js API routes

---

## Why This Architecture is Better

### Problems with Subagent Router Approach:
1. **Routing complexity**: Need to classify input type, handle edge cases, maintain routing logic
2. **Multiple agents**: More API calls, higher latency, more complex state management
3. **Still need parsing**: Even with subagents, still parsing markdown/text responses

### Benefits of JSON Mode + Two-Stage Pipeline:
1. **Zero parsing issues**: JSON mode guarantees structured output, no regex needed
2. **Simpler flow**: Always do stance analysis first, then challenge (no routing)
3. **Single agent per stage**: Two sequential calls, clear separation of concerns
4. **Reliable**: JSON schema enforcement means we always get valid structure
5. **Easier to debug**: Structured JSON is easier to inspect than parsed markdown

## Architecture Overview

```
User Input
    ↓
Input Classification (Simple: Question vs Stance)
    ├─→ Educational Question? → Educational Agent (JSON Mode)
    │   ├─→ Detect legislation keywords
    │   ├─→ Fetch Congress.gov bills if needed
    │   ├─→ Answer question with data
    │   └─→ Guide toward stance
    │
    └─→ Stance? → Two-Stage Pipeline
        ├─→ Stage 1: Stance Analysis (JSON Mode)
        │   ├─→ Analyze user stance merits
        │   ├─→ Find supporting statistics
        │   └─→ Generate acknowledgment
        │
        └─→ Stage 2: The Contrarian challenge (JSON Mode)
            ├─→ Use acknowledgment from Stage 1
            ├─→ Generate dual statistics (for/against)
            └─→ Generate challenge
    ↓
Response (JSON)
    └─→ Display in UI
```

### Educational Questions Handling

**Key Point**: Educational questions use a **single JSON-mode agent** (not the two-stage pipeline), but still benefit from:
- JSON mode for reliable structure
- Smart data fetching (legislation detection)
- Same response format as challenges (for UI consistency)

**Flow for Educational Questions:**
1. Detect if input is educational (question mark, question words, or GPT classification)
2. If legislation-related: Fetch Congress.gov bills
3. Single JSON-mode agent answers question with:
   - Direct answer
   - Relevant data/statistics
   - Legislation links (if applicable)
   - Follow-up question to guide toward stance
4. Return structured JSON response

## Implementation Plan

### Phase 1: Switch to JSON Mode

**Task 1.1: Define JSON Schemas (Stance Analysis, Challenge, Educational)**

**Files:**
- Create: `src/lib/contrarian/schemas.ts`

**Step 1: Create schema file with all three schemas**

```typescript
// Schema for stance analysis (Stage 1 of two-stage pipeline)
export const stanceAnalysisSchema = {
  type: "object",
  properties: {
    acknowledgment: {
      type: "string",
      description: "1-2 sentences acknowledging why the user's stance has merit"
    },
    supportingStatistics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: "number", nullable: true }
        },
        required: ["text"]
      },
      maxItems: 1,
      description: "Exactly 1 statistic that supports the user's stance"
    },
    validPoints: {
      type: "array",
      items: { type: "string" },
      maxItems: 3,
      description: "Key valid points in the user's stance"
    }
  },
  required: ["acknowledgment", "supportingStatistics", "validPoints"]
} as const;

export const contrarianChallengeSchema = {
  type: "object",
  properties: {
    acknowledgment: {
      type: "string",
      description: "Brief acknowledgment (can reuse from stance analysis)"
    },
    statisticsFor: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: "number", nullable: true }
        },
        required: ["text"]
      },
      maxItems: 1,
      description: "Exactly 1 statistic supporting the user's stance"
    },
    statisticsAgainst: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: "number", nullable: true }
        },
        required: ["text"]
      },
      maxItems: 1,
      description: "Exactly 1 statistic challenging the user's stance"
    },
    deeperAnalysis: {
      type: "string",
      description: "2-3 sentences of contextual analysis"
    },
    followUpQuestion: {
      type: "string",
      description: "One probing question to help user think deeper"
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "number" },
          name: { type: "string" },
          url: { type: "string" }
        },
        required: ["number", "name", "url"]
      }
    }
  },
  required: ["acknowledgment", "statisticsFor", "statisticsAgainst", "deeperAnalysis", "followUpQuestion", "sources"]
} as const;

// Schema for educational questions (factual questions, legislation queries)
export const educationalResponseSchema = {
  type: "object",
  properties: {
    directAnswer: {
      type: "string",
      description: "Direct answer to the user's question (2-3 sentences)"
    },
    keyStatistics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          citation: { type: "number", nullable: true }
        },
        required: ["text"]
      },
      maxItems: 3,
      description: "Relevant statistics or data points"
    },
    legislationLinks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          description: { type: "string", nullable: true }
        },
        required: ["title", "url"]
      },
      description: "Relevant legislation/bills (if question is about legislation)"
    },
    context: {
      type: "string",
      description: "Brief context about why this matters (1-2 sentences)"
    },
    followUpQuestion: {
      type: "string",
      description: "Question to guide user toward stating their stance"
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "number" },
          name: { type: "string" },
          url: { type: "string" }
        },
        required: ["number", "name", "url"]
      }
    }
  },
  required: ["directAnswer", "keyStatistics", "context", "followUpQuestion", "sources"]
} as const;
```

**Step 2: Commit**

```bash
git add src/lib/contrarian/schemas.ts
git commit -m "feat: add JSON schemas for stance analysis and contrarian challenge"
```

**Task 1.2: Update OpenAI Client to Support JSON Mode**

**Files:**
- Modify: `src/lib/openai.ts`

**Step 1: Add JSON mode helper function**

```typescript
export async function getJSONCompletion<T>(
  systemPrompt: string,
  userMessage: string,
  schema: any
): Promise<T> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'response', schema } },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content) as T;
}
```

**Step 2: Test JSON mode works**

Run: `npm test` (if tests exist)
Expected: Tests pass, JSON parsing works

**Step 3: Commit**

```bash
git add src/lib/openai.ts
git commit -m "feat: add JSON mode support to OpenAI client"
```

**Task 1.3: Create Stance Analysis Service**

**Files:**
- Create: `src/lib/contrarian/stance-analysis.ts`

**Step 1: Write the service**

```typescript
import { getJSONCompletion } from '../openai';
import { stanceAnalysisSchema } from './schemas';
import { GovernmentData } from '../government';
import { formatGovernmentData } from './prompts';

export interface StanceAnalysisResult {
  acknowledgment: string;
  supportingStatistics: Array<{ text: string; citation?: number }>;
  validPoints: string[];
}

export async function analyzeStance(
  topic: string,
  userStance: string,
  governmentData: GovernmentData
): Promise<StanceAnalysisResult> {
  const systemPrompt = `You are analyzing a user's political stance to identify its merits and valid points.
Your goal is to acknowledge why their stance has merit before any challenge occurs.

CRITICAL:
- Be genuine and specific in your acknowledgment
- Find real statistics that support their position
- Identify 1-3 valid points in their stance
- Keep acknowledgment to 1-2 sentences
- Return exactly 1 supporting statistic with citation if available`;

  const govDataSummary = formatGovernmentData(governmentData);
  
  const userPrompt = `Analyze this user's stance on "${topic}":

USER'S STANCE:
${userStance}

GOVERNMENT DATA:
${govDataSummary}

Identify:
1. Why this stance has merit (acknowledgment)
2. 1 statistic that supports their position
3. 1-3 valid points in their stance

Return as JSON matching the schema.`;

  return getJSONCompletion<StanceAnalysisResult>(
    systemPrompt,
    userPrompt,
    stanceAnalysisSchema
  );
}
```

**Step 2: Commit**

```bash
git add src/lib/contrarian/stance-analysis.ts
git commit -m "feat: add stance analysis service with JSON mode"
```

**Task 1.4: Update The Contrarian Service for JSON Mode**

**Files:**
- Modify: `src/lib/contrarian/index.ts`

**Step 1: Update imports and types**

```typescript
import { getJSONCompletion } from '../openai';
import { contrarianChallengeSchema } from './schemas';
import { analyzeStance, StanceAnalysisResult } from './stance-analysis';
```

**Step 2: Update generateContrarianChallenge to use two-stage pipeline**

```typescript
export async function generateContrarianChallenge(
  context: ContrarianContext,
  userStance: string
): Promise<ContrarianChallengeResponse> {
  // Stage 1: Analyze stance merits
  const stanceAnalysis = await analyzeStance(
    context.topic,
    userStance,
    context.governmentData
  );

  // Determine opposing lens
  const opposingLens = determineOpposingLens(context.alignmentScores);

  // Stage 2: Generate challenge with dual statistics
  const systemPrompt = buildContrarianSystemPrompt(opposingLens, context.topic);
  const userPrompt = buildContrarianUserPrompt(
    context.topic,
    userStance,
    context.governmentData,
    context.conversationHistory,
    stanceAnalysis // Pass stance analysis results
  );

  // Use JSON mode for structured output
  const challenge = await getJSONCompletion<{
    acknowledgment: string;
    statisticsFor: Array<{ text: string; citation?: number }>;
    statisticsAgainst: Array<{ text: string; citation?: number }>;
    deeperAnalysis: string;
    followUpQuestion: string;
    sources: Array<{ number: number; name: string; url: string }>;
  }>(
    systemPrompt,
    userPrompt,
    contrarianChallengeSchema
  );

  // Update scores
  const updatedScores = await updateScores(
    context.alignmentScores,
    userStance,
    context.topic
  );

  return {
    type: 'challenge',
    sections: {
      acknowledgment: challenge.acknowledgment,
      keyStatisticsFor: challenge.statisticsFor,
      keyStatisticsAgainst: challenge.statisticsAgainst,
      deeperAnalysis: challenge.deeperAnalysis,
      followUpQuestion: challenge.followUpQuestion,
    },
    updatedScores,
    sources: challenge.sources,
  };
}
```

**Step 3: Update ContrarianChallengeResponse interface**

```typescript
export interface ContrarianChallengeResponse {
  type: 'challenge' | 'question-response';
  sections: {
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    followUpQuestion: string;
  };
  updatedScores: AlignmentScores;
  sources: Array<{ number: number; name: string; url: string }>;
}
```

**Step 4: Commit**

```bash
git add src/lib/contrarian/index.ts
git commit -m "feat: update contrarian challenge to use JSON mode and two-stage pipeline"
```

### Phase 2: Remove Response Parser (No Longer Needed)

**Task 2.1: Simplify Response Formatter**

**Files:**
- Modify: `src/lib/contrarian/response-formatter.ts`

**Step 1: Simplify to just format for display (no parsing needed)**

```typescript
import { Source } from '../analysis/sources';

export interface FormattedResponse {
  sections: {
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    followUpQuestion: string;
  };
  sources: Source[];
}

/**
 * Formats structured response for display
 * Links citations in statistics
 */
export function formatForDisplay(
  sections: {
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    followUpQuestion: string;
  },
  sources: Source[]
): FormattedResponse {
  // Link citations in statistics
  const linkCitations = (stats: Array<{ text: string; citation?: number }>) => {
    return stats.map(stat => {
      if (stat.citation) {
        const source = sources.find(s => s.number === stat.citation);
        if (source) {
          const linkedText = stat.text.replace(
            `[${stat.citation}]`,
            `[${stat.citation}](${source.url} "${source.name}")`
          );
          return { ...stat, text: linkedText };
        }
      }
      return stat;
    });
  };

  return {
    sections: {
      ...sections,
      keyStatisticsFor: sections.keyStatisticsFor 
        ? linkCitations(sections.keyStatisticsFor) 
        : undefined,
      keyStatisticsAgainst: sections.keyStatisticsAgainst 
        ? linkCitations(sections.keyStatisticsAgainst) 
        : undefined,
    },
    sources,
  };
}
```

**Step 2: Remove parseStructuredResponse and processContrarianResponse functions**

Delete those functions - no longer needed with JSON mode.

**Step 3: Commit**

```bash
git add src/lib/contrarian/response-formatter.ts
git commit -m "refactor: simplify response formatter (remove parsing, JSON mode handles it)"
```

### Phase 3: Smart Data Fetching for Legislation Queries

**Task 3.1: Enhance Congress.gov Search**

**Files:**
- Modify: `src/lib/government/congress.ts`

**Step 1: Add function to search bills by question keywords**

```typescript
export async function searchBillsForQuestion(
  topic: string,
  question: string
): Promise<Bill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  
  if (!apiKey) {
    return [];
  }

  // Extract keywords from question
  const questionKeywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !['what', 'have', 'there', 'been', 'previous', 'legislation', 'to', 'fight', 'against'].includes(word)
    )
    .slice(0, 3); // Top 3 keywords

  // Combine topic and question keywords
  const searchQuery = [topic, ...questionKeywords].join(' ');

  return searchBills(searchQuery);
}
```

**Step 2: Add function to format bills as markdown links**

```typescript
export function formatBillsAsLinks(bills: Bill[]): string {
  return bills
    .slice(0, 5) // Limit to 5 bills
    .map((bill, idx) => {
      const billUrl = `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.type.toLowerCase()}/${bill.number}`;
      return `[${bill.number}: ${bill.title}](${billUrl})`;
    })
    .join('\n');
}
```

**Step 3: Commit**

```bash
git add src/lib/government/congress.ts
git commit -m "feat: add smart bill search for legislation questions"
```

**Task 3.2: Convert Question Handler to JSON Mode**

**Files:**
- Modify: `src/lib/contrarian/question-handler.ts`

**Step 1: Update imports and add legislation detection**

```typescript
import { getJSONCompletion } from '../openai';
import { educationalResponseSchema } from './schemas';
import { searchBillsForQuestion } from '../government/congress';
import { ContrarianContext } from './index';
import { formatGovernmentData } from './prompts';

function isLegislationQuestion(question: string): boolean {
  const legislationKeywords = [
    'legislation', 'bill', 'law', 'passed', 'congress', 
    'act', 'legislative', 'statute', 'legislature'
  ];
  const lowerQuestion = question.toLowerCase();
  return legislationKeywords.some(keyword => lowerQuestion.includes(keyword));
}
```

**Step 2: Update generateQuestionResponse to use JSON mode**

```typescript
export interface EducationalResponse {
  directAnswer: string;
  keyStatistics: Array<{ text: string; citation?: number }>;
  legislationLinks: Array<{ title: string; url: string; description?: string }>;
  context: string;
  followUpQuestion: string;
  sources: Array<{ number: number; name: string; url: string }>;
}

export async function generateQuestionResponse(
  question: string,
  topic: string,
  context: ContrarianContext
): Promise<EducationalResponse> {
  // Check if this is a legislation question and fetch bills
  let legislationBills: Array<{ title: string; url: string; description?: string }> = [];
  if (isLegislationQuestion(question)) {
    try {
      const bills = await searchBillsForQuestion(topic, question);
      legislationBills = bills.slice(0, 5).map(bill => ({
        title: `${bill.number}: ${bill.title}`,
        url: `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.type.toLowerCase()}/${bill.number}`,
        description: bill.latestAction?.text
      }));
    } catch (error) {
      console.error('Failed to fetch legislation:', error);
    }
  }

  const systemPrompt = `You are helping a user learn about "${topic}" through factual questions.
Your goal is to:
- Answer their question directly with accurate data
- Provide relevant statistics with citations
- Include legislation links if provided
- Guide them toward stating their stance with a follow-up question
- Keep response concise and educational
- Return valid JSON matching the schema`;

  const govDataSummary = formatGovernmentData(context.governmentData);
  
  let legislationText = '';
  if (legislationBills.length > 0) {
    legislationText = `\n\nRELEVANT LEGISLATION FOUND:\n${legislationBills.map(b => `- ${b.title}`).join('\n')}`;
  }

  const userPrompt = `The user asked a question about "${topic}":

USER'S QUESTION:
${question}

GOVERNMENT DATA:
${govDataSummary}${legislationText}

Provide:
1. Direct answer to their question
2. Relevant statistics (with citations)
3. Legislation links (if provided above)
4. Brief context about why this matters
5. Follow-up question to guide them toward stating their stance

Return valid JSON matching the schema.`;

  return getJSONCompletion<EducationalResponse>(
    systemPrompt,
    userPrompt,
    educationalResponseSchema
  );
}
```

**Step 3: Update QuestionResponse interface**

```typescript
export interface QuestionResponse {
  type: 'educational';
  sections: {
    directAnswer: string;
    keyStatistics: Array<{ text: string; citation?: number }>;
    legislationLinks?: Array<{ title: string; url: string; description?: string }>;
    context: string;
    followUpQuestion: string;
  };
  sources: Array<{ number: number; name: string; url: string }>;
}
```

**Step 4: Update API route to handle educational responses**

The route should check if response is educational and format accordingly.

**Step 5: Commit**

```bash
git add src/lib/contrarian/question-handler.ts
git commit -m "feat: add legislation detection and data fetching for questions"
```

### Phase 4: Update Prompts for JSON Mode

**Task 4.1: Update Contrarian System Prompt**

**Files:**
- Modify: `src/lib/contrarian/prompts.ts`

**Step 1: Update buildContrarianSystemPrompt for JSON mode**

```typescript
export function buildContrarianSystemPrompt(
  opposingLens: PoliticalLens,
  topic: string
): string {
  const lensDescriptions: Record<PoliticalLens, string> = {
    // ... existing descriptions
  };

  return `You are a quantitative political contrarian. Your PRIMARY GOAL is to help users strengthen their political stances through rigorous, data-driven challenge.

You are challenging from a ${opposingLens} perspective on the topic: "${topic}"

${lensDescriptions[opposingLens]}

CRITICAL GUIDELINES:
- You will receive stance analysis results that acknowledge the user's position
- Use that acknowledgment, then present balanced challenge
- Provide exactly 1 statistic FOR the user's stance (supporting it)
- Provide exactly 1 statistic AGAINST the user's stance (challenging it)
- Keep total response concise (acknowledgment: 1-2 sentences, analysis: 2-3 sentences)
- Always cite sources using [n] notation
- Ask ONE probing follow-up question

You MUST return valid JSON matching the provided schema.`;
}
```

**Step 2: Update buildContrarianUserPrompt to include stance analysis**

```typescript
export function buildContrarianUserPrompt(
  topic: string,
  userStance: string,
  governmentData: GovernmentData,
  conversationHistory: ContrarianMessage[],
  stanceAnalysis?: StanceAnalysisResult
): string {
  const govDataSummary = formatGovernmentData(governmentData);
  
  let historyText = '';
  if (conversationHistory.length > 0) {
    historyText = '\n\nCONVERSATION HISTORY:\n';
    conversationHistory.slice(-5).forEach((msg) => {
      historyText += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n`;
    });
  }

  let stanceAnalysisText = '';
  if (stanceAnalysis) {
    stanceAnalysisText = `\n\nSTANCE ANALYSIS (acknowledge these points):
- Valid points: ${stanceAnalysis.validPoints.join(', ')}
- Supporting statistic: ${stanceAnalysis.supportingStatistics[0]?.text || 'None'}
Use this to craft your acknowledgment.`;
  }

  return `Help strengthen this user's stance on "${topic}" through data-driven challenge:

USER'S STANCE:
${userStance}

GOVERNMENT DATA:
${govDataSummary}${historyText}${stanceAnalysisText}

IMPORTANT:
- Acknowledge the user's stance merits first (use stance analysis above)
- Then provide balanced challenge with dual statistics
- Return valid JSON matching the schema`;
}
```

**Step 3: Add import for StanceAnalysisResult**

```typescript
import { StanceAnalysisResult } from './stance-analysis';
```

**Step 4: Commit**

```bash
git add src/lib/contrarian/prompts.ts
git commit -m "feat: update prompts for JSON mode and two-stage pipeline"
```

### Phase 5: Update UI Components

**Task 5.1: Update ContrarianResponse Component for Dual Statistics**

**Files:**
- Modify: `src/components/ContrarianResponse.tsx`

**Step 1: Update interface and component**

```typescript
interface ContrarianResponseProps {
  sections: {
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    followUpQuestion: string;
  };
  sources: Source[];
}

export function ContrarianResponse({ sections, sources }: ContrarianResponseProps) {
  return (
    <div className="space-y-4">
      {/* Acknowledgment */}
      {sections.acknowledgment && (
        <div className="pb-3 border-b border-[#D6D3D1]">
          <p className="text-[#1C1917] leading-relaxed italic">
            {sections.acknowledgment}
          </p>
        </div>
      )}

      {/* Statistics FOR User's Stance */}
      {sections.keyStatisticsFor && sections.keyStatisticsFor.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#6B8E6F] mb-2">
            Statistics Supporting Your Stance
          </h4>
          <ul className="space-y-2 list-none">
            {sections.keyStatisticsFor.map((stat, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#6B8E6F] mr-2 mt-1">•</span>
                <div className="flex-1">
                  <ReactMarkdown
                    components={{
                      a: (props) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6B8E6F] hover:text-[#475569] underline font-medium"
                        />
                      ),
                    }}
                  >
                    {stat.text}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistics AGAINST User's Stance */}
      {sections.keyStatisticsAgainst && sections.keyStatisticsAgainst.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#F59E0B] mb-2">
            Statistics Challenging Your Stance
          </h4>
          <ul className="space-y-2 list-none">
            {sections.keyStatisticsAgainst.map((stat, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#F59E0B] mr-2 mt-1">•</span>
                <div className="flex-1">
                  <ReactMarkdown
                    components={{
                      a: (props) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F59E0B] hover:text-[#D97706] underline font-medium"
                        />
                      ),
                    }}
                  >
                    {stat.text}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deeper Analysis */}
      {sections.deeperAnalysis && (
        <div className="pt-3 border-t border-[#D6D3D1]">
          <h4 className="text-sm font-semibold text-[#1C1917] mb-2">
            Analysis
          </h4>
          <p className="text-[#1C1917] leading-relaxed">
            {sections.deeperAnalysis}
          </p>
        </div>
      )}

      {/* Follow-up Question */}
      <div className="pt-3 border-t border-[#D6D3D1]">
        <h4 className="text-sm font-semibold text-[#1C1917] mb-2">
          Question for You
        </h4>
        <p className="text-[#1C1917] leading-relaxed font-medium">
          {sections.followUpQuestion}
        </p>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#D6D3D1]">
          <h4 className="text-xs font-semibold text-[#1C1917] mb-2">Sources</h4>
          <ul className="space-y-1">
            {sources.map((source) => (
              <li key={source.number} className="text-xs">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6B8E6F] hover:text-[#475569] underline font-medium"
                >
                  {source.number}. {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ContrarianResponse.tsx
git commit -m "feat: update ContrarianResponse for dual statistics sections"
```

**Task 5.2: Update Loading Message**

**Files:**
- Modify: `src/components/ContrarianChallenge.tsx`

**Step 1: Change loading message**

Line 323: Change `"AI is challenging your view..."` to `"the AI is thinking"`

**Step 2: Commit**

```bash
git add src/components/ContrarianChallenge.tsx
git commit -m "fix: update loading message to 'the AI is thinking'"
```

**Task 5.3: Update API Route for Input Classification**

**Files:**
- Modify: `src/app/api/contrarian/challenge/route.ts`

**Step 1: Add input classification logic**

```typescript
import { detectQuestionType } from '@/lib/contrarian/question-handler';
import { generateQuestionResponse } from '@/lib/contrarian/question-handler';
import { generateContrarianChallenge } from '@/lib/contrarian';

export async function POST(request: NextRequest) {
  try {
    const { topic, userStance, conversationHistory, currentScores } = await request.json();

    // ... validation ...

    // Gather government data
    const governmentData = await gatherGovernmentData(topic);

    // Convert conversation history
    const history: ContrarianMessage[] = (conversationHistory || []).map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    // Create context
    const context: ContrarianContext = {
      topic,
      conversationHistory: history,
      alignmentScores: currentScores as AlignmentScores,
      governmentData,
    };

    // Classify input: Educational question vs Stance
    const questionType = await detectQuestionType(userStance, topic);

    if (questionType !== 'stance') {
      // Educational question: Single JSON-mode agent
      const educationalResponse = await generateQuestionResponse(
        userStance,
        topic,
        context
      );

      // Update scores minimally (questions don't strongly indicate alignment)
      const updatedScores = await updateScores(
        currentScores as AlignmentScores,
        userStance,
        topic
      );

      return NextResponse.json({
        type: 'educational',
        sections: {
          directAnswer: educationalResponse.directAnswer,
          keyStatistics: educationalResponse.keyStatistics,
          legislationLinks: educationalResponse.legislationLinks,
          context: educationalResponse.context,
          followUpQuestion: educationalResponse.followUpQuestion,
        },
        updatedScores,
        sources: educationalResponse.sources,
      });
    } else {
      // Stance: Two-stage pipeline
      const challengeResponse = await generateContrarianChallenge(context, userStance);
      return NextResponse.json(challengeResponse);
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

**Step 2: Test both paths**

- Test educational question: "have there been previous legislation to fight against capital flight"
- Test stance: "I think wealth taxes are unfair"

**Step 3: Commit**

```bash
git add src/app/api/contrarian/challenge/route.ts
git commit -m "feat: add input classification for educational vs stance responses"
```

### Phase 6: Clean Up and Testing

**Task 6.1: Remove Unused Parsing Code**

**Files:**
- Modify: `src/lib/contrarian/question-handler.ts`

**Step 1: Remove parseStructuredResponse calls**

Since we're using JSON mode, remove any calls to `parseStructuredResponse` or `processContrarianResponse`.

**Step 2: Update to use formatForDisplay**

```typescript
// In generateQuestionResponse, replace:
const processed = processContrarianResponse(responseText, sources);
const formatted = formatForDisplay(processed);

// With direct formatting (if question handler also uses JSON mode)
// Or keep as-is if question handler still uses text mode
```

**Step 3: Commit**

```bash
git add src/lib/contrarian/question-handler.ts
git commit -m "refactor: remove unused parsing code"
```

**Task 6.2: Update Tests**

**Files:**
- Modify: `src/lib/contrarian/*.test.ts`

**Step 1: Update tests for JSON mode**

Update any tests that mock responses to return JSON instead of markdown.

**Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/contrarian/*.test.ts
git commit -m "test: update tests for JSON mode responses"
```

**Task 6.3: Manual Testing Checklist**

- [ ] Test stance analysis: User provides stance, verify acknowledgment validates it
- [ ] Test dual statistics: Verify "For" and "Against" sections display correctly
- [ ] Test legislation question: "have there been previous legislation to fight against capital flight"
- [ ] Verify legislation links are returned and clickable
- [ ] Test loading message: Verify it says "the AI is thinking"
- [ ] Test sections don't bleed: Verify each section is separate block
- [ ] Test edge cases: Missing sections, malformed JSON (shouldn't happen with JSON mode)

## Key Advantages of This Architecture

1. **Zero Parsing Issues**: JSON mode guarantees structure, no regex needed
2. **Simpler Flow**: Two-stage pipeline is easier to understand than routing
3. **More Reliable**: JSON schema enforcement means valid responses
4. **Easier Debugging**: Structured JSON is inspectable
5. **Better UX**: Always acknowledges stance merits first, then challenges
6. **Smart Data Fetching**: Legislation questions automatically fetch bills

## Files Modified/Created

1. `src/lib/contrarian/schemas.ts` - NEW: JSON schemas
2. `src/lib/openai.ts` - Add JSON mode support
3. `src/lib/contrarian/stance-analysis.ts` - NEW: Stance analysis service
4. `src/lib/contrarian/index.ts` - Two-stage pipeline, JSON mode
5. `src/lib/contrarian/response-formatter.ts` - Simplify (remove parsing)
6. `src/lib/contrarian/prompts.ts` - Update for JSON mode and stance analysis
7. `src/lib/government/congress.ts` - Add smart bill search
8. `src/lib/contrarian/question-handler.ts` - Add legislation detection
9. `src/components/ContrarianResponse.tsx` - Dual statistics sections
10. `src/components/ContrarianChallenge.tsx` - Update loading message
11. `src/app/api/contrarian/challenge/route.ts` - Verify compatibility

## Testing Strategy

1. Unit tests for JSON schemas
2. Unit tests for stance analysis
3. Unit tests for contrarian challenge (JSON mode)
4. Integration test for two-stage pipeline
5. Manual testing of legislation question flow
6. Manual testing of dual statistics display

import { getOpenAIClient, OPENAI_MODEL_QUICK } from '../openai';

export interface ValidationResult {
  isRelevant: boolean;
  confidence: number; // 0-1
  message?: string; // Friendly redirect if off-topic
}

/**
 * Extracts keywords from a topic string
 */
export function extractTopicKeywords(topic: string): string[] {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  ]);

  const words = topic
    .toLowerCase()
    .split(/[\s\-&,]+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Also include the full topic as a keyword
  return [...new Set([...words, topic.toLowerCase()])];
}

/**
 * Checks keyword match between input and topic keywords
 * Returns a score from 0-1
 */
export function checkKeywordsMatch(input: string, keywords: string[]): number {
  const inputLower = input.toLowerCase();
  let matches = 0;
  let totalChecks = 0;

  for (const keyword of keywords) {
    totalChecks++;
    if (inputLower.includes(keyword)) {
      matches++;
    }
  }

  // Also check for partial matches (substrings)
  const inputWords = inputLower.split(/[\s\-&,]+/).filter(w => w.length > 2);
  let partialMatches = 0;
  for (const keyword of keywords) {
    for (const word of inputWords) {
      if (keyword.includes(word) || word.includes(keyword)) {
        partialMatches++;
        break;
      }
    }
  }

  // Weighted score: exact matches count more
  const exactScore = matches / totalChecks;
  const partialScore = Math.min(partialMatches / keywords.length, 0.5);
  
  return Math.min(exactScore + partialScore * 0.3, 1.0);
}

/** No-stance / uncertainty phrases — route to educational flow. Exported for question-handler. */
export const NO_STANCE_PHRASES = [
  "i don't know", "i do not know", "don't know", "idk", "not sure", "unsure", "no idea",
  "don't have a stance", "don't have an opinion", "no stance", "no opinion",
  "not sure where i stand", "unsure about", "help me", "help me understand", "help me figure out",
];

/** Normalize apostrophes/quotes so "I don't know" (curly ') matches phrase list (straight '). */
function normalizeForMatch(s: string): string {
  return s
    .replace(/\u2019/g, "'")  // RIGHT SINGLE QUOTATION MARK
    .replace(/\u2018/g, "'"); // LEFT SINGLE QUOTATION MARK
}

function isNoStanceOrUncertainty(input: string): boolean {
  const normalized = normalizeForMatch(input.toLowerCase().trim());
  if (normalized.length < 3) return false;
  return NO_STANCE_PHRASES.some(phrase => normalized.includes(phrase));
}

/**
 * Validates if user input is relevant to the selected topic
 * Uses hybrid approach: no-stance phrases first, then keyword matching, GPT-4o if ambiguous
 * @param contextQuestion - Optional last AI message; user may be answering this question (short answers like "maintaining lower taxes" are on-topic)
 */
export async function validateTopicRelevance(
  topic: string,
  userInput: string,
  contextQuestion?: string
): Promise<ValidationResult> {
  // Step 0: "I don't know" / uncertainty is always relevant — user is engaging with the topic
  if (isNoStanceOrUncertainty(userInput)) {
    return {
      isRelevant: true,
      confidence: 1,
    };
  }

  // Step 1: Keyword-based check (fast, free)
  const keywords = extractTopicKeywords(topic);
  const keywordScore = checkKeywordsMatch(userInput, keywords);

  // High confidence on-topic (>0.6) or clearly off-topic (<0.2)
  if (keywordScore >= 0.6) {
    return {
      isRelevant: true,
      confidence: keywordScore,
    };
  }

  // Ambiguous range (0.2-0.6): if input contains any core topic keyword, treat as on-topic.
  // e.g. "maintaining lower taxes" for "Taxes & Wealth Redistribution" — user is picking a side.
  const coreKeywords = keywords.filter(kw => !kw.includes(' '));
  const inputLower = userInput.toLowerCase();
  const hasCoreMatch = coreKeywords.some(kw => inputLower.includes(kw));
  if (keywordScore >= 0.2 && hasCoreMatch) {
    return {
      isRelevant: true,
      confidence: 0.7,
    };
  }

  if (keywordScore < 0.2) {
    // Very low match - likely off-topic, but use GPT for confirmation
    const gptResult = await validateWithGPT(topic, userInput, contextQuestion);
    if (!gptResult.isRelevant) {
      return {
        isRelevant: false,
        confidence: 1 - keywordScore,
        message: `I notice your response might be about a different topic. Let's stay focused on "${topic}". Could you share your stance specifically on this topic?`,
      };
    }
    return gptResult;
  }

  // Ambiguous case (0.2 - 0.6, no core keyword): Use GPT-4o for semantic analysis
  return await validateWithGPT(topic, userInput, contextQuestion);
}

/**
 * Uses GPT-4o to semantically validate topic relevance
 */
async function validateWithGPT(
  topic: string,
  userInput: string,
  contextQuestion?: string
): Promise<ValidationResult> {
  const client = getOpenAIClient();

  const contextHint = contextQuestion
    ? `\n\nContext: The user may be answering this question: "${contextQuestion}"\nShort answers that pick one option (e.g. "maintaining lower taxes", "I support redistribution") are ON-TOPIC.`
    : '';

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL_QUICK,
      messages: [
        {
          role: 'system',
          content: `You are a topic relevance validator. Determine if user input is about the given topic. Respond with ONLY "YES" or "NO" followed by a brief one-sentence reason.
Brief stance answers that pick a side on the topic (e.g. "maintaining lower taxes", "I support wealth redistribution") are ON-TOPIC. Only flag as off-topic if the user is clearly discussing something unrelated (e.g. sports, a different policy area).`,
        },
        {
          role: 'user',
          content: `Topic: "${topic}"\n\nUser Input: "${userInput}"${contextHint}\n\nIs the user input about this topic? Respond with "YES" or "NO" followed by a brief reason.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const result = response.choices[0]?.message?.content || '';
    const isRelevant = result.trim().toUpperCase().startsWith('YES');
    const confidence = isRelevant ? 0.8 : 0.9; // High confidence in GPT result

    return {
      isRelevant,
      confidence,
      message: isRelevant
        ? undefined
        : `I notice your response might be about a different topic. Let's stay focused on "${topic}". Could you share your stance specifically on this topic?`,
    };
  } catch (error) {
    console.error('GPT validation error:', error);
    // Fallback: assume relevant if GPT fails (don't block user)
    return {
      isRelevant: true,
      confidence: 0.5,
    };
  }
}

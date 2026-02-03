import { getJSONCompletion } from '../openai';
import { educationalResponseSchema } from './schemas';
import { ContrarianContext } from './index';
import { formatGovernmentData } from '../government/format';
import { NO_STANCE_PHRASES } from './validation';

export type QuestionType = 'factual' | 'opinion-seeking' | 'mixed' | 'stance';

export interface EducationalResponse {
  analysis: string;
  followUpQuestion: string;
  sources: Array<{ number: number; name: string; url: string }>;
}

export interface QuestionResponse {
  type: 'educational';
  sections: {
    analysis: string;
    followUpQuestion: string;
  };
  sources: Array<{ number: number; name: string; url: string }>;
}

/**
 * Detects if user input is a question and classifies its type
 */
// Phrases that indicate the user is asking for help or an opinion, not stating a stance
const OPINION_OR_HELP_PHRASES = [
  'give me a stance',
  'give me a position',
  'what do you think',
  'what\'s your opinion',
  'help me understand',
  'help me figure out',
  'can you help',
  'not sure where i stand',
  'don\'t know my stance',
  'don\'t know where i stand',
  'unsure about',
  'explain the different perspectives',
  'what should i be thinking',
];

export async function detectQuestionType(
  input: string,
  topic: string
): Promise<QuestionType> {
  const inputLower = input.toLowerCase().trim();
  const hasQuestionMark = inputLower.endsWith('?');
  if (NO_STANCE_PHRASES.some(phrase => inputLower.includes(phrase))) {
    return 'opinion-seeking';
  }

  // Help-seeking / opinion-seeking phrases: treat as question even without "?"
  if (OPINION_OR_HELP_PHRASES.some(phrase => inputLower.includes(phrase))) {
    // Let LLM classify as opinion-seeking or mixed; do not return stance
  } else if (!hasQuestionMark) {
    // Check for question words
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'should', 'would', 'is', 'are', 'do', 'does', 'did'];
    const startsWithQuestion = questionWords.some(word =>
      inputLower.startsWith(word) || inputLower.includes(` ${word} `)
    );

    if (!startsWithQuestion) {
      return 'stance'; // Not a question
    }
  }

  // Use cheap model for quick classification
  const { getOpenAIClient, OPENAI_MODEL_QUICK } = await import('../openai');
  const client = getOpenAIClient();
  
  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL_QUICK,
      messages: [
        {
          role: 'system',
          content: `Classify the user's input about "${topic}". Respond with ONLY one word: "factual", "opinion-seeking", "mixed", or "stance".
If they are asking for your opinion, for a stance, or for help understanding perspectives (e.g. "what do you think?", "can you give me a stance?"), use "opinion-seeking" or "mixed", not "stance". Use "stance" only when they are stating their own view, not asking for help.`,
        },
        {
          role: 'user',
          content: `User input: "${input}"\n\nTopic: "${topic}"\n\nClassify: factual (seeking data/facts), opinion-seeking (asking for opinions/views or help finding their stance), mixed (both), or stance (they are stating their own view, not asking a question)?`,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const result = (response.choices[0]?.message?.content || 'stance')
      .trim()
      .toLowerCase();
    
    if (result.includes('factual')) return 'factual';
    if (result.includes('opinion')) return 'opinion-seeking';
    if (result.includes('mixed')) return 'mixed';
    return 'stance';
  } catch (error) {
    console.error('Question detection error:', error);
    // Fallback: assume it's a question if it has question mark
    return hasQuestionMark ? 'opinion-seeking' : 'stance';
  }
}

export interface StanceDetectionResult {
  isStance: boolean;
  paraphrasedStance?: string;
}

/**
 * Detects if user message states a substantive stance on the topic.
 * When true, returns a one-sentence paraphrase for the confirmation prompt.
 * Used only in educational mode; we do not switch to contrarian until user confirms or clicks button.
 */
export async function detectStanceWithParaphrase(
  userMessage: string,
  topic: string
): Promise<StanceDetectionResult> {
  const { getOpenAIClient, OPENAI_MODEL_QUICK } = await import('../openai');
  const client = getOpenAIClient();
  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL_QUICK,
      messages: [
        {
          role: 'system',
          content: `You classify whether the user is stating a substantive stance on the topic. Reply with JSON: { "isStance": true|false, "paraphrasedStance": "one sentence paraphrase of their stance, or empty string if not a stance" }. Use "isStance": true only when they clearly state their own view or position (e.g. "I believe X", "policy changes", "we should do Y"). Use false for short answers to yes/no questions (e.g. "yes", "policy changes" as a one-word answer), questions, or "I don't know."`,
        },
        {
          role: 'user',
          content: `Topic: "${topic}"\n\nUser message: "${userMessage}"\n\nJSON:`,
        },
      ],
      temperature: 0.2,
      max_tokens: 120,
    });
    const raw = response.choices[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(raw) as { isStance?: boolean; paraphrasedStance?: string };
    const isStance = !!parsed.isStance;
    const paraphrasedStance = isStance && parsed.paraphrasedStance
      ? String(parsed.paraphrasedStance).trim()
      : undefined;
    return { isStance, paraphrasedStance };
  } catch (error) {
    console.error('Stance detection error:', error);
    return { isStance: false };
  }
}

/** Current exchange number (1 = first user message; current message not yet in history). */
function getExchangeCount(conversationHistory: ContrarianContext['conversationHistory']): number {
  const priorUserMessages = conversationHistory.filter(m => m.role === 'user').length;
  return priorUserMessages + 1;
}

/**
 * Generates educational response: analysis (stances + origination, values challenged) + follow-up question.
 * No statistics or legislation sections. Questions start yes/no, then become open-ended.
 */
export async function generateQuestionResponse(
  question: string,
  topic: string,
  context: ContrarianContext,
  _questionType?: QuestionType
): Promise<EducationalResponse> {
  const exchangeCount = getExchangeCount(context.conversationHistory);
  const isEarlyExchange = exchangeCount <= 2;

  const systemPrompt = `You are helping a user discover their stance on "${topic}" through conversation.
Your response has exactly two parts: analysis and followUpQuestion. Do not include statistics or legislation sections.

ANALYSIS (required content):
1. Common stances on this topic and where they come from (origination)—e.g. ideological roots, historical context, who holds them.
2. Core values that this topic challenges—e.g. liberty vs. equality, individual vs. collective, etc.
Keep it one coherent block that continues from what the user said. If they said "I don't know" or asked for help, briefly acknowledge that, then provide the analysis. You may use the GOVERNMENT DATA below only to inform common stances or context; do not list raw stats or bills. When data is limited: one brief notice max, then focus exclusively on what we have. Do not dwell on gaps.

FOLLOW-UP QUESTION:
The question must NOT be about lack of data—focus on the substance of the topic.
- Exchange 1–2 (early): Ask a simple yes/no or either/or question (e.g. "Do you lean more toward X or Y?", "Is Z important to you?").
- Exchange 3+ (deeper): Ask a more open-ended question that invites reflection (e.g. "What would need to be true for you to support X?", "How do you weigh A against B?").
Current exchange number: ${exchangeCount}. ${isEarlyExchange ? 'Use a simple yes/no or either/or question.' : 'Use a more open-ended question.'}

SOURCES: Always return an empty array (sources: []). We do not cite statistics or legislation in educational responses.
Return valid JSON matching the schema.`;

  const govDataSummary = formatGovernmentData(context.governmentData);

  const userPrompt = `Topic: "${topic}"

USER'S MESSAGE:
${question}

GOVERNMENT DATA (use only to inform your analysis of common stances/context; do not list stats or bills):
${govDataSummary}

Provide analysis (common stances + origination, core values this topic challenges) and one follow-up question. sources: [].
Return valid JSON matching the schema.`;

  return getJSONCompletion<EducationalResponse>(
    systemPrompt,
    userPrompt,
    educationalResponseSchema
  );
}

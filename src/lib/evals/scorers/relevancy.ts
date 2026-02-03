import { getJSONCompletion } from '../../openai';
import { ContrarianOutput } from '../../contrarian';
import { getTopicDescription } from '../../contrarian/topics';
import type { AlignmentScores } from '../../contrarian';

const relevancySchema = {
  type: 'object' as const,
  properties: {
    score: { type: 'number' as const, minimum: 0, maximum: 1, description: 'Relevancy score' },
    reasoning: { type: 'string' as const, description: 'Brief reason for the score' },
  },
  required: ['score', 'reasoning'],
  additionalProperties: false,
};

/**
 * Educational: one call returns both answer relevancy and follow-up relevancy.
 * Saves one LLM call vs scoring them separately.
 */
export async function scoreRelevancyAndFollowUp(
  response: ContrarianOutput,
  userStance: string,
  topic: string
): Promise<{ relevancy: number; followUpRelevancy: number }> {
  let topicDescription = '';
  try {
    topicDescription = getTopicDescription(topic as any) || '';
  } catch {
    // Topic might not be in our predefined list
  }
  const context = topicDescription ? `${topic}: ${topicDescription}` : topic;

  const responseText = (response.sections as any).analysis ?? '';
  const followUpQuestion = response.sections.followUpQuestion ?? '';

  if (!responseText.trim()) {
    return { relevancy: 0, followUpRelevancy: followUpQuestion.trim() ? 0.5 : 0 };
  }

  const systemPrompt = `You are evaluating an educational answer and its follow-up question.

1. ANSWER RELEVANCY: Does the answer address the user's question? Same topic, answers what was asked = 1.0. Partially = 0.5–0.9. Wrong topic/evasive = 0–0.4.
2. FOLLOW-UP RELEVANCY: Is the follow-up question relevant to the user's input and topic? Same topic, logical next step = 1.0. Different topic or unrelated = 0.

Return both scores 0.0 to 1.0.`;

  const userPrompt = `Topic/context: ${context}

User's question: "${userStance}"

Model's answer: "${responseText}"

Follow-up question from the model: "${followUpQuestion}"

Score: (1) Does the answer address the question? (2) Is the follow-up question relevant to the user and topic?`;

  const schema = {
    type: 'object' as const,
    properties: {
      answerRelevancy: { type: 'number' as const, minimum: 0, maximum: 1 },
      followUpRelevancy: { type: 'number' as const, minimum: 0, maximum: 1 },
      reasoning: { type: 'string' as const },
    },
    required: ['answerRelevancy', 'followUpRelevancy', 'reasoning'],
    additionalProperties: false,
  };

  try {
    const result = await getJSONCompletion<{ answerRelevancy: number; followUpRelevancy: number; reasoning: string }>(
      systemPrompt,
      userPrompt,
      schema
    );
    const relevancy = Math.max(0, Math.min(1, result.answerRelevancy));
    const followUpRelevancy = Math.max(0, Math.min(1, result.followUpRelevancy));
    console.log(`   Relevancy (educational): ${(relevancy * 100).toFixed(1)}%, Follow-up relevancy: ${(followUpRelevancy * 100).toFixed(1)}% — ${result.reasoning}`);
    return { relevancy, followUpRelevancy };
  } catch (error) {
    console.error('Error in relevancy+followUp scorer:', error);
    return { relevancy: 0.5, followUpRelevancy: 0.5 };
  }
}

/**
 * Relevancy scorer: Checks if the response addresses the user's input.
 * Uses a custom judge LLM (no Braintrust).
 *
 * - Educational: Does the answer address the user's question?
 * - Challenge: Does the response address the user's stance (same topic, acknowledgment, relevant challenge)?
 */
export async function scoreRelevancy(
  response: ContrarianOutput,
  userStance: string,
  topic: string
): Promise<number> {
  let topicDescription = '';
  try {
    topicDescription = getTopicDescription(topic as any) || '';
  } catch {
    // Topic might not be in our predefined list
  }

  const context = topicDescription ? `${topic}: ${topicDescription}` : topic;

  if (response.type === 'educational') {
    const responseText = (response.sections as any).analysis ?? '';

    if (!responseText.trim()) {
      return 0;
    }

    const systemPrompt = `You are evaluating whether an answer addresses the user's question.

Score 1.0 = The answer directly addresses the question (same topic, answers what was asked).
Score 0.5–0.9 = Partially addresses (e.g. tangentially related, or only part of the question).
Score 0.0–0.4 = Does not address the question (wrong topic, evasive, or irrelevant).`;

    const userPrompt = `Topic/context: ${context}

User's question: "${userStance}"

Model's answer: "${responseText}"

Does this answer address the user's question? Score 0.0 to 1.0.`;

    try {
      const result = await getJSONCompletion<{ score: number; reasoning: string }>(
        systemPrompt,
        userPrompt,
        relevancySchema
      );
      const score = Math.max(0, Math.min(1, result.score));
      console.log(`   Relevancy (educational): ${(score * 100).toFixed(1)}% — ${result.reasoning}`);
      return score;
    } catch (error) {
      console.error('Error in relevancy scorer (educational):', error);
      return 0.5;
    }
  } else {
    const responseText = [
      response.sections.acknowledgment,
      response.sections.keyStatisticsFor?.map(s => s.text).join('\n'),
      response.sections.keyStatisticsAgainst?.map(s => s.text).join('\n'),
      response.sections.deeperAnalysis,
      response.sections.followUpQuestion,
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = `You are evaluating whether a response addresses the user's stance (statement of belief).

The user stated a stance on a topic. The model responded with acknowledgment, statistics, and challenge.

Score 1.0 = Response addresses the stance: same topic, acknowledges the user's position, provides relevant challenge or data.
Score 0.5–0.9 = Partially addresses (e.g. same topic but generic, or only partly engages with the stance).
Score 0.0–0.4 = Does not address the stance (wrong topic, ignores the stance, or irrelevant).`;

    const userPrompt = `Topic/context: ${context}

User's stance: "${userStance}"

Model's response: "${responseText}"

Does this response address the user's stance? Score 0.0 to 1.0.`;

    try {
      const result = await getJSONCompletion<{ score: number; reasoning: string }>(
        systemPrompt,
        userPrompt,
        relevancySchema
      );
      const score = Math.max(0, Math.min(1, result.score));
      console.log(`   Relevancy (challenge): ${(score * 100).toFixed(1)}% — ${result.reasoning}`);
      return score;
    } catch (error) {
      console.error('Error in relevancy scorer (challenge):', error);
      return 0.5;
    }
  }
}

/**
 * Challenge: one call returns both relevancy and alignment accuracy.
 * Saves one LLM call vs scoring them separately.
 */
export async function scoreRelevancyAndAlignment(
  userStance: string,
  topic: string,
  response: ContrarianOutput,
  alignmentScores: AlignmentScores,
  expectedDirection?: 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism'
): Promise<{ relevancy: number; alignmentAccuracy: number }> {
  let topicDescription = '';
  try {
    topicDescription = getTopicDescription(topic as any) || '';
  } catch {
    // Topic might not be in our predefined list
  }
  const context = topicDescription ? `${topic}: ${topicDescription}` : topic;

  const responseText = [
    response.sections.acknowledgment,
    response.sections.keyStatisticsFor?.map(s => s.text).join('\n'),
    response.sections.keyStatisticsAgainst?.map(s => s.text).join('\n'),
    response.sections.deeperAnalysis,
    response.sections.followUpQuestion,
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = `You are evaluating two things about a response from The Contrarian:

1. RELEVANCY: Does the response address the user's stance? Same topic, acknowledges position, relevant challenge = 1.0. Partially = 0.5–0.9. Wrong topic/ignores stance = 0–0.4.

2. ALIGNMENT ACCURACY: Do the alignment scores (1–10 per lens) accurately reflect the user's stance?
   - liberalism: government intervention, social programs
   - conservatism: traditional values, limited government
   - socialism: wealth redistribution, collective ownership
   - libertarianism: minimal government, individual liberty
   Score 1.0 = primary direction correct and scores appropriate (e.g. stance supports liberalism → liberalism 7–10, conservatism 1–4). Score 0.0 = wrong or scores don't reflect stance.

Return both scores 0.0 to 1.0.`;

  const userPrompt = `Topic/context: ${context}

User's stance: "${userStance}"

Model's response: "${responseText}"

Current alignment scores: Liberalism ${alignmentScores.liberalism}/10, Conservatism ${alignmentScores.conservatism}/10, Socialism ${alignmentScores.socialism}/10, Libertarianism ${alignmentScores.libertarianism}/10
${expectedDirection ? `Expected direction: ${expectedDirection}` : ''}

Score: (1) Does the response address the stance? (2) How accurate are the alignment scores?`;

  const schema = {
    type: 'object' as const,
    properties: {
      relevancy: { type: 'number' as const, minimum: 0, maximum: 1 },
      alignmentAccuracy: { type: 'number' as const, minimum: 0, maximum: 1 },
      reasoning: { type: 'string' as const },
    },
    required: ['relevancy', 'alignmentAccuracy', 'reasoning'],
    additionalProperties: false,
  };

  try {
    const result = await getJSONCompletion<{ relevancy: number; alignmentAccuracy: number; reasoning: string }>(
      systemPrompt,
      userPrompt,
      schema
    );
    const relevancy = Math.max(0, Math.min(1, result.relevancy));
    const alignmentAccuracy = Math.max(0, Math.min(1, result.alignmentAccuracy));
    console.log(`   Relevancy (challenge): ${(relevancy * 100).toFixed(1)}%, Alignment accuracy: ${(alignmentAccuracy * 100).toFixed(1)}% — ${result.reasoning}`);
    return { relevancy, alignmentAccuracy };
  } catch (error) {
    console.error('Error in relevancy+alignment scorer:', error);
    return { relevancy: 0.5, alignmentAccuracy: 0.5 };
  }
}

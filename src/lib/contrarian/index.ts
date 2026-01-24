import { GovernmentData } from '../government';
import { PoliticalLens } from '../socratic/prompts';

export interface AlignmentScores {
  liberalism: number;      // 1-10
  conservatism: number;     // 1-10
  socialism: number;        // 1-10
  libertarianism: number;   // 1-10
}

export interface ContrarianMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: Array<{ number: number; name: string; url: string }>;
}

export interface ContrarianContext {
  topic: string;
  conversationHistory: ContrarianMessage[];
  alignmentScores: AlignmentScores;
  governmentData: GovernmentData;
}

export interface ContrarianChallengeResponse {
  challenge: string;
  updatedScores: AlignmentScores;
  followUpQuestion: string;
  sources?: Array<{ number: number; name: string; url: string }>;
}

import { getOpenAIClient } from '../openai';
import { gatherGovernmentData } from '../government';
import { buildContrarianSystemPrompt, buildContrarianUserPrompt } from './prompts';
import { updateScores } from './scoring';
import { extractSources } from '../analysis/sources';

/**
 * Determines which political lens the user's stance most aligns with
 * Returns the opposing lens to use for challenging
 */
function determineOpposingLens(scores: AlignmentScores): PoliticalLens {
  // Find the lens with highest score (user's alignment)
  const entries = Object.entries(scores) as [PoliticalLens, number][];
  const maxEntry = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  const userLens = maxEntry[0];

  // Return opposing lens
  // If user aligns with liberalism, challenge from conservatism/libertarianism
  // If user aligns with conservatism, challenge from liberalism/socialism
  // If user aligns with socialism, challenge from conservatism/libertarianism
  // If user aligns with libertarianism, challenge from socialism/liberalism
  const opposingMap: Record<PoliticalLens, PoliticalLens> = {
    liberalism: 'conservatism',
    conservatism: 'liberalism',
    socialism: 'conservatism',
    libertarianism: 'socialism',
  };

  return opposingMap[userLens];
}

export async function generateContrarianChallenge(
  context: ContrarianContext,
  userStance: string
): Promise<ContrarianChallengeResponse> {
  // Determine opposing lens based on current alignment scores
  const opposingLens = determineOpposingLens(context.alignmentScores);

  // Build prompts
  const systemPrompt = buildContrarianSystemPrompt(opposingLens, context.topic);
  const userPrompt = buildContrarianUserPrompt(
    context.topic,
    userStance,
    context.governmentData,
    context.conversationHistory
  );

  // Call OpenAI
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const challengeText = response.choices[0]?.message?.content || '';

  // Extract sources
  const sources = extractSources(challengeText);

  // Remove Sources section from challenge text
  const challengeWithoutSources = challengeText.replace(/##\s+Sources\s*\n[\s\S]*$/i, '').trim();

  // Extract follow-up question (last sentence or question mark)
  const sentences = challengeWithoutSources.split(/[.!?]+/).filter(s => s.trim());
  const followUpQuestion = sentences.length > 0 
    ? sentences[sentences.length - 1].trim() + '?'
    : 'What are your thoughts on this?';

  // Update scores
  const updatedScores = await updateScores(
    context.alignmentScores,
    userStance,
    context.topic
  );

  return {
    challenge: challengeWithoutSources,
    updatedScores,
    followUpQuestion,
    sources,
  };
}

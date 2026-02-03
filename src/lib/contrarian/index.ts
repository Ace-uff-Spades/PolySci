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
  /** Prior stances the user has stated (for continuity) */
  stanceHistory?: string[];
}

export interface ContrarianOutput {
  type: 'challenge' | 'question-response' | 'educational';
  sections: {
    // Challenge response fields
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    // Educational response fields (analysis + question only)
    analysis?: string;
    // Common field
    followUpQuestion: string;
  };
  updatedScores: AlignmentScores;
  sources: Array<{ number: number; name: string; url: string }>;
}

import { getJSONCompletion } from '../openai';
import { gatherGovernmentData } from '../government';
import { buildContrarianSystemPrompt, buildContrarianUserPrompt } from './prompts';
import { updateScores } from './scoring';
import { contrarianSchema } from './schemas';
import { analyzeStance, StanceAnalysisResult } from './stance-analysis';

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

export async function generateContrarian(
  context: ContrarianContext,
  userStance: string
): Promise<ContrarianOutput> {
  // Stage 1: Analyze stance merits
  const stanceAnalysis = await analyzeStance(
    context.topic,
    userStance,
    context.governmentData
  );

  // Determine opposing lens based on current alignment scores
  const opposingLens = determineOpposingLens(context.alignmentScores);

  // Stage 2: Generate challenge with dual statistics
  const systemPrompt = buildContrarianSystemPrompt(opposingLens, context.topic);
  const userPrompt = buildContrarianUserPrompt(
    context.topic,
    userStance,
    context.governmentData,
    context.conversationHistory,
    stanceAnalysis,
    context.stanceHistory
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
    contrarianSchema
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

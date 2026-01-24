import { getOpenAIClient } from '../openai';
import { PoliticalLens } from '../socratic/prompts';
import { AlignmentScores } from './index';

const lensDescriptions: Record<PoliticalLens, string> = {
  liberalism: 'Liberalism emphasizes individual rights, democracy, free markets with appropriate regulation, social justice, and the role of government in protecting civil liberties and ensuring equal opportunity.',
  conservatism: 'Conservatism emphasizes tradition, limited government, free markets, individual responsibility, and the preservation of established institutions.',
  socialism: 'Socialism emphasizes collective ownership, social equality, public services, workers\' rights, and reducing economic inequality through government intervention and social programs.',
  libertarianism: 'Libertarianism emphasizes individual liberty, minimal government intervention, free markets, property rights, and voluntary association.',
};

export async function calculateAlignmentScore(
  userStance: string,
  lens: PoliticalLens,
  topic: string
): Promise<number> {
  const client = getOpenAIClient();
  
  const systemPrompt = `You are a political alignment analyzer. Your task is to rate how well a user's political stance aligns with a specific political lens on a scale of 1-10.

${lensDescriptions[lens]}

Return ONLY a single number between 1 and 10, where:
- 1-3: Very low alignment
- 4-6: Moderate alignment
- 7-9: High alignment
- 10: Very high alignment

Return just the number, nothing else.`;

  const userPrompt = `Topic: ${topic}

User's stance: ${userStance}

Rate the alignment between this stance and ${lens} (1-10):`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 10,
  });

  const content = response.choices[0]?.message?.content?.trim() || '';
  const score = parseInt(content, 10);
  
  // Validate score is between 1-10, default to 5 if invalid
  if (isNaN(score) || score < 1 || score > 10) {
    return 5;
  }
  
  return score;
}

export async function updateScores(
  currentScores: AlignmentScores,
  userResponse: string,
  topic: string
): Promise<AlignmentScores> {
  const lenses: PoliticalLens[] = ['liberalism', 'conservatism', 'socialism', 'libertarianism'];
  
  // Calculate new scores for all lenses
  const newScores = await Promise.all(
    lenses.map(lens => calculateAlignmentScore(userResponse, lens, topic))
  );

  // Weight: 60% new response, 40% current scores
  return {
    liberalism: Math.round(newScores[0] * 0.6 + currentScores.liberalism * 0.4),
    conservatism: Math.round(newScores[1] * 0.6 + currentScores.conservatism * 0.4),
    socialism: Math.round(newScores[2] * 0.6 + currentScores.socialism * 0.4),
    libertarianism: Math.round(newScores[3] * 0.6 + currentScores.libertarianism * 0.4),
  };
}

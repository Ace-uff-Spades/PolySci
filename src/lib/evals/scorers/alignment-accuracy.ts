import { getJSONCompletion } from '../../openai';
import { AlignmentScores } from '../../contrarian';

/**
 * Alignment Accuracy scorer: Validates that alignment scores (1-10)
 * match the semantic meaning of the user stance
 * Uses LLM-as-a-judge to verify score accuracy
 * 
 * NOTE: This scorer should NOT be used for educational responses.
 * Educational responses have neutral scores (5/5/5/5) and don't indicate
 * strong political alignment, so alignment accuracy is not meaningful.
 */
export async function scoreAlignmentAccuracy(
  userStance: string,
  topic: string,
  alignmentScores: AlignmentScores,
  expectedDirection?: 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism'
): Promise<number> {
  // Use JSON mode to avoid parsing issues
  const systemPrompt = `You are an expert political scientist evaluating alignment scores.
Your task is to verify if the alignment scores accurately reflect the user's stance.

Alignment scores range from 1-10 for each political lens:
- liberalism: Support for government intervention, social programs, progressive policies
- conservatism: Support for traditional values, limited government, free markets
- socialism: Support for wealth redistribution, collective ownership, social equality
- libertarianism: Support for minimal government, individual liberty, free markets

CRITICAL SCORING CRITERIA:
- 1.0 (Perfect): The primary alignment direction matches the stance AND the score is appropriately high (7-10) for that direction AND other scores are appropriately low (1-4)
- 0.8 (Very Good): Primary direction correct with appropriate score (6-9), but minor issues with other scores
- 0.6 (Good): Primary direction correct but score could be higher/lower (off by 2+ points), or secondary scores need adjustment
- 0.4 (Poor): Wrong primary direction OR correct direction but score is way off (off by 3+ points)
- 0.0 (Wrong): Completely wrong alignment OR scores don't reflect the stance at all

Be STRICT: A stance that strongly supports liberalism should have liberalism >= 7 and conservatism <= 4.`;

  const userPrompt = `User's stance on "${topic}":
"${userStance}"

Current alignment scores:
- Liberalism: ${alignmentScores.liberalism}/10
- Conservatism: ${alignmentScores.conservatism}/10
- Socialism: ${alignmentScores.socialism}/10
- Libertarianism: ${alignmentScores.libertarianism}/10

${expectedDirection ? `Expected direction: ${expectedDirection}` : ''}

Rate the accuracy of these alignment scores according to the strict criteria above.`;

  const schema = {
    type: 'object',
    properties: {
      score: {
        type: 'number',
        description: 'Accuracy score between 0.0 and 1.0',
        minimum: 0,
        maximum: 1,
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation of why this score was assigned',
      },
    },
    required: ['score', 'reasoning'],
    additionalProperties: false,
  };

  try {
    const result = await getJSONCompletion<{ score: number; reasoning: string }>(
      systemPrompt,
      userPrompt,
      schema
    );
    
    // Log reasoning for debugging
    console.log(`   Alignment accuracy reasoning: ${result.reasoning}`);
    
    // Validate score is between 0 and 1
    if (isNaN(result.score) || result.score < 0 || result.score > 1) {
      console.warn(`Invalid alignment accuracy score: ${result.score}, defaulting to 0.5`);
      return 0.5;
    }
    
    return result.score;
  } catch (error) {
    console.error('Error scoring alignment accuracy:', error);
    return 0.5; // Default to neutral score on error
  }
}

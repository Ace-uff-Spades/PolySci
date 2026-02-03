import { getJSONCompletion } from '../../openai';
import { ContrarianOutput } from '../../contrarian';
import { GovernmentData } from '../../government';
import { formatGovernmentData } from '../../government/format';

function stripCitationMarkers(text: string): string {
  return text.replace(/\s*\[\d+\]\s*/g, ' ').trim();
}

/**
 * Faithfulness scorer: Validates that statistics in the response
 * are supported by the provided government data.
 * Single LLM call (no Braintrust): extract claims from response, judge each against context.
 * Skips when no government data is available.
 */
export async function scoreFaithfulness(
  response: ContrarianOutput,
  governmentData: GovernmentData,
  _userInput: string
): Promise<number | null> {
  const formattedData = formatGovernmentData(governmentData);
  if (formattedData === 'No government data available for this topic.') {
    console.log('   ⚠️  No government data retrieved for this topic - skipping faithfulness check');
    return null;
  }

  const claims: string[] = [];
  if (response.sections.keyStatisticsFor) {
    claims.push(...response.sections.keyStatisticsFor.map(s => stripCitationMarkers(s.text)));
  }
  if (response.sections.keyStatisticsAgainst) {
    claims.push(...response.sections.keyStatisticsAgainst.map(s => stripCitationMarkers(s.text)));
  }
  if ((response.sections as any).keyStatistics) {
    claims.push(...(response.sections as any).keyStatistics.map((s: any) => stripCitationMarkers(s.text)));
  }

  if (claims.length === 0) {
    return 0;
  }

  const systemPrompt = `You are a fact-checker. You will be given:
1. CONTEXT: Government/source data (numbers, rates, totals, etc.)
2. CLAIMS: A list of statistical claims from an AI response.

For EACH claim, decide: Is this claim SUPPORTED by the context?

Rules:
- SUPPORTED = the context contains the same factual content: same numbers, same metric, same meaning. Paraphrasing or different wording is OK.
- SUPPORTED = a claim that explicitly states the data does NOT contain something (e.g. "In the data we have, we don't see X", "the data does not contain X", "there is no specific statistic for X") is SUPPORTED if the context indeed does not contain that thing.
- NOT SUPPORTED = the number is wrong, the metric is wrong, or the claim cannot be found in the context and is not an explicit "data does not contain" statement.`;

  const claimsList = claims.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const userPrompt = `CONTEXT:
${formattedData}

CLAIMS (from AI response):
${claimsList}

Return a JSON object with one key "supported": an array of booleans in the same order as the claims (true = claim is supported by context).`;

  const schema = {
    type: 'object' as const,
    properties: {
      supported: {
        type: 'array' as const,
        items: { type: 'boolean' as const },
        description: 'One boolean per claim, in order',
      },
    },
    required: ['supported'],
    additionalProperties: false,
  };

  try {
    const result = await getJSONCompletion<{ supported: boolean[] }>(
      systemPrompt,
      userPrompt,
      schema
    );

    if (!Array.isArray(result.supported) || result.supported.length !== claims.length) {
      console.warn(`Faithfulness: expected ${claims.length} booleans, got ${result.supported?.length ?? 0}; defaulting to 0.5`);
      return 0.5;
    }

    const supportedCount = result.supported.filter(Boolean).length;
    const score = supportedCount / claims.length;

    if (score < 1) {
      console.log('   Context (government data):');
      console.log(formattedData);
      result.supported.forEach((s, i) => {
        if (!s) {
          console.log(`   Statement from response (NOT SUPPORTED) ${i + 1}: ${claims[i]}`);
        }
      });
    }

    return score;
  } catch (error) {
    console.error('Error in faithfulness scorer:', error);
    return 0.5;
  }
}

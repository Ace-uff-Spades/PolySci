import { getJSONCompletion } from '../openai';
import { stanceAnalysisSchema } from './schemas';
import { GovernmentData } from '../government';
import { formatGovernmentData } from '../government/format';

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

CRITICAL - USE ONLY THE PROVIDED GOVERNMENT DATA:
- The supporting statistic MUST be drawn ONLY from the GOVERNMENT DATA section and must be directly relevant to the topic and the user's stance. Do not cite external studies, think tanks, other countries' data, or any source not listed there.
- FORBIDDEN as a "supporting" statistic: generic bill counts (e.g. "20 related bills in Congress"), broad economic indicators (e.g. unemployment rate) when the topic is not about jobs/economy, or any stat that is only loosely related. If no statistic in the data directly supports their position, return supportingStatistics as empty or with text "None"—do not use a tangential or generic stat.
- Be genuine and specific in your acknowledgment
- Identify 1-3 valid points in their stance
- Keep acknowledgment to 1-2 sentences
- Return exactly 1 supporting statistic only when it is topic- and stance-specific (from government data); otherwise omit or "None"
- Return valid JSON matching the provided schema`;

  const govDataSummary = formatGovernmentData(governmentData);
  
  const userPrompt = `Analyze this user's stance on "${topic}":

USER'S STANCE:
${userStance}

GOVERNMENT DATA (use ONLY this for the supporting statistic):
${govDataSummary}

Identify:
1. Why this stance has merit (acknowledgment)
2. Exactly 1 statistic that directly supports their position on this topic—must be from the GOVERNMENT DATA above and directly about the topic (e.g. specific legislation, topic-relevant spending or demographics). Do NOT use generic bill counts or broad economic stats (e.g. unemployment) unless the topic is explicitly about those. If none apply, use "None".
3. 1-3 valid points in their stance

Return as JSON matching the schema.`;

  return getJSONCompletion<StanceAnalysisResult>(
    systemPrompt,
    userPrompt,
    stanceAnalysisSchema
  );
}

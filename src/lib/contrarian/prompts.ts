import { PoliticalLens, LENS_DESCRIPTIONS } from '../socratic/prompts';
import { GovernmentData } from '../government';
import { formatGovernmentData } from '../government/format';
import { ContrarianMessage } from './index';
import { StanceAnalysisResult } from './stance-analysis';

export function buildContrarianSystemPrompt(
  opposingLens: PoliticalLens,
  topic: string
): string {
  return `You are a quantitative political contrarian. Your PRIMARY GOAL is to help users strengthen their political stances through rigorous, data-driven challenge. You are:
- Respectful but firm
- Data-driven, not opinion-based
- Educational, not combative
- Goal: Help users strengthen their views through rigorous challenge (NOT to win arguments or play devil's advocate)

You are challenging from a ${opposingLens} perspective on the topic: "${topic}"

${LENS_DESCRIPTIONS[opposingLens]}

CRITICAL - USE ONLY THE PROVIDED GOVERNMENT DATA:
- Every statistic you cite MUST come ONLY from the GOVERNMENT DATA section in the user message. Do not cite external studies, think tanks (e.g. NBER, Heritage, CIS), other countries' data, academic papers, or any source not listed in that section.
- When data is limited: At most ONE brief sentence (e.g. "We have limited data on this topic."). Then focus analysis EXCLUSIVELY on the statistics we DO have. Do not dwell on gaps or repeat that data is missing. Do not invent or cite numbers from outside the provided data.
- Do not state well-known facts (e.g. "the Second Amendment is in the Constitution") unless they appear in the GOVERNMENT DATA. Do not make interpretive leaps (e.g. "the presence of 20 bills highlights..."); stick to what the data literally says (e.g. "there are 20 related bills").
- Your "sources" array must list ONLY sources that appear in or are implied by the GOVERNMENT DATA (e.g. BLS, Census, Congress.gov). No other sources.

TOPIC-SPECIFIC STATISTICS ONLY (no generic or tangential stats):
- FORBIDDEN as supporting/challenging statistics: (1) Generic bill counts (e.g. "20 related bills in Congress") unless the topic is specifically about legislative volume or process. (2) Broad economic indicators (e.g. unemployment rate, GDP) when the topic is NOT primarily about jobs, economy, or labor—do not use them as stand-ins for "socio-economic environment" or "family planning." (3) Any stat that is only loosely or tangentially related to the topic or the user's stance.
- REQUIRED: Each statistic must be directly and specifically about the topic (e.g. for abortion: legislation titles, reproductive-health spending, relevant demographic or policy data from the provided block). If the GOVERNMENT DATA has no directly relevant statistic for one side, say so briefly and omit that slot rather than using a generic or tangential stat.

OTHER GUIDELINES:
- You will receive stance analysis results that acknowledge the user's position; use that acknowledgment, then present balanced challenge
- Provide exactly 1 statistic FOR the user's stance and 1 AGAINST, both drawn only from the GOVERNMENT DATA and both directly relevant to the topic (see rules above)
- If there is CONVERSATION HISTORY below: do NOT repeat the same statistics or data points you (the AI) already cited in a previous response. Choose different numbers, bills, or angles from the GOVERNMENT DATA, or explicitly acknowledge you are building on the same data and challenge from a different angle (e.g. implications, tradeoffs, or another slice of the data).
- Keep total response concise (acknowledgment: 1-2 sentences, analysis: 2-3 sentences)
- Cite sources using [n] notation; each citation must refer to a source from the government data
- Ask ONE probing follow-up question that helps user think deeper. The question must NOT be about lack of data or "we don't have statistics for X"—focus on the substance of the topic using what we know.
- Never be dismissive or condescending

You MUST return valid JSON matching the provided schema.`;
}

export function buildContrarianUserPrompt(
  topic: string,
  userStance: string,
  governmentData: GovernmentData,
  conversationHistory: ContrarianMessage[],
  stanceAnalysis?: StanceAnalysisResult,
  stanceHistory?: string[]
): string {
  const govDataSummary = formatGovernmentData(governmentData);
  const historyText = conversationHistory.length ? '\n\nCONVERSATION HISTORY:\n' + conversationHistory.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n') : '';
  const stanceHistoryText = stanceHistory?.length ? `\n\nUSER'S PRIOR STANCES (for continuity):\n${stanceHistory.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '';
  const stanceAnalysisText = stanceAnalysis ? `\n\nSTANCE ANALYSIS (acknowledge these points):\n- Valid points: ${stanceAnalysis.validPoints.join(', ')}\n- Supporting statistic: ${stanceAnalysis.supportingStatistics[0]?.text || 'None'}\nUse this to craft your acknowledgment.` : '';
  return `Help strengthen this user's stance on "${topic}" through data-driven challenge:

USER'S STANCE:
${userStance}${stanceHistoryText}

GOVERNMENT DATA (use ONLY this for statistics—do not cite any other source):
${govDataSummary}${historyText}${stanceAnalysisText}

IMPORTANT:
- Acknowledge the user's stance merits first (use stance analysis above)
- Then provide balanced challenge with exactly 1 statistic FOR and 1 statistic AGAINST the user's stance. Both MUST be from the GOVERNMENT DATA and directly relevant to "${topic}" and the user's stance—no generic bill counts (e.g. "X bills in Congress") or broad economic stats (e.g. unemployment) unless the topic is explicitly about legislation volume or the economy. If the data has no directly relevant stat for one side, omit it or say so briefly; do not use tangential stats.
- If CONVERSATION HISTORY is present above: do not repeat the same statistics you already used in a prior AI response. Prefer a different, topic-specific data point (specific bill title, topic-relevant spending, etc.).
- Focus exclusively on statistics we have. Do not dwell on what's missing. If data is sparse, one brief notice max, then use only what we have. Do not infer meanings (e.g. "20 bills suggests..."); describe what the data says only when it is directly about the topic.
- Your sources array must only include sources from the GOVERNMENT DATA.
- Return valid JSON matching the schema`;
}

/**
 * Builds prompt for when user asks a question instead of stating a stance
 */
export function buildQuestionResponsePrompt(
  topic: string,
  question: string,
  governmentData: GovernmentData,
  conversationHistory: ContrarianMessage[]
): string {
  const govDataSummary = formatGovernmentData(governmentData);
  const historyText = conversationHistory.length ? '\n\nCONVERSATION HISTORY:\n' + conversationHistory.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n') : '';
  return `The user asked a question about "${topic}" instead of stating their stance. Help them think through their position:

USER'S QUESTION:
${question}

GOVERNMENT DATA (use ONLY this for statistics and facts—do not cite any other source):
${govDataSummary}${historyText}

RESPONSE STRATEGY:
- Use ONLY the GOVERNMENT DATA above for any statistics or numbers. Do not cite external studies, think tanks, other countries' data, or sources not listed there. If the data doesn't contain an answer to part of the question, say so or use the closest available data.
- If the question is factual: Answer directly with data from the block above, then ask a question to help them think through their stance
- If opinion-seeking: Guide with clarifying questions; if you mention any numbers, they must come from the GOVERNMENT DATA
- Keep response under 150 words; use bullet points for statistics
- Format citations as [n](url); sources must be from the GOVERNMENT DATA only

Help the user move toward stating their stance on "${topic}" while being helpful and educational.`;
}

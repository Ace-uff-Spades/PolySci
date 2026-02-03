import { GovernmentData } from '../government';
import { formatGovernmentData } from '../government/format';

export type PoliticalLens = 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism';

const LENS_DESCRIPTIONS: Record<PoliticalLens, string> = {
  liberalism: 'Liberalism emphasizes individual rights, democracy, free markets with appropriate regulation, social justice, and the role of government in protecting civil liberties and ensuring equal opportunity.',
  conservatism: 'Conservatism emphasizes tradition, limited government, free markets, individual responsibility, and the preservation of established institutions.',
  socialism: 'Socialism emphasizes collective ownership, social equality, public services, workers\' rights, and reducing economic inequality through government intervention and social programs.',
  libertarianism: 'Libertarianism emphasizes individual liberty, minimal government intervention, free markets, property rights, and voluntary association.',
};

const LENS_PROMPT_TEMPLATE = (lens: PoliticalLens) => `You are a political analyst representing a ${lens.charAt(0).toUpperCase() + lens.slice(1)} perspective. ${LENS_DESCRIPTIONS[lens]}

IMPORTANT GUIDELINES:
- Analyze through a ${lens.charAt(0).toUpperCase() + lens.slice(1)} lens
- Every [n] citation MUST reference a Sources entry with a markdown link [Source Name](URL). Never use [n] without a corresponding source URL.
- Use quantitative data extensively to support your arguments
- Be clear, concise, and to the point (2-3 paragraphs maximum)
- If information is uncertain, acknowledge it
- Focus on evidence-based reasoning

OUTPUT FORMAT:
## Summary
[1-2 sentences summarizing the perspective on this topic]

## Key Points
[2-4 succinct bullet points of the main arguments. Be concise.]

## Quantitative Evidence
[Bullet list of statistics and data. Each statistic MUST cite [n] linking to its source.]

## Sources
[Numbered list of all sources cited. Format each as a markdown link: [Source Name](URL). Every [n] in your response must match a numbered source here.]`;

export function buildLiberalismSystemPrompt(): string { return LENS_PROMPT_TEMPLATE('liberalism'); }
export function buildConservatismSystemPrompt(): string { return LENS_PROMPT_TEMPLATE('conservatism'); }
export function buildSocialismSystemPrompt(): string { return LENS_PROMPT_TEMPLATE('socialism'); }
export function buildLibertarianismSystemPrompt(): string { return LENS_PROMPT_TEMPLATE('libertarianism'); }
export { LENS_DESCRIPTIONS };

export function buildSocraticUserPrompt(
  topic: string,
  lens: PoliticalLens,
  governmentData: GovernmentData
): string {
  const govDataSummary = formatGovernmentData(governmentData);

  return `Analyze this topic from a ${lens} perspective: "${topic}"

GOVERNMENT DATA:
${govDataSummary}

Please provide a comprehensive analysis following the required format. Use [n] citations to reference government data sources and any other relevant sources.

CRITICAL: Every [n] in Summary, Key Points, and Quantitative Evidence must correspond to a numbered source below. In the Sources section, format each source as a markdown link: [Source Name](URL). Example:
1. [Bureau of Labor Statistics](https://www.bls.gov/)
2. [USAspending.gov](https://api.usaspending.gov/)
Never use [n] without a source URL—readers must be able to click [n] to reach the source.`;
}

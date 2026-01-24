// Topics extracted from docs/political_topics.md
export const CONTRARIAN_TOPICS = [
  'Abortion Rights',
  'LGBTQ+ Rights',
  'Gun Control',
  'Racial Justice & Systemic Racism',
  'Immigration & Border Policy',
  'Taxes & Wealth Redistribution',
  'Size & Scope of Government',
  'Healthcare System',
  'Climate Change & Environmental Regulation',
  'Criminal Justice & Policing',
  'Free Speech & Cancel Culture',
  'Foreign Policy & Military',
  'Education Policy',
  'Trade & Globalization',
  'Religion in Public Life',
] as const;

export type ContrarianTopic = typeof CONTRARIAN_TOPICS[number];

export function isValidTopic(topic: string): topic is ContrarianTopic {
  return CONTRARIAN_TOPICS.includes(topic as ContrarianTopic);
}

// Topic descriptions from political_topics.md
export const TOPIC_DESCRIPTIONS: Record<ContrarianTopic, string> = {
  'Abortion Rights': 'Access as reproductive freedom (left) vs. restrictions/pro-life protections (right). One of the strongest historical wedge issues.',
  'LGBTQ+ Rights': 'Strong support for expansion/inclusion (left) vs. emphasis on traditional norms/religious freedoms (right).',
  'Gun Control': 'Stricter regulations/background checks (left) vs. Second Amendment protections/minimal restrictions (right).',
  'Racial Justice & Systemic Racism': 'Need for major reforms/affirmative action/reparations (left) vs. color-blind policies/merit focus (right). Pew highlights this as highly divisive.',
  'Immigration & Border Policy': 'Pathways to citizenship/diversity benefits (left) vs. strict enforcement/deportations/security (right). A top partisan differentiator in recent years.',
  'Taxes & Wealth Redistribution': 'Progressive taxation/higher rates on wealthy (left) vs. flat/low taxes/cuts for growth (right).',
  'Size & Scope of Government': 'Bigger government/more services (e.g., welfare expansion) (left) vs. smaller government/less intervention (right). One of the most consistent divides across coalitions.',
  'Healthcare System': 'Universal/government-funded options (left) vs. market-based/private solutions (right).',
  'Climate Change & Environmental Regulation': 'Urgent government action/green policies (left) vs. market innovation/skepticism of mandates (right).',
  'Criminal Justice & Policing': 'Reform/defund/reduce incarceration (left) vs. law-and-order/tough penalties/support for police (right).',
  'Free Speech & Cancel Culture': 'Protections against hate speech/moderation on platforms (left-leaning) vs. absolute free expression/anti-"woke" (right-leaning). Polarization here has shifted recently.',
  'Foreign Policy & Military': 'Multilateralism/human rights focus/international cooperation (left) vs. America First/strong defense/national interests (right).',
  'Education Policy': 'Public investment/inclusivity (left) vs. vouchers/parental rights/traditional content (right).',
  'Trade & Globalization': 'Protectionism/tariffs for workers (mixed, but often populist right) vs. free trade/global integration (classically right/libertarian, but varies).',
  'Religion in Public Life': 'Strict separation/secularism (left) vs. accommodation of religious values (right).',
};

export function getTopicDescription(topic: ContrarianTopic): string {
  return TOPIC_DESCRIPTIONS[topic] || '';
}

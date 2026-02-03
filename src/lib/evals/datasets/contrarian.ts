/**
 * Eval dataset for The Contrarian feature
 * Test cases covering different topics and user stances
 */

export interface EvalCase {
  id: string;
  topic: string;
  userStance: string;
  expectedCriteria: string[];
  expectedAlignmentDirection?: 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism';
  expectedResponseType?: 'challenge' | 'educational';
  expectedFollowUpQuestions?: string[]; // Probing questions that should appear in response
  /** Optional relevancy threshold for educational cases we may not have data for (e.g. factual-no-data, legislation-no-match). Default 0.7 */
  relevancyThreshold?: number;
}

export const CONTRARIAN_DATASET: EvalCase[] = [
  {
    id: 'healthcare-universal',
    topic: 'Healthcare System',
    userStance: 'I believe healthcare is a human right and should be free for everyone, funded by the government.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (liberalism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'liberalism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'How should we balance universal healthcare with quality of care?',
      'What role should private insurance play in a universal system?',
    ],
  },
  {
    id: 'immigration-strict',
    topic: 'Immigration & Border Policy',
    userStance: 'We need stricter border controls and should prioritize deporting illegal immigrants to protect American jobs.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (conservatism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'conservatism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'How do we balance border security with humanitarian concerns?',
      'What should happen to long-term undocumented residents?',
    ],
  },
  {
    id: 'taxes-progressive',
    topic: 'Taxes & Wealth Redistribution',
    userStance: 'The wealthy should pay much higher taxes to fund social programs and reduce inequality.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (socialism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'socialism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'At what income level should higher tax rates kick in?',
      'How do we prevent wealthy individuals from moving assets offshore?',
    ],
  },
  {
    id: 'government-minimal',
    topic: 'Size & Scope of Government',
    userStance: 'Government should be minimal and stay out of people\'s lives. Free markets solve most problems better than government intervention.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (libertarianism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'libertarianism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'What essential services should government still provide?',
      'How do we handle market failures without government intervention?',
    ],
  },
  {
    id: 'climate-action',
    topic: 'Climate Change & Environmental Regulation',
    userStance: 'Climate change is an urgent crisis requiring immediate government action and strict environmental regulations.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (liberalism/socialism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'liberalism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'How do we balance environmental regulations with economic growth?',
      'Should individual countries act alone or wait for global cooperation?',
    ],
  },
  {
    id: 'gun-rights',
    topic: 'Gun Control',
    userStance: 'The Second Amendment is fundamental. Any gun control measures infringe on constitutional rights and won\'t prevent crime.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (conservatism/libertarianism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'conservatism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'How do we balance Second Amendment rights with public safety?',
      'Are there any gun control measures you would support?',
    ],
  },
  {
    id: 'education-public',
    topic: 'Education Policy',
    userStance: 'Public education needs more funding and should be free from kindergarten through college. Private schools and vouchers undermine public education.',
    expectedCriteria: [
      'Acknowledgment section present',
      '1 supporting statistic with citation',
      '1 challenging statistic with citation',
      'Sources are valid URLs',
      'Alignment scores update correctly (liberalism/socialism should increase)',
      'Follow-up question is probing and helps user think deeper',
    ],
    expectedAlignmentDirection: 'liberalism',
    expectedResponseType: 'challenge',
    expectedFollowUpQuestions: [
      'How do we ensure quality education while keeping it free?',
      'What role should parents play in choosing their child\'s education?',
    ],
  },
];

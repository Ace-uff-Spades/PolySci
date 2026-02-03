/**
 * Eval dataset for Educational Responses
 * Test cases for when users ask questions or don't know their stance.
 * Expected behavior: analysis (common stances + origination, core values challenged) + follow-up question only.
 * No statistics or legislation sections. Questions: yes/no early, open-ended later.
 */

import { EvalCase } from './contrarian';

export const EDUCATIONAL_RESPONSES_DATASET: EvalCase[] = [
  // Cases: User doesn't know their stance
  {
    id: 'healthcare-unknown-stance',
    topic: 'Healthcare System',
    userStance: 'I don\'t know my stance on healthcare. What should I be thinking about?',
    expectedCriteria: [
      'Response type is educational',
      'Analysis continues the conversation and helps user discover their stance',
      'Analysis provides perspectives or tradeoffs on the topic when relevant',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited (can be empty if no stats/legislation cited)',
    ],
    expectedResponseType: 'educational',
    expectedFollowUpQuestions: [
      'Do you believe healthcare is a right or a privilege?',
      'What role should government play in healthcare?',
      'How important is individual choice vs. universal access?',
    ],
  },
  {
    id: 'immigration-unknown-stance',
    topic: 'Immigration & Border Policy',
    userStance: 'I\'m not sure where I stand on immigration. Can you help me understand the different perspectives?',
    expectedCriteria: [
      'Response type is educational',
      'Analysis continues the conversation and helps user discover their stance',
      'Analysis provides perspectives or tradeoffs when relevant',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited (can be empty if no stats/legislation cited)',
    ],
    expectedResponseType: 'educational',
    expectedFollowUpQuestions: [
      'What should be the priority: border security or humanitarian concerns?',
      'How should we handle long-term undocumented residents?',
      'What role should economic factors play in immigration policy?',
    ],
  },
  // Cases: User asks "what do you think"
  {
    id: 'healthcare-what-do-you-think',
    topic: 'Healthcare System',
    userStance: 'What do you think about healthcare?',
    expectedCriteria: [
      'Response type is educational',
      'Response explicitly states AI doesn\'t have a stance',
      'Response explains AI\'s role is to help user strengthen their stance',
      'Analysis continues the conversation',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited',
    ],
    expectedResponseType: 'educational',
  },
  {
    id: 'taxes-what-do-you-think',
    topic: 'Taxes & Wealth Redistribution',
    userStance: 'Can you give me a stance on taxes?',
    expectedCriteria: [
      'Response type is educational',
      'Response explicitly states AI doesn\'t have a stance',
      'Response explains AI\'s role is to help user find their own stance',
      'Analysis continues the conversation',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited',
    ],
    expectedResponseType: 'educational',
  },
  // Factual / legislation: analysis addresses question; stats/legislation only when we have direct match
  {
    id: 'climate-factual-question',
    topic: 'Climate Change & Environmental Regulation',
    userStance: 'What is the current rate of global temperature increase?',
    expectedCriteria: [
      'Response type is educational',
      'Analysis addresses the question (e.g. we don\'t have that in our data) and continues the conversation',
      'No filler stats or "N related bills" when nothing directly answers',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited (can be empty)',
    ],
    expectedResponseType: 'educational',
    relevancyThreshold: 0.3, // We don't have temperature rate; analysis continues conversation without filler
  },
  {
    id: 'education-legislation-question',
    topic: 'Education Policy',
    userStance: 'What legislation has been passed recently about education funding?',
    expectedCriteria: [
      'Response type is educational',
      'Analysis addresses the question; legislation links only when bills match topic',
      'No filler like "N related bills" or "legislative interest" when no direct match',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited',
    ],
    expectedResponseType: 'educational',
    relevancyThreshold: 0.5, // We may not have education-funding bills; analysis continues without filler
  },
  {
    id: 'gun-control-factual-question',
    topic: 'Gun Control',
    userStance: 'How many mass shootings occurred in the US last year?',
    expectedCriteria: [
      'Response type is educational',
      'Analysis addresses the question (e.g. we don\'t have that in our data) and continues the conversation',
      'No filler stats when nothing directly answers',
      'Follow-up question guides user toward stating their stance',
      'Sources valid when cited (can be empty)',
    ],
    expectedResponseType: 'educational',
    relevancyThreshold: 0.3, // We don't have mass-shooting count; analysis continues without filler
  },
];

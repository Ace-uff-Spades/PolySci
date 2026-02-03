import { describe, it, expect } from 'vitest';
import {
  extractTopicKeywords,
  checkKeywordsMatch,
  validateTopicRelevance,
} from './validation';

describe('extractTopicKeywords', () => {
  it('extracts keywords from topic string', () => {
    expect(extractTopicKeywords('Taxes & Wealth Redistribution')).toContain('taxes');
    expect(extractTopicKeywords('Taxes & Wealth Redistribution')).toContain('wealth');
    expect(extractTopicKeywords('Taxes & Wealth Redistribution')).toContain('redistribution');
  });
});

describe('checkKeywordsMatch', () => {
  it('scores "maintaining lower taxes" against Taxes & Wealth Redistribution', () => {
    const keywords = extractTopicKeywords('Taxes & Wealth Redistribution');
    const score = checkKeywordsMatch('maintaining lower taxes', keywords);
    expect(score).toBeGreaterThanOrEqual(0.2);
    expect(score).toBeLessThan(0.6);
  });
});

describe('validateTopicRelevance', () => {
  it('treats "maintaining lower taxes" as on-topic for Taxes & Wealth Redistribution', async () => {
    const result = await validateTopicRelevance(
      'Taxes & Wealth Redistribution',
      'maintaining lower taxes'
    );
    expect(result.isRelevant).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('treats "I don\'t know" as on-topic (no-stance → educational)', async () => {
    const result = await validateTopicRelevance('Abortion Rights', "I don't know");
    expect(result.isRelevant).toBe(true);
    expect(result.confidence).toBe(1);
    expect(result.message).toBeUndefined();
  });

  it('treats "I don\'t know" with curly apostrophe as on-topic', async () => {
    const result = await validateTopicRelevance('Abortion Rights', "I don\u2019t know");
    expect(result.isRelevant).toBe(true);
    expect(result.confidence).toBe(1);
  });
});

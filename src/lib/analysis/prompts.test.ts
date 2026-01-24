import { describe, it, expect } from 'vitest';
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  buildFollowUpPrompt,
} from './prompts';
import { NewsArticle } from '../newsdata';
import { GovernmentData } from '../government';

describe('prompts', () => {
  describe('buildAnalysisSystemPrompt', () => {
    it('should return a system prompt with required sections', () => {
      const prompt = buildAnalysisSystemPrompt();

      expect(prompt).toContain('balanced, objective political news analyst');
      expect(prompt).toContain('Quick Summary');
      expect(prompt).toContain('Why This Matters Now');
      expect(prompt).toContain('Key Parties Involved');
      expect(prompt).toContain('Democratic Perspective');
      expect(prompt).toContain('Republican Perspective');
      expect(prompt).toContain('Impact on the Common Joe');
      expect(prompt).toContain('By the Numbers');
      expect(prompt).toContain('Sources');
      expect(prompt).toContain('[n] notation');
      expect(prompt).toContain('Nothing to see here folks');
    });
  });

  describe('buildAnalysisUserPrompt', () => {
    it('should include topic in the prompt', () => {
      const topic = 'federal budget 2026';
      const articles: NewsArticle[] = [];
      const govData: GovernmentData = {
        economic: {},
        spending: {},
        demographic: {},
        legislative: {},
      };

      const prompt = buildAnalysisUserPrompt(topic, articles, govData);

      expect(prompt).toContain(topic);
      expect(prompt).toContain('Analyze this political topic');
    });

    it('should format news articles with citations', () => {
      const topic = 'test topic';
      const articles: NewsArticle[] = [
        {
          article_id: '1',
          title: 'Test Article 1',
          link: 'https://example.com/1',
          description: 'Description 1',
          pubDate: '2026-01-21',
          source_id: 'source1',
        },
        {
          article_id: '2',
          title: 'Test Article 2',
          link: 'https://example.com/2',
          description: null,
          pubDate: '2026-01-21',
          source_id: 'source2',
        },
      ];
      const govData: GovernmentData = {
        economic: {},
        spending: {},
        demographic: {},
        legislative: {},
      };

      const prompt = buildAnalysisUserPrompt(topic, articles, govData);

      expect(prompt).toContain('[1]');
      expect(prompt).toContain('[2]');
      expect(prompt).toContain('Test Article 1');
      expect(prompt).toContain('Test Article 2');
      expect(prompt).toContain('source1');
      expect(prompt).toContain('source2');
      expect(prompt).toContain('https://example.com/1');
      expect(prompt).toContain('https://example.com/2');
      expect(prompt).toContain('Description 1');
      expect(prompt).toContain('No description');
    });

    it('should include government data when available', () => {
      const topic = 'test topic';
      const articles: NewsArticle[] = [];
      const govData: GovernmentData = {
        economic: {
          unemployment: [
            {
              year: '2025',
              period: 'M12',
              periodName: 'December',
              value: '3.5',
              footnotes: [],
            },
          ],
        },
        spending: {
          overview: { totalBudget: 6.5e12 },
        },
        demographic: {},
        legislative: {},
      };

      const prompt = buildAnalysisUserPrompt(topic, articles, govData);

      expect(prompt).toContain('Unemployment Rate');
      expect(prompt).toContain('3.5%');
      expect(prompt).toContain('December 2025');
      expect(prompt).toContain('Federal Budget');
      expect(prompt).toContain('$6.50 trillion');
    });

    it('should handle empty government data gracefully', () => {
      const topic = 'test topic';
      const articles: NewsArticle[] = [];
      const govData: GovernmentData = {
        economic: {},
        spending: {},
        demographic: {},
        legislative: {},
      };

      const prompt = buildAnalysisUserPrompt(topic, articles, govData);

      expect(prompt).toContain('No government data available');
    });
  });

  describe('buildFollowUpPrompt', () => {
    it('should include original analysis and follow-up question', () => {
      const originalAnalysis = 'This is the original analysis.';
      const followUpQuestion = 'What happens next?';

      const prompt = buildFollowUpPrompt(originalAnalysis, followUpQuestion);

      expect(prompt).toContain(originalAnalysis);
      expect(prompt).toContain(followUpQuestion);
      expect(prompt).toContain('Based on the previous analysis');
      expect(prompt).toContain('follow-up question');
    });
  });
});

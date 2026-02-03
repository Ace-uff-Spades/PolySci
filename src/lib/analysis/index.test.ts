import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  gatherContext,
  streamAnalysis,
  streamFollowUp,
  generateFollowUpSuggestions,
  AnalysisContext,
} from './index';
import { NewsArticle } from '../news-service';
import { GovernmentData } from '../government';

// Mock dependencies
vi.mock('../news-service', () => ({
  getNewsForQuery: vi.fn(),
}));

vi.mock('../government', () => ({
  gatherGovernmentData: vi.fn(),
}));

const mockCreate = vi.fn();
vi.mock('../openai', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

import { getNewsForQuery } from '../news-service';
import { gatherGovernmentData } from '../government';

describe('analysis service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('gatherContext', () => {
    it('should fetch news and government data in parallel', async () => {
      const mockArticles: NewsArticle[] = [
        {
          article_id: '1',
          title: 'Test Article',
          link: 'https://example.com',
          description: 'Test',
          pubDate: '2026-01-21',
          source_id: 'test',
        },
      ];

      const mockGovData: GovernmentData = {
        economic: {},
        spending: {},
        demographic: {},
        legislative: {},
      };

      vi.mocked(getNewsForQuery).mockResolvedValue(mockArticles);
      vi.mocked(gatherGovernmentData).mockResolvedValue(mockGovData);

      const context = await gatherContext('test topic');

      expect(getNewsForQuery).toHaveBeenCalledWith('test topic');
      expect(gatherGovernmentData).toHaveBeenCalledWith('test topic');
      expect(context.topic).toBe('test topic');
      expect(context.newsArticles).toEqual(mockArticles);
      expect(context.governmentData).toEqual(mockGovData);
      expect(context.analysisHistory).toEqual([]);
    });
  });

  describe('streamAnalysis', () => {
    it('should stream analysis chunks and store in history', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [],
        governmentData: { economic: {}, spending: {}, demographic: {}, legislative: {} },
        analysisHistory: [],
      };
      const chunks = ['Hello', ' ', 'World'];
      mockCreate.mockResolvedValue({
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            async next() {
              if (i < chunks.length) return { value: { choices: [{ delta: { content: chunks[i++] } }] }, done: false };
              return { value: undefined, done: true };
            },
          };
        },
      });
      const results: string[] = [];
      for await (const chunk of streamAnalysis(context)) results.push(chunk);
      expect(results).toEqual(chunks);
      expect(context.analysisHistory).toHaveLength(1);
      expect(context.analysisHistory[0]).toBe('Hello World');
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('should call streamCompletion with correct prompts', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [{ article_id: '1', title: 'Test', link: 'https://example.com', description: 'Test', pubDate: '2026-01-21', source_id: 'test' }],
        governmentData: { economic: {}, spending: {}, demographic: {}, legislative: {} },
        analysisHistory: [],
      };
      mockCreate.mockResolvedValue({ [Symbol.asyncIterator]: () => ({ async next() { return { value: undefined, done: true }; } }) });
      for await (const _ of streamAnalysis(context)) {}
      expect(mockCreate).toHaveBeenCalledOnce();
      const [opts] = mockCreate.mock.calls[0];
      expect(opts.messages[0].content).toContain('balanced');
      expect(opts.messages[1].content).toContain('test topic');
    });
  });

  describe('streamFollowUp', () => {
    it('should stream follow-up response and store in history', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [],
        governmentData: { economic: {}, spending: {}, demographic: {}, legislative: {} },
        analysisHistory: ['Previous analysis'],
      };
      const chunks = ['Follow', ' ', 'up'];
      mockCreate.mockResolvedValue({
        [Symbol.asyncIterator]() {
          let i = 0;
          return { async next() { if (i < chunks.length) return { value: { choices: [{ delta: { content: chunks[i++] } }] }, done: false }; return { value: undefined, done: true }; } };
        },
      });
      const results: string[] = [];
      for await (const chunk of streamFollowUp(context, 'What happens next?')) results.push(chunk);
      expect(results).toEqual(chunks);
      expect(context.analysisHistory).toHaveLength(2);
      expect(context.analysisHistory[1]).toBe('Follow up');
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('should use empty string if no previous analysis', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [],
        governmentData: { economic: {}, spending: {}, demographic: {}, legislative: {} },
        analysisHistory: [],
      };
      mockCreate.mockResolvedValue({ [Symbol.asyncIterator]: () => ({ async next() { return { value: undefined, done: true }; } }) });
      for await (const _ of streamFollowUp(context, 'Question?')) {}
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate.mock.calls[0][0].messages[1].content).toContain('Question?');
    });
  });

  describe('generateFollowUpSuggestions', () => {
    it('should generate contextual follow-up suggestions', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Q1?\nQ2?\nQ3?\nQ4?\nQ5?' } }],
      });
      const suggestions = await generateFollowUpSuggestions('Test analysis');
      expect(suggestions).toHaveLength(5);
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach((s) => { expect(typeof s).toBe('string'); expect(s.length).toBeGreaterThan(0); });
    });

    it('should return default suggestions on error', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));
      const suggestions = await generateFollowUpSuggestions('Test analysis');
      expect(suggestions).toHaveLength(5);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});

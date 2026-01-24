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

vi.mock('../openai', () => ({
  streamCompletion: vi.fn(),
}));

import { getNewsForQuery } from '../news-service';
import { gatherGovernmentData } from '../government';
import { streamCompletion } from '../openai';

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
        governmentData: {
          economic: {},
          spending: {},
          demographic: {},
          legislative: {},
        },
        analysisHistory: [],
      };

      const chunks = ['Hello', ' ', 'World'];
      let chunkIndex = 0;

      vi.mocked(streamCompletion).mockImplementation(async (_, __, onChunk) => {
        // Simulate streaming chunks
        for (const chunk of chunks) {
          onChunk(chunk);
        }
      });

      const results: string[] = [];
      for await (const chunk of streamAnalysis(context)) {
        results.push(chunk);
      }

      expect(results).toEqual(chunks);
      expect(context.analysisHistory).toHaveLength(1);
      expect(context.analysisHistory[0]).toBe('Hello World');
      expect(streamCompletion).toHaveBeenCalledOnce();
    });

    it('should call streamCompletion with correct prompts', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [
          {
            article_id: '1',
            title: 'Test',
            link: 'https://example.com',
            description: 'Test',
            pubDate: '2026-01-21',
            source_id: 'test',
          },
        ],
        governmentData: {
          economic: {},
          spending: {},
          demographic: {},
          legislative: {},
        },
        analysisHistory: [],
      };

      vi.mocked(streamCompletion).mockImplementation(async () => {});

      // Consume the generator
      for await (const _ of streamAnalysis(context)) {
        // Just consume
      }

      expect(streamCompletion).toHaveBeenCalledOnce();
      const [systemPrompt, userPrompt] = vi.mocked(streamCompletion).mock.calls[0];
      expect(systemPrompt).toContain('balanced, objective political news analyst');
      expect(userPrompt).toContain('test topic');
    });
  });

  describe('streamFollowUp', () => {
    it('should stream follow-up response and store in history', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [],
        governmentData: {
          economic: {},
          spending: {},
          demographic: {},
          legislative: {},
        },
        analysisHistory: ['Previous analysis'],
      };

      const chunks = ['Follow', ' ', 'up'];
      vi.mocked(streamCompletion).mockImplementation(async (_, __, onChunk) => {
        for (const chunk of chunks) {
          onChunk(chunk);
        }
      });

      const results: string[] = [];
      for await (const chunk of streamFollowUp(context, 'What happens next?')) {
        results.push(chunk);
      }

      expect(results).toEqual(chunks);
      expect(context.analysisHistory).toHaveLength(2);
      expect(context.analysisHistory[1]).toBe('Follow up');
      expect(streamCompletion).toHaveBeenCalledOnce();
    });

    it('should use empty string if no previous analysis', async () => {
      const context: AnalysisContext = {
        topic: 'test topic',
        newsArticles: [],
        governmentData: {
          economic: {},
          spending: {},
          demographic: {},
          legislative: {},
        },
        analysisHistory: [],
      };

      vi.mocked(streamCompletion).mockImplementation(async () => {});

      for await (const _ of streamFollowUp(context, 'Question?')) {
        // Consume
      }

      expect(streamCompletion).toHaveBeenCalledOnce();
      const [, userPrompt] = vi.mocked(streamCompletion).mock.calls[0];
      expect(userPrompt).toContain('Question?');
    });
  });

  describe('generateFollowUpSuggestions', () => {
    it('should generate contextual follow-up suggestions', async () => {
      const analysis = `## Quick Summary
This is about the federal budget.

## Democratic Perspective
Democrats support increased spending.

## Republican Perspective
Republicans want to cut spending.`;

      const suggestions = await generateFollowUpSuggestions(analysis);

      expect(suggestions).toHaveLength(5);
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach((suggestion) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should return default suggestions on error', async () => {
      // Mock OpenAI to throw error
      const originalClient = require('../openai').getOpenAIClient;
      vi.spyOn(require('../openai'), 'getOpenAIClient').mockImplementation(() => {
        throw new Error('API error');
      });

      const analysis = 'Test analysis';
      const suggestions = await generateFollowUpSuggestions(analysis);

      expect(suggestions).toHaveLength(5);
      expect(Array.isArray(suggestions)).toBe(true);

      vi.restoreAllMocks();
    });
  });
});

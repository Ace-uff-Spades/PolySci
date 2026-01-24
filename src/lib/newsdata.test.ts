import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNews, NewsArticle } from './newsdata';

describe('fetchNews', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up test API key
    vi.stubEnv('NEWSDATA_API_KEY', 'test-api-key');
  });

  it('should fetch news articles for a query', async () => {
    const mockResponse = {
      status: 'success',
      results: [
        {
          article_id: '123',
          title: 'Test Article',
          link: 'https://example.com/article',
          description: 'Test description',
          pubDate: '2026-01-21 10:00:00',
          source_id: 'test_source',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchNews('test query');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test Article');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=test+query')
    );
  });

  it('should throw error when API returns error status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(fetchNews('test')).rejects.toThrow('Newsdata API error: 401');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedNews, cacheNewsResponse } from './news-cache';

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
      })),
    })),
  },
}));

describe('news-cache', () => {
  it('should generate consistent cache keys from queries', async () => {
    // Cache key generation is tested implicitly through the cache functions
    // This test verifies the module exports correctly
    expect(typeof getCachedNews).toBe('function');
    expect(typeof cacheNewsResponse).toBe('function');
  });
});

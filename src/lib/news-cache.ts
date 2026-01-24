import { db } from './firebase';
import { NewsArticle } from './newsdata';
import crypto from 'crypto';

const CACHE_COLLECTION = 'news_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedNewsEntry {
  query: string;
  articles: NewsArticle[];
  cachedAt: number;
  expiresAt: number;
}

function generateCacheKey(query: string): string {
  return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex');
}

export async function getCachedNews(query: string): Promise<NewsArticle[] | null> {
  const cacheKey = generateCacheKey(query);

  try {
    const doc = await db.collection(CACHE_COLLECTION).doc(cacheKey).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as CachedNewsEntry;

    if (Date.now() > data.expiresAt) {
      return null; // Cache expired
    }

    return data.articles;
  } catch (error) {
    console.error('Cache read error:', error);
    return null; // Fail open - if cache fails, fetch fresh
  }
}

export async function cacheNewsResponse(
  query: string,
  articles: NewsArticle[]
): Promise<void> {
  const cacheKey = generateCacheKey(query);
  const now = Date.now();

  const entry: CachedNewsEntry = {
    query: query.toLowerCase().trim(),
    articles,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  try {
    await db.collection(CACHE_COLLECTION).doc(cacheKey).set(entry);
  } catch (error) {
    console.error('Cache write error:', error);
    // Fail silently - caching is optimization, not critical path
  }
}

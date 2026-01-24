import { fetchNews, fetchTopStories, NewsArticle } from './newsdata';
import { getCachedNews, cacheNewsResponse } from './news-cache';

export async function getNewsForQuery(query: string): Promise<NewsArticle[]> {
  // Check cache first
  const cached = await getCachedNews(query);
  if (cached) {
    console.log(`Cache hit for query: ${query}`);
    return cached;
  }

  // Fetch fresh
  console.log(`Cache miss for query: ${query}`);
  const articles = await fetchNews(query);

  // Cache for future use
  await cacheNewsResponse(query, articles);

  return articles;
}

export async function getFeaturedStories(): Promise<NewsArticle[]> {
  const cacheKey = '__featured_stories__';

  const cached = await getCachedNews(cacheKey);
  if (cached) {
    return cached;
  }

  const articles = await fetchTopStories();
  await cacheNewsResponse(cacheKey, articles);

  return articles;
}

export type { NewsArticle };

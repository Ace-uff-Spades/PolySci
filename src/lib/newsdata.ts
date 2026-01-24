export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  description: string | null;
  pubDate: string;
  source_id: string;
  source_name?: string;
  content?: string;
  image_url?: string;
}

interface NewsdataResponse {
  status: string;
  results: NewsArticle[];
  nextPage?: string;
}

const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/latest';

export async function fetchNews(
  query: string,
  options: { size?: number } = {}
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    throw new Error('NEWSDATA_API_KEY not configured');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    q: query,
    language: 'en',
    size: String(options.size ?? 10),
    // Note: timeframe parameter removed - not available on free plan (removed Jan 15, 2024)
  });

  const response = await fetch(`${NEWSDATA_BASE_URL}?${params}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Newsdata API error: ${response.status} - ${errorText}`);
  }

  const data: NewsdataResponse = await response.json();
  return data.results || [];
}

export async function fetchTopStories(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    throw new Error('NEWSDATA_API_KEY not configured');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    language: 'en',
    category: 'politics',
    size: '5',
    // Note: timeframe parameter removed - not available on free plan (removed Jan 15, 2024)
  });

  const response = await fetch(`${NEWSDATA_BASE_URL}?${params}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Newsdata API error: ${response.status} - ${errorText}`);
  }

  const data: NewsdataResponse = await response.json();
  return data.results || [];
}

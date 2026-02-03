// Congress.gov API
// Docs: https://api.congress.gov/

export interface Bill {
  number: string;
  title: string;
  congress: number;
  type: string;
  introducedDate: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  sponsors: Array<{
    name: string;
    party: string;
    state: string;
  }>;
}

export interface CongressMember {
  name: string;
  party: string;
  state: string;
  chamber: 'House' | 'Senate';
}

const CONGRESS_BASE_URL = 'https://api.congress.gov/v3';

// Note: Congress.gov API requires an API key
// Register at: https://api.congress.gov/sign-up/
// Limitations:
// - API key required (free registration)
// - Rate limits: Not publicly documented
// - Data updates: Real-time for new bills, historical data available
// - Search limitations: Keyword search may miss related bills
// - Data completeness: Some bills may have incomplete metadata

export async function searchBills(query: string): Promise<Bill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;

  // If no API key, return empty (graceful degradation)
  if (!apiKey) {
    console.warn('CONGRESS_API_KEY not configured, skipping Congress.gov data');
    return [];
  }

  const params = new URLSearchParams({
    query,
    format: 'json',
    api_key: apiKey,
  });

  const response = await fetch(`${CONGRESS_BASE_URL}/bill?${params}`);

  if (!response.ok) {
    throw new Error(`Congress.gov API error: ${response.status}`);
  }

  const data = await response.json();
  return data.bills ?? [];
}

/**
 * Filter bills to those whose title matches at least one topic keyword.
 * Congress.gov search can return similar top results across queries; this keeps bills relevant to the topic.
 */
export function filterBillsByTopic(bills: Bill[], topicKeywords: string[]): Bill[] {
  if (!bills.length || !topicKeywords.length) return bills;
  const lowerKeywords = topicKeywords.map((k) => k.toLowerCase());
  const filtered = bills.filter((bill) => {
    const titleLower = (bill.title || '').toLowerCase();
    return lowerKeywords.some((kw) => titleLower.includes(kw));
  });
  return filtered.length > 0 ? filtered : bills;
}

/**
 * Searches for bills based on a topic and question keywords
 * Extracts relevant keywords from the question to improve search
 */
export async function searchBillsForQuestion(
  topic: string,
  question: string
): Promise<Bill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  
  if (!apiKey) {
    return [];
  }

  // Extract keywords from question (remove common words)
  const stopWords = new Set([
    'what', 'have', 'there', 'been', 'previous', 'legislation', 'to', 'fight', 
    'against', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 
    'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might'
  ]);
  
  const questionKeywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !stopWords.has(word) &&
      !word.match(/^[^a-z]+$/) // Filter out pure punctuation/numbers
    )
    .slice(0, 3); // Top 3 keywords

  // Combine topic and question keywords
  const searchQuery = [topic, ...questionKeywords].join(' ');

  return searchBills(searchQuery);
}

/**
 * Formats bills as markdown links for display
 */
export function formatBillsAsLinks(bills: Bill[]): string {
  return bills
    .slice(0, 5) // Limit to 5 bills
    .map((bill) => {
      const billUrl = `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.type.toLowerCase()}/${bill.number}`;
      return `[${bill.number}: ${bill.title}](${billUrl})`;
    })
    .join('\n');
}

export async function getRecentBills(limit: number = 10): Promise<Bill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;

  if (!apiKey) {
    console.warn('CONGRESS_API_KEY not configured, skipping Congress.gov data');
    return [];
  }

  const params = new URLSearchParams({
    format: 'json',
    limit: String(limit),
    sort: 'updateDate+desc',
    api_key: apiKey,
  });

  const response = await fetch(`${CONGRESS_BASE_URL}/bill?${params}`);

  if (!response.ok) {
    throw new Error(`Congress.gov API error: ${response.status}`);
  }

  const data = await response.json();
  return data.bills ?? [];
}

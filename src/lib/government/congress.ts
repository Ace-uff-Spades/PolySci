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

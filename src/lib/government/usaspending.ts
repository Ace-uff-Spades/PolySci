// USASpending.gov API
// Docs: https://api.usaspending.gov/
// Limitations:
// - No API key required (public API)
// - Rate limits: Not publicly documented
// - Data updates: Daily for recent transactions, historical data available
// - Search limitations: Keyword search may not return all relevant results
// - Data granularity: Some spending categories may be aggregated

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface AgencySpending {
  name: string;
  abbreviation: string;
  amount: number;
}

const USASPENDING_BASE_URL = 'https://api.usaspending.gov/api/v2';

export async function getFederalSpendingOverview(
  fiscalYear?: number
): Promise<{ totalBudget: number; byCategory: SpendingByCategory[] }> {
  const year = fiscalYear ?? new Date().getFullYear();

  const response = await fetch(
    `${USASPENDING_BASE_URL}/spending/?fiscal_year=${year}`
  );

  if (!response.ok) {
    throw new Error(`USASpending API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    totalBudget: data.total_budget ?? 0,
    byCategory: data.categories ?? [],
  };
}

export async function getAgencySpending(
  fiscalYear?: number
): Promise<AgencySpending[]> {
  const year = fiscalYear ?? new Date().getFullYear();

  const response = await fetch(
    `${USASPENDING_BASE_URL}/agency/awards/?fiscal_year=${year}&limit=10`
  );

  if (!response.ok) {
    throw new Error(`USASpending API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results ?? [];
}

export async function searchSpending(keyword: string): Promise<any[]> {
  const response = await fetch(`${USASPENDING_BASE_URL}/search/spending_by_award/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filters: {
        keywords: [keyword],
      },
      limit: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`USASpending API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results ?? [];
}

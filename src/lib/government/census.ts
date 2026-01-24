// Census Bureau API
// Docs: https://www.census.gov/data/developers/data-sets.html
// Limitations:
// - No API key required for basic data (public API)
// - Rate limits: Vary by endpoint
// - Data updates: Annual for most demographic data
// - Data availability: Some datasets may have delays in publication
// - Geographic granularity: Varies by dataset

export interface CensusDataPoint {
  variable: string;
  value: string;
  label: string;
}

const CENSUS_BASE_URL = 'https://api.census.gov/data';

// American Community Survey 5-year estimates
export async function getPopulationData(
  state?: string
): Promise<CensusDataPoint[]> {
  const year = new Date().getFullYear() - 1; // ACS data has 1-year lag

  let url = `${CENSUS_BASE_URL}/${year}/acs/acs5?get=NAME,B01003_001E`;

  if (state) {
    url += `&for=state:${state}`;
  } else {
    url += '&for=us:*';
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Census API error: ${response.status}`);
  }

  const data = await response.json();

  // First row is headers, rest is data
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row: string[]) => ({
    variable: 'population',
    value: row[1],
    label: row[0],
  }));
}

export async function getMedianIncomeData(
  state?: string
): Promise<CensusDataPoint[]> {
  const year = new Date().getFullYear() - 1;

  let url = `${CENSUS_BASE_URL}/${year}/acs/acs5?get=NAME,B19013_001E`;

  if (state) {
    url += `&for=state:${state}`;
  } else {
    url += '&for=us:*';
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Census API error: ${response.status}`);
  }

  const data = await response.json();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row: string[]) => ({
    variable: 'median_household_income',
    value: row[1],
    label: row[0],
  }));
}

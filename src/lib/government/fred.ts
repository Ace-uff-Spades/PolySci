// Federal Reserve Economic Data API
// Docs: https://fred.stlouisfed.org/docs/api/fred/
// API Key required (free): https://fredaccount.stlouisfed.org/apikeys
// Limitations:
// - Requires free API key registration
// - Rate limits: 120 requests per minute (documented)
// - Some series may have limited historical data
// - Data updates vary by series (daily, weekly, monthly, quarterly, annual)

export interface FREDDataPoint {
  date: string;
  value: number | null;
}

export interface FREDSeriesData {
  seriesId: string;
  title: string;
  units?: string;
  frequency?: string;
  data: FREDDataPoint[];
}

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

/**
 * Fetch economic data from FRED API
 * @param seriesId - FRED series identifier (e.g., "GDP" for Gross Domestic Product)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function fetchFREDData(
  seriesId: string,
  startDate?: string,
  endDate?: string
): Promise<FREDSeriesData | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('FRED_API_KEY not configured, skipping FRED data fetch');
    return null;
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    file_type: 'json',
    sort_order: 'desc',
    limit: '10000', // Max allowed
  });

  if (startDate) {
    params.append('observation_start', startDate);
  }
  if (endDate) {
    params.append('observation_end', endDate);
  }

  try {
    // FRED API v2 uses Bearer token authentication in header
    const response = await fetch(
      `${FRED_BASE_URL}/series/observations?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        // Invalid series ID, fail gracefully
        return null;
      }
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      // Get series info
      const infoParams = new URLSearchParams({
        series_id: seriesId,
        file_type: 'json',
      });
      const infoResponse = await fetch(
        `${FRED_BASE_URL}/series?${infoParams}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );
      
      let title = seriesId;
      let units = '';
      let frequency = '';

      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        if (infoData.seriess && infoData.seriess.length > 0) {
          title = infoData.seriess[0].title || seriesId;
          units = infoData.seriess[0].units || '';
          frequency = infoData.seriess[0].frequency || '';
        }
      }

      return {
        seriesId,
        title,
        units,
        frequency,
        data: data.observations
          .filter((obs: any) => obs.value !== '.') // Filter out missing data
          .map((obs: any) => ({
            date: obs.date,
            value: obs.value === '.' ? null : parseFloat(obs.value),
          })),
      };
    }

    return null;
  } catch (error) {
    console.error('FRED API fetch error:', error);
    return null;
  }
}

/**
 * Common FRED series for different economic indicators
 */
export const FRED_SERIES = {
  // GDP and Economic Growth
  GDP: 'GDP',
  REAL_GDP: 'GDPC1',
  GDP_GROWTH: 'A191RL1Q225SBEA',
  
  // Employment
  UNEMPLOYMENT_RATE: 'UNRATE',
  LABOR_FORCE_PARTICIPATION: 'CIVPART',
  NONFARM_PAYROLL: 'PAYEMS',
  
  // Inflation
  CPI: 'CPIAUCSL',
  CORE_CPI: 'CPILFESL',
  PCE_PRICE_INDEX: 'PCEPI',
  
  // Interest Rates
  FED_FUNDS_RATE: 'FEDFUNDS',
  TEN_YEAR_TREASURY: 'DGS10',
  
  // Trade
  TRADE_BALANCE: 'BOPGSTB',
  EXPORTS: 'EXPGS',
  IMPORTS: 'IMPGS',
  
  // Government
  FEDERAL_DEBT: 'GFDEBTN',
  FEDERAL_DEFICIT: 'FYFSD',
  
  // Income
  MEDIAN_HOUSEHOLD_INCOME: 'MEHOINUSA646N',
  PERSONAL_INCOME: 'PI',
  
  // Housing
  HOUSING_STARTS: 'HOUST',
  MEDIAN_HOME_PRICE: 'MSPUS',
} as const;

/**
 * Search for FRED series by keyword
 * Note: FRED has a search API but it's limited. We use predefined series mapping.
 */
export async function getEconomicDataForTopic(topic: string): Promise<FREDSeriesData[]> {
  const results: FREDSeriesData[] = [];
  const topicLower = topic.toLowerCase();

  // Determine relevant series based on topic keywords
  const seriesToFetch: string[] = [];

  // Always include core economic indicators
  seriesToFetch.push(FRED_SERIES.GDP);
  seriesToFetch.push(FRED_SERIES.UNEMPLOYMENT_RATE);
  seriesToFetch.push(FRED_SERIES.CPI);

  // Topic-specific series
  if (topicLower.includes('trade') || topicLower.includes('import') || topicLower.includes('export')) {
    seriesToFetch.push(FRED_SERIES.TRADE_BALANCE);
    seriesToFetch.push(FRED_SERIES.EXPORTS);
    seriesToFetch.push(FRED_SERIES.IMPORTS);
  }

  if (topicLower.includes('debt') || topicLower.includes('deficit') || topicLower.includes('budget')) {
    seriesToFetch.push(FRED_SERIES.FEDERAL_DEBT);
    seriesToFetch.push(FRED_SERIES.FEDERAL_DEFICIT);
  }

  if (topicLower.includes('income') || topicLower.includes('wage') || topicLower.includes('poverty')) {
    seriesToFetch.push(FRED_SERIES.MEDIAN_HOUSEHOLD_INCOME);
    seriesToFetch.push(FRED_SERIES.PERSONAL_INCOME);
  }

  if (topicLower.includes('housing') || topicLower.includes('home') || topicLower.includes('mortgage')) {
    seriesToFetch.push(FRED_SERIES.HOUSING_STARTS);
    seriesToFetch.push(FRED_SERIES.MEDIAN_HOME_PRICE);
  }

  if (topicLower.includes('interest') || topicLower.includes('rate') || topicLower.includes('monetary')) {
    seriesToFetch.push(FRED_SERIES.FED_FUNDS_RATE);
    seriesToFetch.push(FRED_SERIES.TEN_YEAR_TREASURY);
  }

  // Fetch all relevant series in parallel (with rate limiting consideration)
  const fetchPromises = seriesToFetch.map(seriesId => fetchFREDData(seriesId));
  const fetched = await Promise.allSettled(fetchPromises);

  fetched.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  });

  return results;
}

// Energy Information Administration API
// Docs: https://www.eia.gov/opendata/documentation.php
// API Key required: https://www.eia.gov/opendata/register.php
// Limitations:
// - Requires free API key registration
// - Max 5,000 rows per response (300 in XML)
// - Rate limits apply (not publicly documented, but reasonable use expected)
// - Data available for energy-related topics only

export interface EIADataPoint {
  period: string;
  value: number | null;
  units?: string;
}

export interface EIASeriesData {
  seriesId: string;
  name: string;
  description?: string;
  units?: string;
  data: EIADataPoint[];
}

const EIA_BASE_URL = 'https://api.eia.gov/v2';

/**
 * Fetch energy data from EIA API
 * @param seriesId - EIA series identifier (e.g., "ELEC.GEN.ALL-99.A" for total electricity generation)
 * @param start - Start date (YYYY-MM-DD)
 * @param end - End date (YYYY-MM-DD)
 */
export async function fetchEIAData(
  seriesId: string,
  start?: string,
  end?: string
): Promise<EIASeriesData | null> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    console.warn('EIA_API_KEY not configured, skipping EIA data fetch');
    return null;
  }

  // EIA API v2 uses query parameters with api_key
  // Note: The endpoint structure is complex and varies by dataset
  // This implementation uses a simplified approach - may need refinement for specific series
  const params = new URLSearchParams({
    'api_key': apiKey,
    'frequency': 'monthly',
    'data[0]': 'period',
    'data[1]': 'value',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    'length': '5000', // Max allowed
  });

  if (start) {
    params.append('start', start);
  }
  if (end) {
    params.append('end', end);
  }

  try {
    // EIA API v2 structure: /{category}/{subcategory}/data/
    // For electricity generation, we'll try the generation endpoint
    // Note: seriesId format may need to be adjusted based on actual EIA series structure
    const response = await fetch(
      `${EIA_BASE_URL}/electricity/electric-power-operational-data/data/?${params}&facets[seriesId][]=${seriesId}`
    );

    if (!response.ok) {
      // EIA API might return 404 for invalid series, fail gracefully
      if (response.status === 404 || response.status === 400) {
        return null;
      }
      throw new Error(`EIA API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different possible response structures
    if (data.response?.data) {
      return {
        seriesId,
        name: data.response.name || seriesId,
        description: data.response.description,
        units: data.response.units,
        data: data.response.data.map((point: any) => ({
          period: point.period || point.date || '',
          value: point.value !== null && point.value !== undefined ? parseFloat(point.value) : null,
          units: data.response.units,
        })),
      };
    }

    // Alternative response structure
    if (data.data) {
      return {
        seriesId,
        name: seriesId,
        data: data.data.map((point: any) => ({
          period: point.period || point.date || '',
          value: point.value !== null && point.value !== undefined ? parseFloat(point.value) : null,
        })),
      };
    }

    return null;
  } catch (error) {
    console.error('EIA API fetch error:', error);
    return null;
  }
}

/**
 * Common EIA series for different topics
 */
export const EIA_SERIES = {
  // Electricity generation
  TOTAL_GENERATION: 'ELEC.GEN.ALL-99.A',
  RENEWABLE_GENERATION: 'ELEC.GEN.RE-ALL-99.A',
  COAL_GENERATION: 'ELEC.GEN.COW-ALL-99.A',
  NATURAL_GAS_GENERATION: 'ELEC.GEN.NG-ALL-99.A',
  
  // Energy prices
  RETAIL_ELECTRICITY_PRICE: 'ELEC.PRICE.US-RES.A',
  GASOLINE_PRICE: 'PET.EMM_EPM0_PTE_NUS_DPG.A',
  
  // Energy consumption
  TOTAL_CONSUMPTION: 'TOTAL.ETCEUS.A',
} as const;

/**
 * Search for EIA series by keyword
 * Note: EIA doesn't have a direct search API, so we use predefined series
 */
export async function getEnergyDataForTopic(topic: string): Promise<EIASeriesData[]> {
  const results: EIASeriesData[] = [];
  const topicLower = topic.toLowerCase();

  // Determine relevant series based on topic keywords
  const seriesToFetch: string[] = [];

  if (topicLower.includes('climate') || topicLower.includes('energy') || topicLower.includes('carbon')) {
    seriesToFetch.push(EIA_SERIES.RENEWABLE_GENERATION);
    seriesToFetch.push(EIA_SERIES.TOTAL_GENERATION);
  }

  if (topicLower.includes('energy') || topicLower.includes('electricity')) {
    seriesToFetch.push(EIA_SERIES.RETAIL_ELECTRICITY_PRICE);
    seriesToFetch.push(EIA_SERIES.TOTAL_CONSUMPTION);
  }

  if (topicLower.includes('gas') || topicLower.includes('fuel') || topicLower.includes('petroleum')) {
    seriesToFetch.push(EIA_SERIES.GASOLINE_PRICE);
    seriesToFetch.push(EIA_SERIES.NATURAL_GAS_GENERATION);
  }

  // Fetch all relevant series in parallel
  const fetchPromises = seriesToFetch.map(seriesId => fetchEIAData(seriesId));
  const fetched = await Promise.allSettled(fetchPromises);

  fetched.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  });

  return results;
}

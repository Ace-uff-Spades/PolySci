// Bureau of Labor Statistics API
// Docs: https://www.bls.gov/developers/api_signature_v2.htm
// Limitations:
// - No API key required (public API)
// - Rate limits: Not publicly documented, but reasonable use expected
// - Data updates: Monthly (employment), monthly (CPI)
// - Historical data: Limited to recent years in public API
// - Series availability: Some series may require specific access or have limited history

export interface BLSDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes: Array<{ code: string; text: string }>;
}

export interface BLSSeriesData {
  seriesID: string;
  data: BLSDataPoint[];
}

interface BLSResponse {
  status: string;
  Results: {
    series: BLSSeriesData[];
  };
}

// Common series IDs
export const BLS_SERIES = {
  UNEMPLOYMENT_RATE: 'LNS14000000',
  CPI_ALL_URBAN: 'CUUR0000SA0',
  AVERAGE_HOURLY_EARNINGS: 'CES0500000003',
  NONFARM_PAYROLL: 'CES0000000001',
} as const;

const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

export async function fetchBLSData(
  seriesIds: string[],
  startYear?: string,
  endYear?: string
): Promise<BLSSeriesData[]> {
  const currentYear = new Date().getFullYear();

  const body = {
    seriesid: seriesIds,
    startyear: startYear ?? String(currentYear - 2),
    endyear: endYear ?? String(currentYear),
  };

  const response = await fetch(BLS_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`BLS API error: ${response.status}`);
  }

  const data: BLSResponse = await response.json();

  if (data.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API returned status: ${data.status}`);
  }

  return data.Results.series;
}

export async function getUnemploymentRate(): Promise<BLSDataPoint[]> {
  const series = await fetchBLSData([BLS_SERIES.UNEMPLOYMENT_RATE]);
  return series[0]?.data ?? [];
}

export async function getInflationData(): Promise<BLSDataPoint[]> {
  const series = await fetchBLSData([BLS_SERIES.CPI_ALL_URBAN]);
  return series[0]?.data ?? [];
}

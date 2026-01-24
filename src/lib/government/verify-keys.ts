/**
 * Utility to verify API keys are configured correctly
 * Can be called from API routes for debugging
 */

export interface KeyStatus {
  key: string;
  configured: boolean;
  error?: string;
}

export async function verifyAPIKeys(): Promise<{
  eia: KeyStatus;
  fred: KeyStatus;
}> {
  const eiaKey = process.env.EIA_API_KEY;
  const fredKey = process.env.FRED_API_KEY;

  const results = {
    eia: {
      key: 'EIA_API_KEY',
      configured: !!eiaKey,
    } as KeyStatus,
    fred: {
      key: 'FRED_API_KEY',
      configured: !!fredKey,
    } as KeyStatus,
  };

  // Test FRED API key if configured
  if (fredKey) {
    try {
      const testResponse = await fetch(
        'https://api.stlouisfed.org/fred/series?series_id=GDP&file_type=json&limit=1',
        {
          headers: {
            'Authorization': `Bearer ${fredKey}`,
          },
        }
      );

      if (testResponse.status === 401 || testResponse.status === 403) {
        results.fred.error = 'Invalid API key (authentication failed)';
      } else if (!testResponse.ok && testResponse.status !== 400) {
        results.fred.error = `API error: ${testResponse.status}`;
      } else {
        // Key appears valid (400 might be invalid series, but auth worked)
        results.fred.configured = true;
      }
    } catch (error) {
      results.fred.error = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Test EIA API key if configured
  if (eiaKey) {
    try {
      // Simple test request - EIA API structure is complex, so we just check if key is present
      // Actual validation would require a valid series ID and endpoint
      const testParams = new URLSearchParams({
        'api_key': eiaKey,
        'length': '1',
      });
      const testResponse = await fetch(
        `https://api.eia.gov/v2/electricity/electric-power-operational-data/data/?${testParams}`
      );

      if (testResponse.status === 401 || testResponse.status === 403) {
        results.eia.error = 'Invalid API key (authentication failed)';
      } else if (testResponse.status === 400) {
        // 400 might be invalid parameters, but key might be valid
        // We can't definitively test without valid series/endpoint
        results.eia.configured = true;
      } else if (!testResponse.ok) {
        results.eia.error = `API error: ${testResponse.status}`;
      } else {
        results.eia.configured = true;
      }
    } catch (error) {
      results.eia.error = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  return results;
}

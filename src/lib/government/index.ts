import { fetchBLSData, BLS_SERIES, BLSDataPoint } from './bls';
import { getFederalSpendingOverview, searchSpending } from './usaspending';
import { getPopulationData, getMedianIncomeData, CensusDataPoint } from './census';
import { searchBills, filterBillsByTopic, Bill } from './congress';
import { getEnergyDataForTopic, EIASeriesData } from './eia';
import { getEconomicDataForTopic, FREDSeriesData, FRED_SERIES } from './fred';
import { getTopicDataConfig } from './topic-mapping';
import { getCachedGovernmentData, cacheGovernmentData } from './cache';

export interface GovernmentData {
  economic: {
    unemployment?: BLSDataPoint[];
    inflation?: BLSDataPoint[];
    fred?: FREDSeriesData[]; // FRED economic data
  };
  spending: {
    overview?: { totalBudget: number };
    related?: any[]; // Topic-specific spending data
  };
  demographic: {
    population?: CensusDataPoint[];
    income?: CensusDataPoint[];
  };
  energy?: {
    eia?: EIASeriesData[]; // Energy data from EIA
  };
  legislative: {
    relatedBills?: Bill[];
  };
}

export interface GatherGovernmentDataOptions {
  /** When true, skip cache read and write (e.g. for eval pipeline) */
  skipCache?: boolean;
}

/**
 * Gather government data for a topic
 * Uses caching and topic-aware data selection
 */
export async function gatherGovernmentData(
  topic: string,
  options?: GatherGovernmentDataOptions
): Promise<GovernmentData> {
  const skipCache = options?.skipCache ?? false;

  if (!skipCache) {
    const cached = await getCachedGovernmentData(topic);
    if (cached) {
      console.log(`Government data cache hit for topic: ${topic}`);
      return cached;
    }
    console.log(`Government data cache miss for topic: ${topic}`);
  } else {
    console.log(`Government data cache skipped for topic: ${topic}`);
  }

  const results: GovernmentData = {
    economic: {},
    spending: {},
    demographic: {},
    legislative: {},
  };

  // Get topic-specific data configuration
  const config = getTopicDataConfig(topic);

  // Build list of data fetching promises
  const fetchPromises: Promise<any>[] = [];

  // Always fetch core BLS data (unemployment, inflation)
  fetchPromises.push(
    fetchBLSData([BLS_SERIES.UNEMPLOYMENT_RATE]).then(
      (series) => ({ type: 'unemployment', data: series[0]?.data }),
      () => ({ type: 'unemployment', data: null })
    )
  );
  fetchPromises.push(
    fetchBLSData([BLS_SERIES.CPI_ALL_URBAN]).then(
      (series) => ({ type: 'inflation', data: series[0]?.data }),
      () => ({ type: 'inflation', data: null })
    )
  );

  // Always fetch spending overview
  fetchPromises.push(
    getFederalSpendingOverview().then(
      (data) => ({ type: 'spendingOverview', data }),
      () => ({ type: 'spendingOverview', data: null })
    )
  );

  // Always fetch demographic data
  fetchPromises.push(
    getPopulationData().then(
      (data) => ({ type: 'population', data }),
      () => ({ type: 'population', data: null })
    )
  );
  fetchPromises.push(
    getMedianIncomeData().then(
      (data) => ({ type: 'income', data }),
      () => ({ type: 'income', data: null })
    )
  );

  // Topic-specific spending search
  if (config.searchSpending) {
    fetchPromises.push(
      searchSpending(topic).then(
        (data) => ({ type: 'spendingRelated', data }),
        () => ({ type: 'spendingRelated', data: [] })
      )
    );
  }

  // Topic-specific EIA data (energy)
  if (config.fetchEIA) {
    fetchPromises.push(
      getEnergyDataForTopic(topic).then(
        (data) => ({ type: 'eia', data }),
        () => ({ type: 'eia', data: [] })
      )
    );
  }

  // Topic-specific FRED data
  if (config.fredSeries && config.fredSeries.length > 0) {
    fetchPromises.push(
      getEconomicDataForTopic(topic).then(
        (data) => ({ type: 'fred', data }),
        () => ({ type: 'fred', data: [] })
      )
    );
  }

  // Congress bills search (use topic or config keywords)
  const searchKeywords = config.congressKeywords || [topic];
  fetchPromises.push(
    searchBills(searchKeywords.join(' ')).then(
      (data) => ({ type: 'bills', data }),
      () => ({ type: 'bills', data: [] })
    )
  );

  // Fetch all data in parallel
  const fetchResults = await Promise.allSettled(fetchPromises);

  // Process results
  fetchResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { type, data } = result.value;
      
      switch (type) {
        case 'unemployment':
          if (data) results.economic.unemployment = data;
          break;
        case 'inflation':
          if (data) results.economic.inflation = data;
          break;
        case 'spendingOverview':
          if (data) results.spending.overview = data;
          break;
        case 'spendingRelated':
          if (data && data.length > 0) {
            results.spending.related = data;
          }
          break;
        case 'population':
          if (data) results.demographic.population = data;
          break;
        case 'income':
          if (data) results.demographic.income = data;
          break;
        case 'eia':
          if (data && data.length > 0) {
            results.energy = { eia: data };
          }
          break;
        case 'fred':
          if (data && data.length > 0) {
            results.economic.fred = data;
          }
          break;
        case 'bills':
          if (data && data.length > 0) {
            results.legislative.relatedBills = filterBillsByTopic(data, searchKeywords);
          }
          break;
      }
    }
  });

  if (!skipCache) {
    await cacheGovernmentData(topic, results);
  }

  return results;
}

export * from './bls';
export * from './usaspending';
export * from './census';
export * from './congress';
export * from './eia';
export * from './fred';
export * from './topic-mapping';
export * from './cache';

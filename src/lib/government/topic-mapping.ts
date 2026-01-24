/**
 * Topic-to-data-series mapping system
 * Maps topic keywords to relevant data sources and series
 */

export interface TopicDataConfig {
  // BLS series to fetch
  blsSeries?: string[];
  // Whether to search spending data
  searchSpending?: boolean;
  // Whether to fetch EIA data
  fetchEIA?: boolean;
  // FRED series to fetch
  fredSeries?: string[];
  // Additional keywords for Congress.gov search
  congressKeywords?: string[];
}

/**
 * Map topic to relevant data sources
 */
export function getTopicDataConfig(topic: string): TopicDataConfig {
  const topicLower = topic.toLowerCase();
  const config: TopicDataConfig = {};

  // AI / Technology
  if (
    topicLower.includes('ai') ||
    topicLower.includes('artificial intelligence') ||
    topicLower.includes('technology') ||
    topicLower.includes('tech')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['artificial intelligence', 'technology', 'innovation'];
    // BLS has tech employment data but requires specific series IDs
  }

  // Climate / Energy / Environment
  if (
    topicLower.includes('climate') ||
    topicLower.includes('energy') ||
    topicLower.includes('carbon') ||
    topicLower.includes('emission') ||
    topicLower.includes('renewable')
  ) {
    config.fetchEIA = true;
    config.searchSpending = true;
    config.congressKeywords = ['climate', 'energy', 'environment', 'renewable'];
  }

  // Immigration
  if (
    topicLower.includes('immigration') ||
    topicLower.includes('immigrant') ||
    topicLower.includes('border') ||
    topicLower.includes('visa')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['immigration', 'border', 'visa', 'citizenship'];
    // Could add Census data for immigrant population stats
  }

  // Healthcare
  if (
    topicLower.includes('healthcare') ||
    topicLower.includes('health care') ||
    topicLower.includes('medicare') ||
    topicLower.includes('medicaid') ||
    topicLower.includes('health')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['healthcare', 'health', 'medicare', 'medicaid'];
  }

  // Trade / Economy
  if (
    topicLower.includes('trade') ||
    topicLower.includes('tariff') ||
    topicLower.includes('import') ||
    topicLower.includes('export') ||
    topicLower.includes('economy') ||
    topicLower.includes('economic')
  ) {
    config.fredSeries = ['TRADE_BALANCE', 'EXPORTS', 'IMPORTS'];
    config.searchSpending = true;
    config.congressKeywords = ['trade', 'tariff', 'economy'];
  }

  // Budget / Debt / Deficit
  if (
    topicLower.includes('budget') ||
    topicLower.includes('debt') ||
    topicLower.includes('deficit') ||
    topicLower.includes('spending')
  ) {
    config.fredSeries = ['FEDERAL_DEBT', 'FEDERAL_DEFICIT'];
    config.searchSpending = true;
    config.congressKeywords = ['budget', 'appropriations', 'spending'];
  }

  // Foreign Policy / International
  if (
    topicLower.includes('foreign policy') ||
    topicLower.includes('international') ||
    topicLower.includes('china') ||
    topicLower.includes('russia') ||
    topicLower.includes('venezuela') ||
    topicLower.includes('monroe doctrine')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['foreign policy', 'international', 'diplomacy'];
  }

  // Elections / Democracy
  if (
    topicLower.includes('election') ||
    topicLower.includes('democracy') ||
    topicLower.includes('voting') ||
    topicLower.includes('polarization')
  ) {
    config.congressKeywords = ['election', 'voting', 'democracy'];
    // Could add voter registration/turnout data if available
  }

  // Income / Poverty / Inequality
  if (
    topicLower.includes('income') ||
    topicLower.includes('poverty') ||
    topicLower.includes('inequality') ||
    topicLower.includes('wage')
  ) {
    config.fredSeries = ['MEDIAN_HOUSEHOLD_INCOME', 'PERSONAL_INCOME'];
    config.congressKeywords = ['income', 'poverty', 'wage'];
  }

  // Housing
  if (
    topicLower.includes('housing') ||
    topicLower.includes('home') ||
    topicLower.includes('mortgage')
  ) {
    config.fredSeries = ['HOUSING_STARTS', 'MEDIAN_HOME_PRICE'];
    config.congressKeywords = ['housing', 'mortgage'];
  }

  // Default: always include core economic indicators
  if (!config.fredSeries) {
    config.fredSeries = ['GDP', 'UNEMPLOYMENT_RATE', 'CPI'];
  }

  return config;
}

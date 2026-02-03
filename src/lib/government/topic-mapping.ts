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

  // Abortion / Reproductive rights (before Healthcare so "Abortion Rights" gets specific bills)
  if (
    topicLower.includes('abortion') ||
    topicLower.includes('reproductive') ||
    topicLower.includes('roe') ||
    topicLower.includes('pro-life') ||
    topicLower.includes('pro-choice')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['abortion', 'reproductive', 'roe', 'women\'s health'];
  }

  // LGBTQ+ Rights (before Healthcare so not lumped under "health")
  if (
    topicLower.includes('lgbtq') ||
    topicLower.includes('lgbt') ||
    topicLower.includes('same-sex') ||
    topicLower.includes('marriage equality') ||
    topicLower.includes('transgender') ||
    topicLower.includes('sexual orientation') ||
    topicLower.includes('gender identity')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['lgbtq', 'same-sex', 'marriage', 'transgender', 'discrimination', 'equality'];
  }

  // Racial Justice & Systemic Racism
  if (
    topicLower.includes('racial justice') ||
    topicLower.includes('systemic racism') ||
    topicLower.includes('civil rights') ||
    topicLower.includes('affirmative action') ||
    topicLower.includes('reparations') ||
    (topicLower.includes('racial') && (topicLower.includes('justice') || topicLower.includes('racism')))
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['civil rights', 'discrimination', 'affirmative action', 'racial', 'justice'];
  }

  // Criminal Justice & Policing
  if (
    topicLower.includes('criminal justice') ||
    topicLower.includes('policing') ||
    topicLower.includes('incarceration') ||
    topicLower.includes('prison reform') ||
    topicLower.includes('police reform') ||
    (topicLower.includes('police') && topicLower.includes('reform'))
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['criminal justice', 'policing', 'incarceration', 'prison', 'police', 'reform'];
  }

  // Free Speech & Cancel Culture
  if (
    topicLower.includes('free speech') ||
    topicLower.includes('cancel culture') ||
    topicLower.includes('first amendment') ||
    topicLower.includes('censorship') ||
    topicLower.includes('free expression')
  ) {
    config.congressKeywords = ['free speech', 'first amendment', 'censorship', 'expression'];
  }

  // Religion in Public Life
  if (
    topicLower.includes('religious freedom') ||
    topicLower.includes('establishment clause') ||
    topicLower.includes('separation of church') ||
    topicLower.includes('secular') ||
    (topicLower.includes('religion') && (topicLower.includes('public') || topicLower.includes('life')))
  ) {
    config.congressKeywords = ['religion', 'religious freedom', 'establishment', 'secular'];
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

  // Foreign Policy / Military
  if (
    topicLower.includes('foreign policy') ||
    topicLower.includes('military') ||
    topicLower.includes('defense') ||
    topicLower.includes('international') ||
    topicLower.includes('china') ||
    topicLower.includes('russia') ||
    topicLower.includes('venezuela') ||
    topicLower.includes('monroe doctrine')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['foreign policy', 'military', 'defense', 'international', 'diplomacy'];
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

  // Taxes / Wealth redistribution
  if (
    topicLower.includes('tax') ||
    topicLower.includes('wealth') ||
    topicLower.includes('redistribution')
  ) {
    config.fredSeries = ['MEDIAN_HOUSEHOLD_INCOME', 'PERSONAL_INCOME'];
    config.searchSpending = true;
    config.congressKeywords = ['tax', 'wealth', 'appropriations', 'welfare', 'social program'];
  }

  // Education
  if (
    topicLower.includes('education') ||
    topicLower.includes('school') ||
    topicLower.includes('student')
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['education', 'school', 'funding', 'student'];
  }

  // Gun control / Second Amendment
  if (
    topicLower.includes('gun') ||
    topicLower.includes('firearm') ||
    topicLower.includes('second amendment')
  ) {
    config.congressKeywords = ['gun', 'firearm', 'second amendment', 'weapon'];
  }

  // Size / scope of government (minimal government, regulation)
  if (
    (topicLower.includes('size') || topicLower.includes('scope')) && topicLower.includes('government') ||
    topicLower.includes('minimal government') ||
    (topicLower.includes('government') && topicLower.includes('regulation'))
  ) {
    config.searchSpending = true;
    config.congressKeywords = ['government', 'regulation', 'federal', 'appropriations'];
  }

  // Default: always include core economic indicators
  if (!config.fredSeries) {
    config.fredSeries = ['GDP', 'UNEMPLOYMENT_RATE', 'CPI'];
  }

  return config;
}

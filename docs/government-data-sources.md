# Government Data Sources Documentation

## Overview

PolySci uses multiple government data sources to provide quantitative evidence for political analysis. Each source has specific limitations and use cases.

## Data Sources

### 1. Bureau of Labor Statistics (BLS)

**Purpose**: Employment, inflation, and labor market data

**API**: https://www.bls.gov/developers/api_signature_v2.htm

**Limitations**:
- No API key required (public API)
- Rate limits: Not publicly documented, but reasonable use expected
- Data updates: Monthly (employment), monthly (CPI)
- Historical data: Limited to recent years in public API
- Series availability: Some series may require specific access or have limited history

**Data Provided**:
- Unemployment rate
- Consumer Price Index (CPI)
- Average hourly earnings
- Nonfarm payroll employment

**Caching**: 6 hours (government data updates infrequently)

---

### 2. USAspending.gov

**Purpose**: Federal spending, contracts, and grants data

**API**: https://api.usaspending.gov/

**Limitations**:
- No API key required (public API)
- Rate limits: Not publicly documented
- Data updates: Daily for recent transactions, historical data available
- Search limitations: Keyword search may not return all relevant results
- Data granularity: Some spending categories may be aggregated

**Data Provided**:
- Federal budget overview
- Spending by category
- Agency spending
- Topic-specific spending (via keyword search)

**Caching**: 6 hours

---

### 3. U.S. Census Bureau

**Purpose**: Demographic and economic data

**API**: Various endpoints (we use specific data endpoints)

**Limitations**:
- No API key required for basic data (public API)
- Rate limits: Vary by endpoint
- Data updates: Annual for most demographic data
- Data availability: Some datasets may have delays in publication
- Geographic granularity: Varies by dataset

**Data Provided**:
- Population data
- Median household income
- Other demographic indicators

**Caching**: 6 hours

---

### 4. Congress.gov

**Purpose**: Legislative data (bills, votes, members)

**API**: https://api.congress.gov/

**Limitations**:
- API key required (free registration)
- Rate limits: Not publicly documented
- Data updates: Real-time for new bills, historical data available
- Search limitations: Keyword search may miss related bills
- Data completeness: Some bills may have incomplete metadata

**Data Provided**:
- Related bills by topic
- Bill titles and summaries
- Legislative history

**Caching**: 6 hours

---

### 5. Energy Information Administration (EIA)

**Purpose**: Energy production, consumption, and prices

**API**: https://www.eia.gov/opendata/documentation.php

**Limitations**:
- **API key required** (free registration at https://www.eia.gov/opendata/register.php)
- Rate limits: Not publicly documented, but reasonable use expected
- Max response size: 5,000 rows per request (300 in XML)
- Data updates: Varies by series (daily, weekly, monthly)
- Series availability: Requires specific series IDs (not all data searchable)
- Data scope: Energy-related topics only

**Data Provided**:
- Electricity generation (total, renewable, by fuel type)
- Energy prices (retail electricity, gasoline)
- Energy consumption
- Natural gas and petroleum data

**Caching**: 6 hours

**Configuration**: Set `EIA_API_KEY` in environment variables (`.env.local`)

**API Authentication**: Uses `api_key` query parameter

---

### 6. Federal Reserve Economic Data (FRED)

**Purpose**: Broad economic indicators and time series data

**API**: https://fred.stlouisfed.org/docs/api/fred/

**Limitations**:
- **API key required** (free registration at https://fredaccount.stlouisfed.org/apikeys)
- Rate limits: **120 requests per minute** (documented)
- Data updates: Varies by series (daily, weekly, monthly, quarterly, annual)
- Historical data: Varies by series (some have limited history)
- Series availability: Requires specific series IDs (over 800,000 series available)
- Data completeness: Some series may have gaps or revisions

**Data Provided**:
- GDP and economic growth
- Employment indicators
- Inflation measures
- Interest rates
- Trade data
- Government debt and deficit
- Income and housing data

**Caching**: 6 hours

**Configuration**: Set `FRED_API_KEY` in environment variables (`.env.local`)

**API Authentication**: FRED API v2 uses Bearer token in Authorization header: `Authorization: Bearer {api_key}`

---

## Caching Strategy

### Cache Duration
- **6 hours** for all government data sources
- Government data updates less frequently than news data
- Balance between freshness and API rate limits

### Cache Key Generation
- Uses MD5 hash of normalized topic string
- Ensures consistent caching across requests

### Cache Organization
- Firebase Firestore collection: `government_data_cache`
- Each document contains:
  - Topic (normalized)
  - Complete GovernmentData object
  - Timestamps (cachedAt, expiresAt)

### Cache Efficiency
- Single cache lookup per topic
- Reduces API calls significantly
- Allows reuse of data across multiple perspectives for same topic
- Automatic expiration handling

---

## Topic-Aware Data Selection

The system uses `getTopicDataConfig()` to determine which data sources to query based on topic keywords:

- **AI/Technology**: Spending search, Congress bills
- **Climate/Energy**: EIA data, spending search, Congress bills
- **Immigration**: Spending search, Congress bills
- **Healthcare**: Spending search, Congress bills
- **Trade/Economy**: FRED trade series, spending search
- **Budget/Debt**: FRED debt/deficit series, spending search
- **Income/Poverty**: FRED income series, Congress bills
- **Housing**: FRED housing series, Congress bills
- **Default**: Core economic indicators (GDP, unemployment, CPI)

---

## Error Handling

All data sources use `Promise.allSettled()` to fetch in parallel with graceful failures:
- If one source fails, others continue
- Missing API keys result in warnings, not errors
- Invalid series IDs return null gracefully
- Network errors are logged but don't break the flow

---

## Best Practices

1. **API Keys**: Register for EIA and FRED APIs (free) to enable full functionality
2. **Rate Limiting**: Be mindful of FRED's 120 requests/minute limit
3. **Caching**: Cache is checked first, reducing API calls
4. **Topic Specificity**: Use topic-aware selection to get relevant data
5. **Error Tolerance**: System continues even if some sources fail

---

## Future Enhancements

Potential additional data sources:
- **Data.gov**: Topic-specific datasets (requires exploration)
- **CDC**: Health statistics (for healthcare topics)
- **DHS**: Immigration statistics (for immigration topics)
- **EPA**: Environmental data (for climate topics)
- **BEA**: Economic accounts data (complements FRED)

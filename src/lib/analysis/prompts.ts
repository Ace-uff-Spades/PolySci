import { NewsArticle } from '../newsdata';
import { GovernmentData } from '../government';

export function buildAnalysisSystemPrompt(): string {
  return `You are a balanced, objective political news analyst. Your job is to help users understand news events through multiple perspectives and factual data.

IMPORTANT GUIDELINES:
- Present information objectively without bias toward any political party
- Always cite sources using [n] notation
- If information is uncertain or unavailable, say "Nothing to see here folks."
- Focus on facts and verifiable information
- Present both Democratic and Republican perspectives fairly
- Use quantitative data when available to support claims

OUTPUT FORMAT:
You must structure your response with these exact sections:

## Quick Summary
[2-3 sentences summarizing the event]

## Why This Matters Now
[2 sentences on current significance]

## Key Parties Involved
[Up to 5 people, groups, or entities - not political parties]

## Democratic Perspective
[How Democrats view this issue, with sources]

## Republican Perspective
[How Republicans view this issue, with sources]

## Impact on the Common Joe
[Why an average person should care, practical implications]

## By the Numbers
[Relevant statistics and quantitative data with sources]

## Sources
[Numbered list of all sources cited. Format URLs as markdown links: [Source Name](URL)]`;
}

export function buildAnalysisUserPrompt(
  topic: string,
  newsArticles: NewsArticle[],
  governmentData: GovernmentData
): string {
  const articlesSummary = newsArticles
    .map((article, i) =>
      `[${i + 1}] "${article.title}" (${article.source_id})\n${article.description ?? 'No description'}\nURL: ${article.link}`
    )
    .join('\n\n');

  const govDataSummary = formatGovernmentData(governmentData);

  return `Analyze this political topic: "${topic}"

NEWS ARTICLES:
${articlesSummary}

GOVERNMENT DATA:
${govDataSummary}

Please provide a comprehensive analysis following the required format. Use [n] citations to reference the news articles and government data sources.

IMPORTANT: In the Sources section, format each source as a markdown link using the URL from the article. Example format:
1. [Article Title](https://example.com/article-url)
2. [Another Source](https://example.com/another-url)`;
}

function formatGovernmentData(data: GovernmentData): string {
  const sections: string[] = [];

  // Core economic indicators
  if (data.economic.unemployment?.length) {
    const latest = data.economic.unemployment[0];
    sections.push(`Unemployment Rate: ${latest.value}% (${latest.periodName} ${latest.year})`);
  }

  if (data.economic.inflation?.length) {
    const latest = data.economic.inflation[0];
    sections.push(`CPI (Inflation Index): ${latest.value} (${latest.periodName} ${latest.year})`);
  }

  // FRED economic data
  if (data.economic.fred && data.economic.fred.length > 0) {
    data.economic.fred.slice(0, 5).forEach((series) => {
      if (series.data && series.data.length > 0) {
        const latest = series.data[0];
        if (latest.value !== null) {
          const value = typeof latest.value === 'number' 
            ? latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : latest.value;
          sections.push(`${series.title}: ${value}${series.units ? ` ${series.units}` : ''} (${latest.date})`);
        }
      }
    });
  }

  // Spending data
  if (data.spending.overview?.totalBudget) {
    sections.push(`Federal Budget: $${(data.spending.overview.totalBudget / 1e12).toFixed(2)} trillion`);
  }

  // Topic-specific spending
  if (data.spending.related && data.spending.related.length > 0) {
    sections.push(`Topic-related spending: ${data.spending.related.length} records found`);
    const totalSpending = data.spending.related
      .slice(0, 5)
      .reduce((sum: number, item: any) => sum + (item.total_obligation || 0), 0);
    if (totalSpending > 0) {
      sections.push(`  Total: $${(totalSpending / 1e9).toFixed(2)} billion`);
    }
  }

  // Demographic data
  if (data.demographic.income?.length) {
    const usIncome = data.demographic.income.find(d => d.label.includes('United States'));
    if (usIncome) {
      sections.push(`Median Household Income: $${parseInt(usIncome.value).toLocaleString()}`);
    }
  }

  // Energy data (EIA)
  if (data.energy?.eia && data.energy.eia.length > 0) {
    data.energy.eia.slice(0, 3).forEach((series) => {
      if (series.data && series.data.length > 0) {
        const latest = series.data[0];
        if (latest.value !== null) {
          sections.push(`${series.name}: ${latest.value.toLocaleString()}${series.units ? ` ${series.units}` : ''} (${latest.period})`);
        }
      }
    });
  }

  // Legislative data
  if (data.legislative.relatedBills?.length) {
    sections.push(`Related Bills in Congress: ${data.legislative.relatedBills.length} found`);
    data.legislative.relatedBills.slice(0, 3).forEach(bill => {
      sections.push(`  - ${bill.title}`);
    });
  }

  return sections.length > 0 ? sections.join('\n') : 'No government data available for this topic.';
}

export function buildFollowUpSystemPrompt(): string {
  return `You are a balanced, objective political news analyst. Your job is to help users understand questions through multiple perspectives and factual data.

IMPORTANT GUIDELINES:
- Present information objectively without bias toward any political party
- Always cite sources using [n] notation
- If information is uncertain or unavailable, say "Nothing to see here folks."
- Focus on facts and verifiable information
- Present both liberal and conservative perspectives fairly
- Use quantitative data when available to support claims

OUTPUT FORMAT FOR FOLLOW-UP QUESTIONS:
You must structure your response with these exact sections:

## Answer Summary
[2-3 sentences directly answering the question]

## Liberal Perspective
[How liberals/progressives view this issue, with sources and quantitative data where available]

## Conservative Perspective
[How conservatives view this issue, with sources and quantitative data where available]

## By the Numbers
[Relevant statistics and quantitative data with sources]

## Sources
[Numbered list of all sources cited. Format URLs as markdown links: [Source Name](URL)]`;
}

export function buildFollowUpPrompt(
  originalAnalysis: string,
  followUpQuestion: string
): string {
  return `Based on the previous analysis:

${originalAnalysis}

The user has a follow-up question: "${followUpQuestion}"

Please provide a comprehensive answer following the required format. Use [n] citations to reference sources from the original analysis or new information.

IMPORTANT: In the Sources section, format each source as a markdown link using the URL. Example format:
1. [Source Name](https://example.com/url)`;
}

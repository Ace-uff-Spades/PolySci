import type { GovernmentData } from './index';

/** Format government data for LLM prompts (shared by analysis, socratic, contrarian). */
export function formatGovernmentData(data: GovernmentData): string {
  const sections: string[] = [];
  if (data.economic.unemployment?.length) {
    const latest = data.economic.unemployment[0];
    sections.push(`Unemployment Rate: ${latest.value}% (${latest.periodName} ${latest.year})`);
  }
  if (data.economic.inflation?.length) {
    const latest = data.economic.inflation[0];
    sections.push(`CPI (Inflation Index): ${latest.value} (${latest.periodName} ${latest.year})`);
  }
  if (data.economic.fred?.length) {
    data.economic.fred.slice(0, 5).forEach((series) => {
      if (series.data?.length) {
        const latest = series.data[0];
        if (latest.value !== null) {
          const value = typeof latest.value === 'number' ? latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : latest.value;
          sections.push(`${series.title}: ${value}${series.units ? ` ${series.units}` : ''} (${latest.date})`);
        }
      }
    });
  }
  if (data.spending.overview?.totalBudget) {
    sections.push(`Federal Budget: $${(data.spending.overview.totalBudget / 1e12).toFixed(2)} trillion`);
  }
  if (data.spending.related?.length) {
    sections.push(`Topic-related spending: ${data.spending.related.length} records found`);
    const total = data.spending.related.slice(0, 5).reduce((sum: number, item: any) => sum + (item.total_obligation || 0), 0);
    if (total > 0) sections.push(`  Total: $${(total / 1e9).toFixed(2)} billion`);
  }
  if (data.demographic.income?.length) {
    const usIncome = data.demographic.income.find(d => d.label.includes('United States'));
    if (usIncome) sections.push(`Median Household Income: $${parseInt(usIncome.value).toLocaleString()}`);
  }
  if (data.energy?.eia?.length) {
    data.energy.eia.slice(0, 3).forEach((series) => {
      if (series.data?.length) {
        const latest = series.data[0];
        if (latest.value !== null) sections.push(`${series.name}: ${latest.value.toLocaleString()}${series.units ? ` ${series.units}` : ''} (${latest.period})`);
      }
    });
  }
  if (data.legislative.relatedBills?.length) {
    sections.push(`Related Bills in Congress: ${data.legislative.relatedBills.length} found`);
    data.legislative.relatedBills.slice(0, 3).forEach(bill => sections.push(`  - ${bill.title}`));
  }
  return sections.length ? sections.join('\n') : 'No government data available for this topic.';
}

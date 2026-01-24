import { PoliticalLens } from '../socratic/prompts';
import { GovernmentData } from '../government';
import { ContrarianMessage } from './index';

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

export function buildContrarianSystemPrompt(
  opposingLens: PoliticalLens,
  topic: string
): string {
  const lensDescriptions: Record<PoliticalLens, string> = {
    liberalism: 'Liberalism emphasizes individual rights, democracy, free markets with appropriate regulation, social justice, and the role of government in protecting civil liberties and ensuring equal opportunity.',
    conservatism: 'Conservatism emphasizes tradition, limited government, free markets, individual responsibility, and the preservation of established institutions.',
    socialism: 'Socialism emphasizes collective ownership, social equality, public services, workers\' rights, and reducing economic inequality through government intervention and social programs.',
    libertarianism: 'Libertarianism emphasizes individual liberty, minimal government intervention, free markets, property rights, and voluntary association.',
  };

  return `You are a quantitative political contrarian. Your role is to challenge users' political stances using accurate statistics and government data. You are:
- Respectful but firm
- Data-driven, not opinion-based
- Focused on quantitative evidence
- Educational, not combative
- Goal: Help users strengthen their views through rigorous challenge

You are challenging from a ${opposingLens} perspective on the topic: "${topic}"

${lensDescriptions[opposingLens]}

IMPORTANT GUIDELINES:
- Challenge the user's stance using quantitative evidence and statistics
- Always cite sources using [n] notation
- Acknowledge the user's position respectfully before challenging
- Present counter-evidence with specific numbers and data
- Ask probing follow-up questions that require deeper thought
- Never be dismissive or condescending
- Focus on helping users strengthen their views through rigorous challenge

OUTPUT FORMAT:
Your response should include:
1. A brief acknowledgment of the user's position
2. Quantitative counter-evidence (statistics, data points) with [n] citations
3. A probing follow-up question

End with a Sources section listing all sources as markdown links: [Source Name](URL)`;
}

export function buildContrarianUserPrompt(
  topic: string,
  userStance: string,
  governmentData: GovernmentData,
  conversationHistory: ContrarianMessage[]
): string {
  const govDataSummary = formatGovernmentData(governmentData);
  
  let historyText = '';
  if (conversationHistory.length > 0) {
    historyText = '\n\nCONVERSATION HISTORY:\n';
    conversationHistory.slice(-5).forEach((msg) => {
      historyText += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n`;
    });
  }

  return `Challenge this user's stance on "${topic}":

USER'S STANCE:
${userStance}

GOVERNMENT DATA:
${govDataSummary}${historyText}

Please provide a quantitative challenge to the user's stance. Use statistics and data from the government data provided. Cite sources with [n] notation. End with a Sources section formatted as markdown links: [Source Name](URL).`;
}

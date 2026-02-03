import { Source } from '../analysis/sources';

export interface FormattedResponse {
  sections: {
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    followUpQuestion: string;
  };
  sources: Source[];
}

/**
 * Formats structured response for display
 * Links citations in statistics
 * No parsing needed - JSON mode handles structure
 */
export function formatForDisplay(
  sections: {
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    followUpQuestion: string;
  },
  sources: Source[]
): FormattedResponse {
  // Link citations in statistics
  const linkCitations = (stats: Array<{ text: string; citation?: number }>) => {
    return stats.map(stat => {
      if (stat.citation) {
        const source = sources.find(s => s.number === stat.citation);
        if (source) {
          // Replace [n] with markdown link
          const linkedText = stat.text.replace(
            `[${stat.citation}]`,
            `[${stat.citation}](${source.url} "${source.name}")`
          );
          return { ...stat, text: linkedText };
        }
      }
      return stat;
    });
  };

  return {
    sections: {
      ...sections,
      keyStatisticsFor: sections.keyStatisticsFor 
        ? linkCitations(sections.keyStatisticsFor) 
        : undefined,
      keyStatisticsAgainst: sections.keyStatisticsAgainst 
        ? linkCitations(sections.keyStatisticsAgainst) 
        : undefined,
    },
    sources,
  };
}

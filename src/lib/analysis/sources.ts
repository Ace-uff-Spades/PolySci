/**
 * Extracts sources from markdown analysis text
 * Looks for the "## Sources" section and extracts markdown links
 */
export interface Source {
  number: number;
  name: string;
  url: string;
}

export function extractSources(analysis: string): Source[] {
  const sources: Source[] = [];
  
  // Find the Sources section
  const sourcesMatch = analysis.match(/##\s+Sources\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (!sourcesMatch) {
    // Try to extract sources from inline citations if no Sources section
    return extractSourcesFromCitations(analysis);
  }

  const sourcesText = sourcesMatch[1];
  
  // Match markdown links: [Name](URL) or numbered lists with links
  const linkRegex = /(?:^\d+\.\s*)?\[([^\]]+)\]\(([^)]+)\)/gm;
  let match;
  let number = 1;

  while ((match = linkRegex.exec(sourcesText)) !== null) {
    sources.push({
      number: number++,
      name: match[1],
      url: match[2],
    });
  }

  // Fallbacks when no markdown links: "n. Name - URL", "n. Name (URL)", "n. Name: URL"
  if (sources.length === 0) {
    const patterns: RegExp[] = [
      /^\d+\.\s*(.+?)\s*-\s*(https?:\/\/[^\s]+)/gm,
      /^\d+\.\s*([^(]+)\(\s*(https?:\/\/[^\s)]+)\s*\)/gm,
      /^\d+\.\s*(.+?)\s*:\s*(https?:\/\/\S+)/gm,
    ];
    for (const re of patterns) {
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(sourcesText)) !== null) {
        sources.push({
          number: number++,
          name: m[1].trim(),
          url: m[2].trim(),
        });
      }
      if (sources.length > 0) break;
      number = 1;
    }
  }

  // If still no sources, try extracting from citations in text
  if (sources.length === 0) {
    return extractSourcesFromCitations(analysis);
  }

  return sources;
}

/**
 * Extracts sources from inline citations in the text
 * Looks for patterns like [1](url) or [source1](url)
 */
function extractSourcesFromCitations(text: string): Source[] {
  const sources: Source[] = [];
  const citationRegex = /\[([^\]]*?)(\d+)([^\]]*?)\]\(([^)]+)\)/g;
  let match;
  const seenUrls = new Set<string>();

  while ((match = citationRegex.exec(text)) !== null) {
    const num = parseInt(match[2], 10);
    const url = match[4];
    
    // Avoid duplicates
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      sources.push({
        number: num,
        name: match[1] || `Source ${num}`,
        url: url,
      });
    }
  }

  // Sort by number
  return sources.sort((a, b) => a.number - b.number);
}

/**
 * Replaces [n] citations in text with clickable links
 * Handles formats: [1], [n1], [n], [source1], etc.
 */
export function makeCitationsClickable(
  text: string,
  sources: Source[]
): string {
  if (sources.length === 0) {
    return text;
  }

  // Replace various citation formats with clickable links
  // Matches: [1], [n1], [source1], [n], etc.
  // Extracts the number from the citation
  return text.replace(/\[([^\]]*?)(\d+)([^\]]*?)\]/g, (match, prefix, num, suffix) => {
    const sourceNum = parseInt(num, 10);
    const source = sources.find((s) => s.number === sourceNum);
    if (source) {
      // Preserve the original format but make it a link
      return `[${prefix}${num}${suffix}](${source.url} "${source.name}")`;
    }
    // If no source found, try to extract just the number
    if (prefix === '' && suffix === '') {
      // Simple [n] format
      return match; // Return as-is if no source found
    }
    return match;
  });
}

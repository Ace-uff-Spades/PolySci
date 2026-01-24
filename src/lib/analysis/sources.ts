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
    return sources;
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

  return sources;
}

/**
 * Replaces [n] citations in text with clickable links
 */
export function makeCitationsClickable(
  text: string,
  sources: Source[]
): string {
  if (sources.length === 0) {
    return text;
  }

  // Replace [n] with clickable links
  return text.replace(/\[(\d+)\]/g, (match, num) => {
    const sourceNum = parseInt(num, 10);
    const source = sources.find((s) => s.number === sourceNum);
    if (source) {
      return `[${num}](${source.url} "${source.name}")`;
    }
    return match;
  });
}

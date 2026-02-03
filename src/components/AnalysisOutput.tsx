'use client';

import ReactMarkdown from 'react-markdown';
import { extractSources, makeCitationsClickable, Source } from '@/lib/analysis/sources';

interface AnalysisOutputProps {
  content: string | null;
  isLoading: boolean;
}

export function AnalysisOutput({ content, isLoading }: AnalysisOutputProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#E7E5E4] rounded w-3/4"></div>
          <div className="h-4 bg-[#E7E5E4] rounded w-full"></div>
          <div className="h-4 bg-[#E7E5E4] rounded w-5/6"></div>
          <div className="h-8 bg-[#E7E5E4] rounded w-1/2 mt-6"></div>
          <div className="h-4 bg-[#E7E5E4] rounded w-full"></div>
          <div className="h-4 bg-[#E7E5E4] rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-[#78716C]">
        <p>Submit a topic to see analysis here</p>
      </div>
    );
  }

  // Extract sources from the content
  const sources = extractSources(content);
  
  // Remove the Sources section from the main content (we'll display it separately)
  let contentWithoutSources = content.replace(/##\s+Sources\s*\n[\s\S]*$/i, '').trim();
  
  // Make citations clickable
  contentWithoutSources = makeCitationsClickable(contentWithoutSources, sources);

  return (
    <div>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ node, ...props }) => (
              <h2
                {...props}
                className="text-xl font-bold text-[#1C1917] mt-8 mb-4 pb-2 border-b border-[#D6D3D1]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                {...props}
                className="text-lg font-semibold text-[#1C1917] mt-6 mb-3"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="text-[#1C1917] leading-relaxed mb-4" />
            ),
            ul: ({ node, ...props }) => (
              <ul {...props} className="list-disc list-inside mb-4 space-y-2 text-[#1C1917]" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="list-decimal list-inside mb-4 space-y-2 text-[#1C1917]" />
            ),
            li: ({ node, ...props }) => (
              <li {...props} className="ml-4" />
            ),
            strong: ({ node, ...props }) => (
              <strong {...props} className="font-semibold text-[#1C1917]" />
            ),
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B8E6F] hover:text-[#475569] underline font-medium"
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                {...props}
                className="border-l-4 border-[#6B8E6F] pl-4 italic text-[#78716C] my-4"
              />
            ),
          }}
        >
          {contentWithoutSources}
        </ReactMarkdown>
      </div>

      {/* Sources section at the bottom */}
      {sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[#D6D3D1]">
          <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Sources
          </h3>
          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.number} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6B8E6F] hover:text-[#475569] underline font-medium"
                >
                  {source.number}. {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

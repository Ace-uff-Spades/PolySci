'use client';

import ReactMarkdown from 'react-markdown';
import { extractSources, makeCitationsClickable, Source } from '@/lib/analysis/sources';

interface PerspectiveViewProps {
  content: string;
  lens: 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism';
}

const lensColors = {
  liberalism: {
    border: 'border-[#475569]',
    bg: 'bg-[#F5F5F4]',
    text: 'text-[#475569]',
  },
  conservatism: {
    border: 'border-[#6B8E6F]',
    bg: 'bg-[#F5F5F4]',
    text: 'text-[#6B8E6F]',
  },
  socialism: {
    border: 'border-[#F59E0B]',
    bg: 'bg-[#F5F5F4]',
    text: 'text-[#D97706]',
  },
  libertarianism: {
    border: 'border-[#78716C]',
    bg: 'bg-[#F5F5F4]',
    text: 'text-[#78716C]',
  },
};

export function PerspectiveView({ content, lens }: PerspectiveViewProps) {
  if (!content) {
    return (
      <div className="text-center py-12 text-[#78716C]">
        <p>No perspective available</p>
      </div>
    );
  }

  // Extract sources from the content
  const sources = extractSources(content);
  
  // Remove the Sources section from the main content (we'll display it separately)
  let contentWithoutSources = content.replace(/##\s+Sources\s*\n[\s\S]*$/i, '').trim();
  
  // Make citations clickable
  contentWithoutSources = makeCitationsClickable(contentWithoutSources, sources);

  const colors = lensColors[lens];

  return (
    <div className={`border-l-4 ${colors.border} pl-4`}>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ node, ...props }) => (
              <h2
                {...props}
                className={`text-xl font-bold ${colors.text} mt-8 mb-4 pb-2 border-b ${colors.border}`}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                {...props}
                className={`text-lg font-semibold ${colors.text} mt-6 mb-3`}
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
              <strong {...props} className={`font-semibold ${colors.text}`} />
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
                className={`border-l-4 ${colors.border} pl-4 italic text-[#78716C] my-4`}
              />
            ),
          }}
        >
          {contentWithoutSources}
        </ReactMarkdown>
      </div>

      {/* Sources section at the bottom */}
      {sources.length > 0 && (
        <div className={`mt-8 pt-6 border-t ${colors.border}`}>
          <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>Sources</h3>
          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.number} className="text-sm text-[#1C1917]">
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

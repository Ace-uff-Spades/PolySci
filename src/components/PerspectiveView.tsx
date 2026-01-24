'use client';

import ReactMarkdown from 'react-markdown';
import { extractSources, makeCitationsClickable, Source } from '@/lib/analysis/sources';

interface PerspectiveViewProps {
  content: string;
  lens: 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism';
}

const lensColors = {
  liberalism: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
  },
  conservatism: {
    border: 'border-red-500',
    bg: 'bg-red-50',
    text: 'text-red-900',
  },
  socialism: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
  },
  libertarianism: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
  },
};

export function PerspectiveView({ content, lens }: PerspectiveViewProps) {
  if (!content) {
    return (
      <div className="text-center py-12 text-gray-700">
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
              <p {...props} className="text-gray-900 leading-relaxed mb-4" />
            ),
            ul: ({ node, ...props }) => (
              <ul {...props} className="list-disc list-inside mb-4 space-y-2 text-gray-900" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="list-decimal list-inside mb-4 space-y-2 text-gray-900" />
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
                className="text-blue-600 hover:text-blue-800 underline"
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                {...props}
                className={`border-l-4 ${colors.border} pl-4 italic text-gray-800 my-4`}
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
              <li key={source.number} className="text-sm text-gray-900">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 underline font-medium"
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

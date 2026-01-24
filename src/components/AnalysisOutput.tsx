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
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mt-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-gray-500">
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
                className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200"
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                {...props}
                className="text-lg font-semibold text-gray-800 mt-6 mb-3"
              />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="text-gray-700 leading-relaxed mb-4" />
            ),
            ul: ({ node, ...props }) => (
              <ul {...props} className="list-disc list-inside mb-4 space-y-2 text-gray-700" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="list-decimal list-inside mb-4 space-y-2 text-gray-700" />
            ),
            li: ({ node, ...props }) => (
              <li {...props} className="ml-4" />
            ),
            strong: ({ node, ...props }) => (
              <strong {...props} className="font-semibold text-gray-900" />
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
                className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4"
              />
            ),
          }}
        >
          {contentWithoutSources}
        </ReactMarkdown>
      </div>

      {/* Sources section at the bottom */}
      {sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sources</h3>
          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.number} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
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

'use client';

import ReactMarkdown from 'react-markdown';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function Message({ role, content, isStreaming }: MessageProps) {
  return (
    <div
      className={`py-6 ${
        role === 'assistant' ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
              role === 'assistant' ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            {role === 'assistant' ? 'P' : 'U'}
          </div>
          <div className="flex-1 prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

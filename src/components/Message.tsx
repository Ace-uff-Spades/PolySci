'use client';

import ReactMarkdown from 'react-markdown';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function Message({ role, content, isStreaming }: MessageProps) {
  const isUser = role === 'user';
  
  return (
    <div
      className={`py-6 ${
        isUser ? 'bg-white' : 'bg-[#F5F5F4]'
      } ${isUser ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
              isUser ? 'bg-[#475569]' : 'bg-[#6B8E6F]'
            }`}
          >
            {isUser ? 'U' : 'P'}
          </div>
          <div className={`flex-1 prose prose-sm max-w-none ${isUser ? 'text-right' : ''}`}>
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B8E6F] hover:text-[#475569] underline font-medium"
                  />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="text-[#1C1917] mb-2" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-[#6B8E6F] animate-pulse ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

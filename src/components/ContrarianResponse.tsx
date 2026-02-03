'use client';

import ReactMarkdown from 'react-markdown';
import { Source } from '@/lib/analysis/sources';

interface ContrarianResponseProps {
  sections: {
    // Challenge response fields
    acknowledgment?: string;
    keyStatisticsFor?: Array<{ text: string; citation?: number }>;
    keyStatisticsAgainst?: Array<{ text: string; citation?: number }>;
    deeperAnalysis?: string;
    // Educational response fields (analysis + question only; no statistics/legislation)
    analysis?: string;
    // Common field
    followUpQuestion: string;
  };
  sources: Source[];
}

export function ContrarianResponse({ sections, sources }: ContrarianResponseProps) {
  // Check if this is an educational response
  const isEducational = !!sections.analysis;

  return (
    <div className="space-y-4">
      {/* Educational: Analysis (direct continuation of user's message) */}
      {isEducational && sections.analysis && (
        <div className="pb-3 border-b border-[#D6D3D1]">
          <h4 className="text-sm font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Analysis
          </h4>
          <div className="text-[#1C1917] leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                a: (props) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#6B8E6F] hover:text-[#475569] underline font-medium" />
                ),
                p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
              }}
            >
              {sections.analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Challenge: Acknowledgment Section */}
      {!isEducational && sections.acknowledgment && (
        <div className="pb-3 border-b border-[#D6D3D1]">
          <p className="text-[#1C1917] leading-relaxed italic">
            {sections.acknowledgment}
          </p>
        </div>
      )}

      {/* Challenge: Statistics FOR User's Stance */}
      {!isEducational && sections.keyStatisticsFor && sections.keyStatisticsFor.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#6B8E6F] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Statistics Supporting Your Stance
          </h4>
          <ul className="space-y-2 list-none">
            {sections.keyStatisticsFor.map((stat, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#6B8E6F] mr-2 mt-1">•</span>
                <div className="flex-1">
                  <ReactMarkdown
                    components={{
                      a: (props) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6B8E6F] hover:text-[#475569] underline font-medium"
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <span {...props} className="text-[#1C1917]" />
                      ),
                    }}
                  >
                    {stat.text}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistics AGAINST User's Stance */}
      {sections.keyStatisticsAgainst && sections.keyStatisticsAgainst.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#F59E0B] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Statistics Challenging Your Stance
          </h4>
          <ul className="space-y-2 list-none">
            {sections.keyStatisticsAgainst.map((stat, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#F59E0B] mr-2 mt-1">•</span>
                <div className="flex-1">
                  <ReactMarkdown
                    components={{
                      a: (props) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F59E0B] hover:text-[#D97706] underline font-medium"
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <span {...props} className="text-[#1C1917]" />
                      ),
                    }}
                  >
                    {stat.text}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deeper Analysis Section */}
      {sections.deeperAnalysis && (
        <div className="pt-3 border-t border-[#D6D3D1]">
          <h4 className="text-sm font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Analysis
          </h4>
          <p className="text-[#1C1917] leading-relaxed">
            {sections.deeperAnalysis}
          </p>
        </div>
      )}

      {/* Follow-up Question Section */}
      <div className="pt-3 border-t border-[#D6D3D1]">
        <h4 className="text-sm font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Question for You
        </h4>
        <p className="text-[#1C1917] leading-relaxed font-medium">
          {sections.followUpQuestion}
        </p>
      </div>

      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#D6D3D1]">
          <h4 className="text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Sources
          </h4>
          <ul className="space-y-1">
            {sources.map((source) => (
              <li key={source.number} className="text-xs">
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

      {/* CTAs for challenge flow: Learn more / Take action */}
      {!isEducational && sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#D6D3D1] flex flex-wrap gap-3">
          <span className="text-xs font-semibold text-[#1C1917] w-full" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Next steps
          </span>
          <a
            href={sources[0]?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded bg-[#6B8E6F] text-white hover:bg-[#5a7a5e] font-medium"
          >
            Learn more (sources)
          </a>
          <span className="text-xs text-[#78716C]">
            Take action: contact reps, join advocacy, or vote with your stance in mind.
          </span>
        </div>
      )}
    </div>
  );
}

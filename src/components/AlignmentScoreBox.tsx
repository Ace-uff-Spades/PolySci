'use client';

import { AlignmentScores } from '@/lib/contrarian';

interface AlignmentScoreBoxProps {
  scores: AlignmentScores;
}

const lensConfig = {
  liberalism: {
    label: 'Liberal',
    color: 'bg-[#475569]',
    textColor: 'text-[#475569]',
  },
  conservatism: {
    label: 'Conservative',
    color: 'bg-[#6B8E6F]',
    textColor: 'text-[#6B8E6F]',
  },
  socialism: {
    label: 'Socialist',
    color: 'bg-[#F59E0B]',
    textColor: 'text-[#D97706]',
  },
  libertarianism: {
    label: 'Libertarian',
    color: 'bg-[#78716C]',
    textColor: 'text-[#78716C]',
  },
};

export function AlignmentScoreBox({ scores }: AlignmentScoreBoxProps) {
  const renderMeter = (lens: keyof AlignmentScores) => {
    const score = scores[lens];
    const config = lensConfig[lens];
    const percentage = (score / 10) * 100;

    return (
      <div key={lens} className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
          <span className="text-sm font-semibold text-[#1C1917]">{score}/10</span>
        </div>
        <div className="w-full bg-[#E7E5E4] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${config.color} transition-all duration-[400ms] ease-out`}
            style={{ width: `${percentage}%`, willChange: 'width' }}
            title={`Your responses align ${score}/10 with ${config.label}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#D6D3D1] rounded-lg p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-[#1C1917] mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        Alignment Scores
      </h4>
      {renderMeter('liberalism')}
      {renderMeter('conservatism')}
      {renderMeter('socialism')}
      {renderMeter('libertarianism')}
    </div>
  );
}

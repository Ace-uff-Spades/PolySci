'use client';

import { AlignmentScores } from '@/lib/contrarian';

interface AlignmentScoreBoxProps {
  scores: AlignmentScores;
}

const lensConfig = {
  liberalism: {
    label: 'Liberal',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
  },
  conservatism: {
    label: 'Conservative',
    color: 'bg-red-500',
    textColor: 'text-red-700',
  },
  socialism: {
    label: 'Socialist',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
  },
  libertarianism: {
    label: 'Libertarian',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
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
          <span className="text-sm font-semibold text-gray-700">{score}/10</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${config.color} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
            title={`Your responses align ${score}/10 with ${config.label}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">Alignment Scores</h4>
      {renderMeter('liberalism')}
      {renderMeter('conservatism')}
      {renderMeter('socialism')}
      {renderMeter('libertarianism')}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { SOCRATIC_TOPICS } from '@/lib/socratic/topics';
import { PerspectiveView } from './PerspectiveView';
import { SocraticPerspectives } from '@/lib/socratic';

type PoliticalLens = 'liberalism' | 'conservatism' | 'socialism' | 'libertarianism';

export function SocraticCircle() {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [activeLens, setActiveLens] = useState<PoliticalLens>('liberalism');
  const [perspectives, setPerspectives] = useState<SocraticPerspectives | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTopicSelect = async (topic: string) => {
    if (topic === selectedTopic && perspectives) {
      return; // Already loaded
    }

    setIsLoading(true);
    setError(null);
    setSelectedTopic(topic);
    setPerspectives(null);

    try {
      const response = await fetch('/api/socratic-circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate perspectives');
      }

      const data = await response.json();
      setPerspectives(data.perspectives);
      setActiveLens('liberalism'); // Reset to first tab
    } catch (err) {
      console.error('Failed to load perspectives:', err);
      setError('Failed to load perspectives. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const lenses: { id: PoliticalLens; label: string }[] = [
    { id: 'liberalism', label: 'Liberalism' },
    { id: 'conservatism', label: 'Conservatism' },
    { id: 'socialism', label: 'Socialism' },
    { id: 'libertarianism', label: 'Libertarianism' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Topic Selection */}
      <div className="w-1/2 border-r border-[#D6D3D1] bg-white overflow-y-auto">
        <div className="p-6">
          {selectedTopic ? (
            <div className="space-y-4 animate-fade-in-up">
              <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Selected Topic
              </h3>
              <div className="p-4 bg-[#F5F5F4] rounded-lg border border-[#D6D3D1]">
                <p className="text-[#1C1917] font-medium">{selectedTopic}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in-up">
              <h2 className="text-2xl font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Select a Topic
              </h2>
              <p className="text-[#78716C]">
                Choose a topic to explore different political perspectives
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {selectedTopic ? 'Other Topics' : 'Available Topics'}
            </h3>
            <div className="space-y-3">
              {SOCRATIC_TOPICS.map((topic, idx) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.01] ${
                    selectedTopic === topic
                      ? 'bg-[#F5F5F4] border-[#6B8E6F] text-[#1C1917]'
                      : 'bg-white border-[#D6D3D1] hover:border-[#6B8E6F] hover:bg-[#F5F5F4] text-[#1C1917]'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} animate-fade-in-up`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <p className="text-sm font-medium">{topic}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Perspective Output */}
      <div className="w-1/2 bg-[#F5F5F4] overflow-y-auto">
        <div className="p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Perspectives
          </h3>
          
          {!selectedTopic ? (
            <div className="text-center py-12 text-[#78716C]">
              <p>Select a topic from the left to view perspectives</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-[#E7E5E4] rounded w-3/4"></div>
                <div className="h-4 bg-[#E7E5E4] rounded w-full"></div>
                <div className="h-4 bg-[#E7E5E4] rounded w-5/6"></div>
                <div className="h-8 bg-[#E7E5E4] rounded w-1/2 mt-6"></div>
                <div className="h-4 bg-[#E7E5E4] rounded w-full"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-[#1C1917]">
              <p>{error}</p>
            </div>
          ) : perspectives ? (
            <>
              {/* Perspective Tabs */}
              <div className="bg-white border border-[#D6D3D1] rounded-lg mb-6">
                <div className="flex border-b border-[#D6D3D1]">
                  {lenses.map((lens) => (
                    <button
                      key={lens.id}
                      onClick={() => setActiveLens(lens.id)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 first:rounded-tl-lg last:rounded-tr-lg ${
                        activeLens === lens.id
                          ? 'border-b-2 border-[#F59E0B] text-[#1C1917] bg-[#F5F5F4]'
                          : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F5F4]'
                      }`}
                    >
                      {lens.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perspective Content */}
              <PerspectiveView
                content={perspectives[activeLens]}
                lens={activeLens}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

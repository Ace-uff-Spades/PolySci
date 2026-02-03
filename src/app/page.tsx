'use client';

import { useState, useEffect } from 'react';
import { FeaturedStories } from '@/components/FeaturedStories';
import { ChatInput } from '@/components/ChatInput';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { SocraticCircle } from '@/components/SocraticCircle';
import { Contrarian } from '@/components/Contrarian';
import { NewsArticle } from '@/lib/newsdata';
import { AnalysisContext } from '@/lib/analysis';

type ActiveTab = 'analysis' | 'socratic' | 'contrarian';

interface UserInput {
  id: string;
  topic: string;
  timestamp: Date;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');
  const [userInputs, setUserInputs] = useState<UserInput[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [featuredStories, setFeaturedStories] = useState<NewsArticle[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [context, setContext] = useState<AnalysisContext | null>(null);

  useEffect(() => {
    fetchFeaturedStories();
  }, []);

  const fetchFeaturedStories = async () => {
    try {
      const response = await fetch('/api/featured');
      const data = await response.json();
      setFeaturedStories(data.stories || []);
    } catch (error) {
      console.error('Failed to fetch featured stories:', error);
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleAnalyze = async (topic: string, isFollowUp = false) => {
    setIsLoading(true);
    setCurrentAnalysis(null);
    setSuggestions([]);

    // Add user input to left panel
    const newInput: UserInput = {
      id: Date.now().toString(),
      topic,
      timestamp: new Date(),
    };
    setUserInputs((prev) => [...prev, newInput]);

    try {
      let response;
      if (isFollowUp && context) {
        // Use follow-up endpoint
        response = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: topic,
            context: context,
          }),
        });
      } else {
        // Use analyze endpoint for new topics
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        });
      }

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setCurrentAnalysis(data.analysis);
      setSuggestions(data.suggestions || []);

      // Update context (backend returns updated context)
      if (data.context) {
        setContext(data.context);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setCurrentAnalysis('Sorry, analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStorySelect = (story: NewsArticle) => {
    handleAnalyze(story.title, false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Suggestions are follow-up questions
    handleAnalyze(suggestion, true);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-[#475569] border-b border-[#334155] flex-shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            PolySci
          </h1>
          <p className="text-sm text-[#E7E5E4] mt-1">
            Understand the news through balanced analysis
          </p>
        </div>
        {/* Tab Navigation */}
        <div className="border-t border-[#334155] bg-[#475569]">
          <div className="max-w-7xl mx-auto flex">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-[#F59E0B] text-white bg-[#334155]'
                  : 'text-[#E7E5E4] hover:text-white hover:bg-[#334155]'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('socratic')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'socratic'
                  ? 'border-b-2 border-[#F59E0B] text-white bg-[#334155]'
                  : 'text-[#E7E5E4] hover:text-white hover:bg-[#334155]'
              }`}
            >
              Socratic Circle
            </button>
            <button
              onClick={() => setActiveTab('contrarian')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'contrarian'
                  ? 'border-b-2 border-[#F59E0B] text-white bg-[#334155]'
                  : 'text-[#E7E5E4] hover:text-white hover:bg-[#334155]'
              }`}
            >
              The Contrarian
            </button>
          </div>
        </div>
      </header>

      {/* Main content - conditional rendering based on active tab */}
      {activeTab === 'contrarian' ? (
        <main className="flex-1 flex overflow-hidden">
          <Contrarian />
        </main>
      ) : activeTab === 'socratic' ? (
        <main className="flex-1 flex overflow-hidden">
          <SocraticCircle />
        </main>
      ) : (
        <>
          <main className="flex-1 flex overflow-hidden">
            {/* Left Panel - User Inputs */}
            <div className="w-1/2 border-r border-[#D6D3D1] bg-white overflow-y-auto">
              <div className="p-6">
                {userInputs.length === 0 && featuredStories.length === 0 && !storiesLoading ? (
                  <div className="text-center py-12 animate-fade-in-up">
                    <h2 className="text-2xl font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      What would you like to understand?
                    </h2>
                    <p className="text-[#78716C]">
                      Enter a news topic or select from this week's top stories
                    </p>
                  </div>
                ) : (
                  <>
                    {userInputs.length === 0 && (
                      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          Featured Stories
                        </h3>
                        <FeaturedStories
                          stories={featuredStories}
                          onSelectStory={handleStorySelect}
                          isLoading={storiesLoading}
                        />
                      </div>
                    )}

                    {userInputs.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          Your Questions
                        </h3>
                        {userInputs.map((input) => (
                          <div
                            key={input.id}
                            className="p-4 bg-[#F5F5F4] rounded-lg border border-[#D6D3D1] hover:border-[#6B8E6F] transition-colors"
                          >
                            <p className="text-[#1C1917] font-medium">{input.topic}</p>
                            <p className="text-xs text-[#78716C] mt-1">
                              {input.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        ))}

                        {suggestions.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-semibold text-[#1C1917] mb-3">
                              Suggested Follow-ups
                            </h4>
                            <div className="space-y-2">
                              {suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="w-full text-left p-3 bg-[#F5F5F4] hover:bg-[#E7E5E4] rounded-lg border border-[#D6D3D1] hover:border-[#6B8E6F] text-sm text-[#1C1917] transition-all hover:scale-[1.02]"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Panel - Analysis Output */}
            <div className="w-1/2 bg-[#F5F5F4] overflow-y-auto">
              <div className="p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Analysis
                </h3>
                <AnalysisOutput
                  content={currentAnalysis}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </main>

          {/* Input */}
          <div className="border-t border-[#D6D3D1] bg-white flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <ChatInput
                onSubmit={(topic) => handleAnalyze(topic, userInputs.length > 0)}
                disabled={isLoading}
                placeholder={
                  userInputs.length > 0
                    ? 'Ask a follow-up question...'
                    : "Describe a news event you'd like to understand better..."
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

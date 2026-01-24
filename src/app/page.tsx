'use client';

import { useState, useEffect } from 'react';
import { FeaturedStories } from '@/components/FeaturedStories';
import { ChatInput } from '@/components/ChatInput';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { SocraticCircle } from '@/components/SocraticCircle';
import { ContrarianChallenge } from '@/components/ContrarianChallenge';
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">PolySci</h1>
          <p className="text-sm text-gray-500">
            Understand the news through balanced analysis
          </p>
        </div>
        {/* Tab Navigation */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto flex">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('socratic')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'socratic'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Socratic Circle
            </button>
            <button
              onClick={() => setActiveTab('contrarian')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'contrarian'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Contrarian Challenge
            </button>
          </div>
        </div>
      </header>

      {/* Main content - conditional rendering based on active tab */}
      {activeTab === 'contrarian' ? (
        <main className="flex-1 flex overflow-hidden">
          <ContrarianChallenge />
        </main>
      ) : activeTab === 'socratic' ? (
        <main className="flex-1 flex overflow-hidden">
          <SocraticCircle />
        </main>
      ) : (
        <>
          <main className="flex-1 flex overflow-hidden">
            {/* Left Panel - User Inputs */}
            <div className="w-1/2 border-r bg-white overflow-y-auto">
              <div className="p-6">
                {userInputs.length === 0 && featuredStories.length === 0 && !storiesLoading ? (
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      What would you like to understand?
                    </h2>
                    <p className="text-gray-600">
                      Enter a news topic or select from this week's top stories
                    </p>
                  </div>
                ) : (
                  <>
                    {userInputs.length === 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                        <h3 className="text-lg font-semibold text-gray-800">
                          Your Questions
                        </h3>
                        {userInputs.map((input) => (
                          <div
                            key={input.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <p className="text-gray-900 font-medium">{input.topic}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {input.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        ))}

                        {suggestions.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Suggested Follow-ups
                            </h4>
                            <div className="space-y-2">
                              {suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-sm text-gray-800 transition-colors"
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
            <div className="w-1/2 bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
          <div className="border-t bg-white flex-shrink-0">
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

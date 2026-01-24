'use client';

import { useState, useEffect, useRef } from 'react';
import { CONTRARIAN_TOPICS, getTopicDescription, ContrarianTopic } from '@/lib/contrarian/topics';
import { AlignmentScoreBox } from './AlignmentScoreBox';
import { AlignmentScores, ContrarianMessage } from '@/lib/contrarian';
import { makeCitationsClickable } from '@/lib/analysis/sources';
import ReactMarkdown from 'react-markdown';

export function ContrarianChallenge() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ContrarianMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alignmentScores, setAlignmentScores] = useState<AlignmentScores>({
    liberalism: 5,
    conservatism: 5,
    socialism: 5,
    libertarianism: 5,
  });
  const [inputValue, setInputValue] = useState('');
  const [isDone, setIsDone] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setConversation([]);
    setError(null);
    setIsDone(false);
    setAlignmentScores({
      liberalism: 5,
      conservatism: 5,
      socialism: 5,
      libertarianism: 5,
    });

    // Start conversation
    setIsLoading(true);
    try {
      const response = await fetch('/api/contrarian/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setAlignmentScores(data.alignmentScores);

      // Add initial AI question
      const initialMessage: ContrarianMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: data.initialQuestion,
        timestamp: new Date(),
      };
      setConversation([initialMessage]);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeTopic = () => {
    setSelectedTopic(null);
    setConversation([]);
    setError(null);
    setIsDone(false);
    setAlignmentScores({
      liberalism: 5,
      conservatism: 5,
      socialism: 5,
      libertarianism: 5,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || isDone || !selectedTopic) return;

    const userMessage: ContrarianMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contrarian/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          userStance: userMessage.content,
          conversationHistory: [...conversation, userMessage],
          currentScores: alignmentScores,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate challenge');
      }

      const data = await response.json();
      setAlignmentScores(data.updatedScores);

      // Make citations clickable
      const challengeWithLinks = makeCitationsClickable(data.challenge, data.sources || []);

      const aiMessage: ContrarianMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: challengeWithLinks,
        timestamp: new Date(),
        sources: data.sources,
      };

      setConversation((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Failed to generate challenge:', err);
      setError('Failed to generate challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    setIsDone(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Topic Selector */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-6">
          {selectedTopic ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Selected Topic
                </h3>
                <button
                  onClick={handleChangeTopic}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Change Topic
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-medium mb-2">{selectedTopic}</p>
                <p className="text-sm text-gray-600">
                  {getTopicDescription(selectedTopic as ContrarianTopic)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Select a Topic
              </h2>
              <p className="text-gray-600">
                Choose a topic to challenge your views with quantitative evidence
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedTopic ? 'Other Topics' : 'Available Topics'}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {CONTRARIAN_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTopic === topic
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-900'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <p className="text-sm font-medium">{topic}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Conversation Area */}
      <div className="w-2/3 bg-gray-50 flex flex-col">
        {/* Header with Score Box */}
        <div className="flex-shrink-0 p-4 border-b bg-white">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Conversation
            </h3>
            {selectedTopic && (
              <div className="w-56 flex-shrink-0">
                <AlignmentScoreBox scores={alignmentScores} />
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4">

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {!selectedTopic ? (
            <div className="text-center py-12 text-gray-600">
              <p>Select a topic from the left to begin</p>
            </div>
          ) : conversation.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-gray-600">
              <p>Starting conversation...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversation.map((message) => {
                const sources = message.sources || [];
                const contentWithoutSources = message.content.replace(
                  /##\s+Sources\s*\n[\s\S]*$/i,
                  ''
                ).trim();

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {message.role === 'ai' ? (
                        <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:my-2 prose-headings:text-gray-800">
                          <ReactMarkdown
                            components={{
                              a: (props) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                />
                              ),
                              p: (props) => (
                                <p {...props} className="text-gray-800 leading-relaxed" />
                              ),
                              li: (props) => (
                                <li {...props} className="text-gray-800" />
                              ),
                            }}
                          >
                            {contentWithoutSources}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                      {sources.length > 0 && message.role === 'ai' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Sources:</p>
                          <ul className="space-y-1">
                            {sources.map((source) => (
                              <li key={source.number} className="text-xs">
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
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">AI is challenging your view...</p>
                  </div>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        {selectedTopic && !isDone && (
          <div className="flex-shrink-0 border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Type your stance..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
              <button
                type="button"
                onClick={handleDone}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I&apos;m Done
              </button>
            </form>
          </div>
        )}

        {isDone && (
          <div className="flex-shrink-0 border-t bg-gray-100 p-4 text-center">
            <p className="text-gray-700 font-medium">Conversation ended</p>
          </div>
        )}
      </div>
    </div>
  );
}

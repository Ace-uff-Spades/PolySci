'use client';

import { useState, useEffect, useRef } from 'react';
import { CONTRARIAN_TOPICS } from '@/lib/contrarian/topics';
import { AlignmentScoreBox } from './AlignmentScoreBox';
import { AlignmentScores, ContrarianMessage } from '@/lib/contrarian';
import { ContrarianResponse } from './ContrarianResponse';

type ResponseMode = 'educational' | 'challenge';

function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim();
  return ['yes', 'yeah', 'yep', 'correct', 'right', 'exactly', 'true', 'that\'s right', 'that is right'].includes(t) || t === 'y';
}

export function Contrarian() {
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
  const [lastResponseType, setLastResponseType] = useState<ResponseMode | null>(null);
  const [lastConfirmationParaphrase, setLastConfirmationParaphrase] = useState<string | null>(null);
  const [stanceHistory, setStanceHistory] = useState<string[]>([]);
  const [changeStanceMode, setChangeStanceMode] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setConversation([]);
    setError(null);
    setIsDone(false);
    setLastResponseType(null);
    setLastConfirmationParaphrase(null);
    setStanceHistory([]);
    setChangeStanceMode(false);
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
      setLastResponseType('educational');

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
    setLastResponseType(null);
    setLastConfirmationParaphrase(null);
    setStanceHistory([]);
    setChangeStanceMode(false);
    setAlignmentScores({
      liberalism: 5,
      conservatism: 5,
      socialism: 5,
      libertarianism: 5,
    });
  };

  const mode = lastResponseType ?? 'educational';
  const lastUserMessage = conversation.filter((m) => m.role === 'user').pop();
  const showStanceButton = mode === 'educational' && !!lastUserMessage && !isDone;
  const showChangeStanceButton = mode === 'challenge' && !isDone;

  const callChallengeApi = async (
    conversationHistory: ContrarianMessage[],
    payload: {
      userStance: string;
      explicitStanceAction?: boolean;
      confirmedStance?: string;
    }
  ) => {
    const { userStance, explicitStanceAction = false, confirmedStance } = payload;
    return fetch('/api/contrarian/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: selectedTopic,
        userStance,
        conversationHistory,
        currentScores: alignmentScores,
        mode,
        explicitStanceAction,
        confirmedStance: confirmedStance || undefined,
        stanceHistory,
      }),
    });
  };

  const handleStanceClick = async () => {
    if (!lastUserMessage || isLoading || isDone || !selectedTopic) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await callChallengeApi(conversation, {
        userStance: lastUserMessage.content,
        explicitStanceAction: true,
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'off-topic') {
          setError(errorData.message || 'Please stay focused on the selected topic.');
          return;
        }
        throw new Error('Failed to generate challenge');
      }
      const data = await response.json();
      setAlignmentScores(data.updatedScores);
      setLastResponseType('challenge');
      setLastConfirmationParaphrase(null);
      setStanceHistory((prev) => {
        const stance = lastUserMessage?.content?.trim() ?? '';
        return stance && !prev.includes(stance) ? [...prev, stance] : prev;
      });
      const aiMessage: ContrarianMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: JSON.stringify(data.sections),
        timestamp: new Date(),
        sources: data.sources,
      };
      setConversation((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Failed to generate challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
    const nextConversation = [...conversation, userMessage];
    setConversation(nextConversation);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const isChangingStance = changeStanceMode;
    if (isChangingStance) setChangeStanceMode(false);

    const isConfirmingStance = lastConfirmationParaphrase && isAffirmative(userMessage.content);

    try {
      const response = isChangingStance
        ? await callChallengeApi(nextConversation, {
            userStance: userMessage.content,
            explicitStanceAction: true,
            confirmedStance: userMessage.content,
          })
        : isConfirmingStance
          ? await callChallengeApi(nextConversation, {
              userStance: userMessage.content,
              explicitStanceAction: true,
              confirmedStance: lastConfirmationParaphrase,
            })
          : await callChallengeApi(nextConversation, { userStance: userMessage.content });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'off-topic') {
          setError(errorData.message || 'Please stay focused on the selected topic.');
          setConversation(conversation);
          return;
        }
        throw new Error('Failed to generate challenge');
      }

      const data = await response.json();
      setAlignmentScores(data.updatedScores);
      setLastResponseType(data.type === 'educational' ? 'educational' : 'challenge');
      setLastConfirmationParaphrase(
        data.confirmationPrompt && data.paraphrasedStance ? data.paraphrasedStance : null
      );
      if (data.type === 'challenge') {
        const stance = (isChangingStance || isConfirmingStance ? (isChangingStance ? userMessage.content : lastConfirmationParaphrase) : userMessage.content)?.trim();
        if (stance) {
          setStanceHistory((prev) => (prev.includes(stance) ? prev : [...prev, stance]));
        }
      }

      const aiMessage: ContrarianMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: JSON.stringify(data.sections),
        timestamp: new Date(),
        sources: data.sources,
      };
      setConversation((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Failed to generate challenge:', err);
      setConversation(conversation);
      setError(err instanceof Error ? err.message : 'Failed to generate challenge. Please try again.');
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
      <div className="w-1/3 border-r border-[#D6D3D1] bg-white overflow-y-auto">
        <div className="p-6">
          {selectedTopic ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {conversation.length > 0 ? 'Topic' : 'Selected Topic'}
                </h3>
                <button
                  onClick={handleChangeTopic}
                  className="text-sm text-[#6B8E6F] hover:text-[#475569] font-medium transition-colors"
                >
                  Change
                </button>
              </div>
              <div className={`p-3 rounded-lg border transition-colors ${conversation.length > 0 ? 'bg-[#E8F0E9] border-[#6B8E6F]' : 'bg-[#F5F5F4] border-[#D6D3D1]'}`}>
                <p className="text-[#1C1917] font-medium text-sm">{selectedTopic}</p>
              </div>

              {/* Alignment Scores */}
              <div className="mt-4">
                <AlignmentScoreBox scores={alignmentScores} />
              </div>

              {/* Stance history - shown when chat has started */}
              {conversation.length > 0 && stanceHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#D6D3D1]">
                  <h3 className="text-sm font-semibold text-[#1C1917] mb-2">Your stances</h3>
                  <ul className="space-y-2 max-h-32 overflow-y-auto">
                    {stanceHistory.map((stance, i) => (
                      <li key={i} className="text-xs text-[#1C1917] p-2 bg-[#F5F5F4] rounded border border-[#D6D3D1]">
                        {stance}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 animate-fade-in-up">
              <h2 className="text-xl font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Select a Topic
              </h2>
              <p className="text-sm text-[#78716C]">
                Challenge your views with data
              </p>
            </div>
          )}

          {/* Topics grid - hidden when chat has started */}
          {conversation.length === 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#1C1917] mb-2">
                {selectedTopic ? 'Other Topics' : 'Topics'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {CONTRARIAN_TOPICS.map((topic, idx) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    disabled={isLoading}
                    className={`text-left p-2 rounded border transition-all text-xs hover:scale-[1.02] ${
                      selectedTopic === topic
                        ? 'bg-[#F5F5F4] border-[#6B8E6F] text-[#1C1917]'
                        : 'bg-white border-[#D6D3D1] hover:border-[#6B8E6F] hover:bg-[#F5F5F4] text-[#1C1917]'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} animate-fade-in-up`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Conversation Area */}
      <div className="w-2/3 bg-[#F5F5F4] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-[#D6D3D1] bg-white">
          <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Conversation
          </h3>
        </div>

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4">

          {!selectedTopic ? (
            <div className="text-center py-12 text-[#78716C]">
              <p>Select a topic from the left to begin</p>
            </div>
          ) : conversation.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-[#78716C]">
              <p>Starting conversation...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversation.map((message) => {
                const sources = message.sources || [];
                
                // Check if this is a structured response
                let structuredResponse = null;
                try {
                  const parsed = JSON.parse(message.content);
                  if (parsed && typeof parsed === 'object' && parsed.followUpQuestion) {
                    structuredResponse = parsed;
                  }
                } catch {
                  // Not JSON, treat as plain text
                }

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 transition-all ${
                        message.role === 'user'
                          ? 'bg-[#475569] text-white'
                          : 'bg-white text-[#1C1917] border border-[#D6D3D1]'
                      } ${message.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
                    >
                      {message.role === 'ai' && structuredResponse ? (
                        // Use structured response component
                        <ContrarianResponse
                          sections={structuredResponse}
                          sources={sources}
                        />
                      ) : message.role === 'ai' ? (
                        // Fallback: plain text rendering
                        <div className="prose prose-sm max-w-none">
                          <p className="text-[#1C1917] leading-relaxed">
                            {message.content.replace(/##\s+Sources\s*\n[\s\S]*$/i, '').trim()}
                          </p>
                          {sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#D6D3D1]">
                              <p className="text-xs font-semibold text-[#1C1917] mb-2">Sources:</p>
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
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-white/70' : 'text-[#78716C]'
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
                  <div className="bg-white border border-[#D6D3D1] rounded-lg p-4">
                    <p className="text-sm text-[#78716C]">the AI is thinking</p>
                  </div>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        {selectedTopic && !isDone && (
          <div className="flex-shrink-0 border-t border-[#D6D3D1] bg-white p-4 space-y-3">
            {error && (
              <div className="p-3 bg-[#F5F5F4] border border-[#D6D3D1] rounded-lg text-[#1C1917] text-sm">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-[#6B8E6F] hover:text-[#475569] underline font-medium"
                >
                  Dismiss
                </button>
              </div>
            )}
            {showStanceButton && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleStanceClick}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#6B8E6F] text-white rounded-lg hover:bg-[#5a7a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                >
                  I have a stance — challenge me
                </button>
              </div>
            )}
            {showChangeStanceButton && !changeStanceMode && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setChangeStanceMode(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                >
                  Change my stance
                </button>
              </div>
            )}
            {changeStanceMode && (
              <p className="text-sm text-[#78716C]">Type your new stance below and press Send.</p>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder={
                  mode === 'educational'
                    ? 'Share your thoughts or answer the question...'
                    : 'Continue the conversation...'
                }
                className="flex-1 px-4 py-2 border border-[#D6D3D1] rounded-lg bg-white text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#F59E0B] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-2 bg-[#475569] text-white rounded-lg hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium"
              >
                Send
              </button>
              <button
                type="button"
                onClick={handleDone}
                disabled={isLoading}
                className="px-6 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium"
              >
                I&apos;m Done
              </button>
            </form>
          </div>
        )}

        {isDone && (
          <div className="flex-shrink-0 border-t border-[#D6D3D1] bg-[#F5F5F4] p-4 text-center">
            <p className="text-[#1C1917] font-medium">Conversation ended</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { getOpenAIClient } from '../openai';
import { getNewsForQuery, NewsArticle } from '../news-service';
import { gatherGovernmentData, GovernmentData } from '../government';
import {
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  buildFollowUpSystemPrompt,
  buildFollowUpPrompt,
} from './prompts';

export interface AnalysisContext {
  topic: string;
  newsArticles: NewsArticle[];
  governmentData: GovernmentData;
  analysisHistory: string[];
}

export async function gatherContext(topic: string): Promise<AnalysisContext> {
  const [newsArticles, governmentData] = await Promise.all([
    getNewsForQuery(topic),
    gatherGovernmentData(topic),
  ]);

  return {
    topic,
    newsArticles,
    governmentData,
    analysisHistory: [],
  };
}

export async function* streamAnalysis(context: AnalysisContext): AsyncGenerator<string> {
  const client = getOpenAIClient();
  const system = buildAnalysisSystemPrompt();
  const user = buildAnalysisUserPrompt(context.topic, context.newsArticles, context.governmentData);
  let fullResponse = '';
  const stream = await client.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], stream: true });
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) { fullResponse += content; yield content; }
  }
  context.analysisHistory.push(fullResponse);
}

export async function generateAnalysis(context: AnalysisContext): Promise<string> {
  const client = getOpenAIClient();
  const system = buildAnalysisSystemPrompt();
  const user = buildAnalysisUserPrompt(context.topic, context.newsArticles, context.governmentData);
  const res = await client.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], stream: false });
  const fullResponse = res.choices[0]?.message?.content || '';
  context.analysisHistory.push(fullResponse);
  return fullResponse;
}

export async function generateFollowUp(context: AnalysisContext, question: string): Promise<string> {
  const client = getOpenAIClient();
  const system = buildFollowUpSystemPrompt();
  const lastAnalysis = context.analysisHistory[context.analysisHistory.length - 1] ?? '';
  const user = buildFollowUpPrompt(lastAnalysis, question);
  const res = await client.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], stream: false });
  const fullResponse = res.choices[0]?.message?.content || '';
  context.analysisHistory.push(fullResponse);
  return fullResponse;
}

export async function* streamFollowUp(context: AnalysisContext, question: string): AsyncGenerator<string> {
  const client = getOpenAIClient();
  const system = buildFollowUpSystemPrompt();
  const lastAnalysis = context.analysisHistory[context.analysisHistory.length - 1] ?? '';
  const user = buildFollowUpPrompt(lastAnalysis, question);
  let fullResponse = '';
  const stream = await client.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], stream: true });
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) { fullResponse += content; yield content; }
  }
  context.analysisHistory.push(fullResponse);
}

export async function generateFollowUpSuggestions(analysis: string): Promise<string[]> {
  const client = getOpenAIClient();
  const prompt = `Based on this political analysis, generate 5 relevant follow-up questions that would help the user understand the topic better. Make them specific to the content discussed, not generic.\n\nAnalysis:\n${analysis}\n\nGenerate exactly 5 questions, one per line, without numbering or bullets. Return only the questions, one per line.`;
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates relevant follow-up questions based on political analysis content.',
        },
        { role: 'user', content: prompt },
      ],
      stream: false,
      temperature: 0.7,
    });

    const suggestionsText = response.choices[0]?.message?.content || '';
    const suggestions = suggestionsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.match(/^\d+[\.\)]/)) // Remove numbering
      .slice(0, 5);

    return suggestions.length > 0 ? suggestions : getDefaultSuggestions();
  } catch (error) {
    console.error('Failed to generate contextual suggestions:', error);
    return getDefaultSuggestions();
  }
}

function getDefaultSuggestions(): string[] {
  return [
    'What are the key implications of this?',
    'How does this compare to similar past events?',
    'What are experts saying about this?',
    'What happens next?',
    'How might this affect the economy?',
  ];
}

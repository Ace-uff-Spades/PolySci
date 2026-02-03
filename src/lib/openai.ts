import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/** Cheapest model for quick classification calls (topic relevance, question-type detection). */
export const OPENAI_MODEL_QUICK = 'gpt-4o-mini';

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function streamCompletion(
  systemPrompt: string,
  userMessage: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const client = getOpenAIClient();

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
}

export async function getCompletion(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function getJSONCompletion<T>(
  systemPrompt: string,
  userMessage: string,
  schema: any
): Promise<T> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { 
      type: 'json_schema', 
      json_schema: { 
        name: 'response', 
        schema,
        strict: true
      } 
    },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', content);
    throw new Error(`Invalid JSON response from OpenAI: ${error}`);
  }
}

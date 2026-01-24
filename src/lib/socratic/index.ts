import { getOpenAIClient } from '../openai';
import { gatherGovernmentData, GovernmentData } from '../government';
import {
  buildLiberalismSystemPrompt,
  buildConservatismSystemPrompt,
  buildSocialismSystemPrompt,
  buildLibertarianismSystemPrompt,
  buildSocraticUserPrompt,
  PoliticalLens,
} from './prompts';

export interface SocraticPerspectives {
  liberalism: string;
  conservatism: string;
  socialism: string;
  libertarianism: string;
}

async function generatePerspective(
  lens: PoliticalLens,
  topic: string,
  governmentData: GovernmentData
): Promise<string> {
  let systemPrompt: string;
  
  switch (lens) {
    case 'liberalism':
      systemPrompt = buildLiberalismSystemPrompt();
      break;
    case 'conservatism':
      systemPrompt = buildConservatismSystemPrompt();
      break;
    case 'socialism':
      systemPrompt = buildSocialismSystemPrompt();
      break;
    case 'libertarianism':
      systemPrompt = buildLibertarianismSystemPrompt();
      break;
  }

  const userPrompt = buildSocraticUserPrompt(topic, lens, governmentData);
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
  });

  return response.choices[0]?.message?.content || '';
}

export async function generateAllPerspectives(
  topic: string
): Promise<SocraticPerspectives> {
  // Gather government data once for all perspectives
  const governmentData = await gatherGovernmentData(topic);

  // Generate all 4 perspectives in parallel
  const [liberalism, conservatism, socialism, libertarianism] = await Promise.all([
    generatePerspective('liberalism', topic, governmentData).catch(() => 'Error generating Liberal perspective.'),
    generatePerspective('conservatism', topic, governmentData).catch(() => 'Error generating Conservative perspective.'),
    generatePerspective('socialism', topic, governmentData).catch(() => 'Error generating Socialist perspective.'),
    generatePerspective('libertarianism', topic, governmentData).catch(() => 'Error generating Libertarian perspective.'),
  ]);

  return {
    liberalism,
    conservatism,
    socialism,
    libertarianism,
  };
}

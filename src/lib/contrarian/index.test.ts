import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateContrarianChallenge,
} from './index';
import { ContrarianContext, AlignmentScores, ContrarianChallengeResponse } from './index';
import { GovernmentData } from '../government';

// Mock dependencies
vi.mock('../government', () => ({
  gatherGovernmentData: vi.fn(),
}));

vi.mock('../openai', () => ({
  getOpenAIClient: vi.fn(),
}));

vi.mock('./prompts', () => ({
  buildContrarianSystemPrompt: vi.fn(),
  buildContrarianUserPrompt: vi.fn(),
}));

vi.mock('./scoring', () => ({
  updateScores: vi.fn(),
}));

vi.mock('../analysis/sources', () => ({
  extractSources: vi.fn(),
}));

import { gatherGovernmentData } from '../government';
import { getOpenAIClient } from '../openai';
import { buildContrarianSystemPrompt, buildContrarianUserPrompt } from './prompts';
import { updateScores } from './scoring';
import { extractSources } from '../analysis/sources';

describe('generateContrarianChallenge', () => {
  const mockGovernmentData: GovernmentData = {
    economic: {
      unemployment: [{ 
        value: '3.5', 
        periodName: 'January', 
        year: '2026',
        period: 'M01',
        footnotes: [],
      }],
    },
    spending: {},
    demographic: {},
    legislative: {},
  };

  const mockContext: ContrarianContext = {
    topic: 'Healthcare System',
    conversationHistory: [],
    alignmentScores: {
      liberalism: 5,
      conservatism: 5,
      socialism: 5,
      libertarianism: 5,
    },
    governmentData: mockGovernmentData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate challenge with updated scores', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'I understand your support for universal healthcare. However, consider that the U.S. spends $4.3 trillion annually [1].\n\n## Sources\n1. [BLS](https://www.bls.gov/)',
              },
            }],
          }),
        },
      },
    };
    (getOpenAIClient as any).mockReturnValue(mockClient);
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    (updateScores as any).mockResolvedValue({
      liberalism: 8,
      conservatism: 2,
      socialism: 7,
      libertarianism: 3,
    });
    (extractSources as any).mockReturnValue([
      { number: 1, name: 'BLS', url: 'https://www.bls.gov/' },
    ]);

    const result = await generateContrarianChallenge(mockContext, 'I support universal healthcare');

    expect(result.challenge).toContain('I understand');
    expect(result.updatedScores.liberalism).toBe(8);
    expect(result.followUpQuestion).toBeDefined();
  });

  it('should call OpenAI with correct prompts', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Challenge text\n\n## Sources\n1. [Source](url)',
              },
            }],
          }),
        },
      },
    };
    (getOpenAIClient as any).mockReturnValue(mockClient);
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    (updateScores as any).mockResolvedValue(mockContext.alignmentScores);
    (extractSources as any).mockReturnValue([]);

    await generateContrarianChallenge(mockContext, 'I support universal healthcare');

    expect(buildContrarianSystemPrompt).toHaveBeenCalled();
    expect(buildContrarianUserPrompt).toHaveBeenCalledWith(
      'Healthcare System',
      'I support universal healthcare',
      mockGovernmentData,
      []
    );
    expect(mockClient.chat.completions.create).toHaveBeenCalled();
  });

  it('should extract sources from response', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Challenge text\n\n## Sources\n1. [BLS](https://www.bls.gov/)',
              },
            }],
          }),
        },
      },
    };
    (getOpenAIClient as any).mockReturnValue(mockClient);
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    (updateScores as any).mockResolvedValue(mockContext.alignmentScores);
    (extractSources as any).mockReturnValue([
      { number: 1, name: 'BLS', url: 'https://www.bls.gov/' },
    ]);

    const result = await generateContrarianChallenge(mockContext, 'I support universal healthcare');

    expect(extractSources).toHaveBeenCalled();
    expect(result.sources).toHaveLength(1);
    expect(result.sources?.[0].name).toBe('BLS');
  });

  it('should update scores based on user stance', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Challenge text\n\n## Sources',
              },
            }],
          }),
        },
      },
    };
    (getOpenAIClient as any).mockReturnValue(mockClient);
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    const updatedScores: AlignmentScores = {
      liberalism: 8,
      conservatism: 2,
      socialism: 7,
      libertarianism: 3,
    };
    (updateScores as any).mockResolvedValue(updatedScores);
    (extractSources as any).mockReturnValue([]);

    const result = await generateContrarianChallenge(mockContext, 'I support universal healthcare');

    expect(updateScores).toHaveBeenCalledWith(
      mockContext.alignmentScores,
      'I support universal healthcare',
      'Healthcare System'
    );
    expect(result.updatedScores).toEqual(updatedScores);
  });
});

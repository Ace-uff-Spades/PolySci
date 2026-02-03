import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateContrarian,
} from './index';
import { ContrarianContext, AlignmentScores, ContrarianOutput } from './index';
import { GovernmentData } from '../government';

// Mock dependencies
vi.mock('../government', () => ({
  gatherGovernmentData: vi.fn(),
}));

const mockGetJSONCompletion = vi.fn();
const mockGetOpenAIClient = vi.fn();
vi.mock('../openai', () => ({
  getOpenAIClient: (...args: unknown[]) => mockGetOpenAIClient(...args),
  getJSONCompletion: (...args: unknown[]) => mockGetJSONCompletion(...args),
}));

vi.mock('./stance-analysis', () => ({
  analyzeStance: vi.fn().mockResolvedValue({
    acknowledgment: 'Your stance has merit.',
    supportingStatistics: [{ text: 'Stat [1]', citation: 1 }],
    validPoints: ['Valid point'],
  }),
}));

vi.mock('./prompts', () => ({
  buildContrarianSystemPrompt: vi.fn(),
  buildContrarianUserPrompt: vi.fn(),
}));

vi.mock('./scoring', () => ({
  updateScores: vi.fn(),
}));

import { buildContrarianSystemPrompt, buildContrarianUserPrompt } from './prompts';
import { updateScores } from './scoring';

describe('generateContrarian', () => {
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
    mockGetJSONCompletion.mockResolvedValue({
      acknowledgment: 'I understand your support for universal healthcare.',
      statisticsFor: [{ text: 'Stat [1]', citation: 1 }],
      statisticsAgainst: [{ text: 'However, consider $4.3 trillion [1].', citation: 1 }],
      deeperAnalysis: 'Analysis.',
      followUpQuestion: 'What do you think?',
      sources: [{ number: 1, name: 'BLS', url: 'https://www.bls.gov/' }],
    });
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    (updateScores as any).mockResolvedValue({ liberalism: 8, conservatism: 2, socialism: 7, libertarianism: 3 });

    const result = await generateContrarian(mockContext, 'I support universal healthcare');

    expect(result.type).toBe('challenge');
    expect(result.sections.acknowledgment).toContain('I understand');
    expect(result.updatedScores.liberalism).toBe(8);
    expect(result.sections.followUpQuestion).toBeDefined();
  });

  it('should call OpenAI with correct prompts', async () => {
    mockGetJSONCompletion.mockResolvedValue({
      acknowledgment: 'Ack.',
      statisticsFor: [],
      statisticsAgainst: [],
      deeperAnalysis: 'Analysis.',
      followUpQuestion: 'Follow-up?',
      sources: [],
    });
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    (updateScores as any).mockResolvedValue(mockContext.alignmentScores);

    await generateContrarian(mockContext, 'I support universal healthcare');

    expect(buildContrarianSystemPrompt).toHaveBeenCalled();
    expect(buildContrarianUserPrompt).toHaveBeenCalledWith('Healthcare System', 'I support universal healthcare', mockGovernmentData, [], expect.any(Object), undefined);
    expect(mockGetJSONCompletion).toHaveBeenCalled();
  });

  it('should extract sources from response', async () => {
    mockGetJSONCompletion.mockResolvedValue({
      acknowledgment: 'Ack.',
      statisticsFor: [{ text: '[1]', citation: 1 }],
      statisticsAgainst: [],
      deeperAnalysis: 'Analysis.',
      followUpQuestion: '?',
      sources: [{ number: 1, name: 'BLS', url: 'https://www.bls.gov/' }],
    });
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    (updateScores as any).mockResolvedValue(mockContext.alignmentScores);

    const result = await generateContrarian(mockContext, 'I support universal healthcare');

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].name).toBe('BLS');
  });

  it('should update scores based on user stance', async () => {
    mockGetJSONCompletion.mockResolvedValue({
      acknowledgment: 'Ack.',
      statisticsFor: [],
      statisticsAgainst: [],
      deeperAnalysis: 'Analysis.',
      followUpQuestion: '?',
      sources: [],
    });
    (buildContrarianSystemPrompt as any).mockReturnValue('System prompt');
    (buildContrarianUserPrompt as any).mockReturnValue('User prompt');
    const updatedScores: AlignmentScores = { liberalism: 8, conservatism: 2, socialism: 7, libertarianism: 3 };
    (updateScores as any).mockResolvedValue(updatedScores);

    const result = await generateContrarian(mockContext, 'I support universal healthcare');

    expect(updateScores).toHaveBeenCalledWith(mockContext.alignmentScores, 'I support universal healthcare', 'Healthcare System');
    expect(result.updatedScores).toEqual(updatedScores);
  });
});

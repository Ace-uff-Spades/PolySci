import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAlignmentScore,
  updateScores,
} from './scoring';
import { AlignmentScores } from './index';
import { PoliticalLens } from '../socratic/prompts';

// Mock OpenAI
vi.mock('../openai', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

import { getOpenAIClient } from '../openai';

describe('scoring service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateAlignmentScore', () => {
    it('should return a score between 1 and 10', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: '7',
                },
              }],
            }),
          },
        },
      };
      (getOpenAIClient as any).mockReturnValue(mockClient);

      const score = await calculateAlignmentScore(
        'I support universal healthcare',
        'liberalism',
        'Healthcare System'
      );

      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should call OpenAI with correct prompt structure', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: '8',
                },
              }],
            }),
          },
        },
      };
      (getOpenAIClient as any).mockReturnValue(mockClient);

      await calculateAlignmentScore(
        'I support universal healthcare',
        'liberalism',
        'Healthcare System'
      );

      expect(mockClient.chat.completions.create).toHaveBeenCalled();
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o');
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[1].content).toContain('I support universal healthcare');
      expect(callArgs.messages[1].content).toContain('liberalism');
    });

    it('should parse numeric score from OpenAI response', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: '9',
                },
              }],
            }),
          },
        },
      };
      (getOpenAIClient as any).mockReturnValue(mockClient);

      const score = await calculateAlignmentScore(
        'I support universal healthcare',
        'liberalism',
        'Healthcare System'
      );

      expect(score).toBe(9);
    });

    it('should handle non-numeric response by defaulting to 5', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'high alignment',
                },
              }],
            }),
          },
        },
      };
      (getOpenAIClient as any).mockReturnValue(mockClient);

      const score = await calculateAlignmentScore(
        'I support universal healthcare',
        'liberalism',
        'Healthcare System'
      );

      expect(score).toBe(5);
    });
  });

  describe('updateScores', () => {
    it('should calculate all four scores', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn()
              .mockResolvedValueOnce({ choices: [{ message: { content: '8' } }] })
              .mockResolvedValueOnce({ choices: [{ message: { content: '3' } }] })
              .mockResolvedValueOnce({ choices: [{ message: { content: '7' } }] })
              .mockResolvedValueOnce({ choices: [{ message: { content: '2' } }] }),
          },
        },
      };
      (getOpenAIClient as any).mockReturnValue(mockClient);

      const currentScores: AlignmentScores = {
        liberalism: 5,
        conservatism: 5,
        socialism: 5,
        libertarianism: 5,
      };

      const updated = await updateScores(
        currentScores,
        'I support universal healthcare',
        'Healthcare System'
      );

      // Weighted: (newScore * 0.6) + (currentScore * 0.4)
      // liberalism: (8 * 0.6) + (5 * 0.4) = 4.8 + 2.0 = 6.8 ≈ 7
      expect(updated.liberalism).toBe(7);
      // conservatism: (3 * 0.6) + (5 * 0.4) = 1.8 + 2.0 = 3.8 ≈ 4
      expect(updated.conservatism).toBe(4);
      // socialism: (7 * 0.6) + (5 * 0.4) = 4.2 + 2.0 = 6.2 ≈ 6
      expect(updated.socialism).toBe(6);
      // libertarianism: (2 * 0.6) + (5 * 0.4) = 1.2 + 2.0 = 3.2 ≈ 3
      expect(updated.libertarianism).toBe(3);
    });

    it('should weight recent response 60% and current scores 40%', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn()
              .mockResolvedValueOnce({ choices: [{ message: { content: '10' } }] })
              .mockResolvedValueOnce({ choices: [{ message: { content: '1' } }] })
              .mockResolvedValueOnce({ choices: [{ message: { content: '10' } }] })
              .mockResolvedValueOnce({ choices: [{ message: { content: '1' } }] }),
          },
        },
      };
      (getOpenAIClient as any).mockReturnValue(mockClient);

      const currentScores: AlignmentScores = {
        liberalism: 5,
        conservatism: 5,
        socialism: 5,
        libertarianism: 5,
      };

      const updated = await updateScores(
        currentScores,
        'I support universal healthcare',
        'Healthcare System'
      );

      // For liberalism: (10 * 0.6) + (5 * 0.4) = 6 + 2 = 8
      expect(updated.liberalism).toBe(8);
    });
  });
});

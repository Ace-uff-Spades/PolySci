import { describe, it, expect } from 'vitest';
import {
  buildContrarianSystemPrompt,
  buildContrarianUserPrompt,
} from './prompts';
import { PoliticalLens } from '../socratic/prompts';
import { GovernmentData } from '../government';
import { ContrarianMessage } from './index';

describe('contrarian prompts', () => {
  describe('buildContrarianSystemPrompt', () => {
    it('should build system prompt for liberalism opposing lens', () => {
      const prompt = buildContrarianSystemPrompt('liberalism', 'Healthcare System');
      
      expect(prompt.toLowerCase()).toContain('quantitative political contrarian');
      expect(prompt.toLowerCase()).toContain('respectful but firm');
      expect(prompt.toLowerCase()).toContain('data-driven');
      expect(prompt.toLowerCase()).toContain('statistic');
    });

    it('should build system prompt for conservatism opposing lens', () => {
      const prompt = buildContrarianSystemPrompt('conservatism', 'Immigration & Border Policy');
      
      expect(prompt).toContain('quantitative political contrarian');
      expect(prompt).toContain('challenge');
    });

    it('should include topic in prompt', () => {
      const prompt = buildContrarianSystemPrompt('socialism', 'Climate Change');
      
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('buildContrarianUserPrompt', () => {
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

    const mockHistory: ContrarianMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'I support universal healthcare',
        timestamp: new Date(),
      },
    ];

    it('should include topic in user prompt', () => {
      const prompt = buildContrarianUserPrompt(
        'Healthcare System',
        'I support universal healthcare',
        mockGovernmentData,
        mockHistory
      );
      
      expect(prompt).toContain('Healthcare System');
    });

    it('should include user stance in prompt', () => {
      const prompt = buildContrarianUserPrompt(
        'Healthcare System',
        'I support universal healthcare',
        mockGovernmentData,
        mockHistory
      );
      
      expect(prompt).toContain('I support universal healthcare');
    });

    it('should include government data in prompt', () => {
      const prompt = buildContrarianUserPrompt(
        'Healthcare System',
        'I support universal healthcare',
        mockGovernmentData,
        mockHistory
      );
      
      expect(prompt).toContain('GOVERNMENT DATA');
      expect(prompt).toContain('Unemployment');
    });

    it('should include conversation history when provided', () => {
      const prompt = buildContrarianUserPrompt(
        'Healthcare System',
        'I support universal healthcare',
        mockGovernmentData,
        mockHistory
      );
      
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle empty conversation history', () => {
      const prompt = buildContrarianUserPrompt(
        'Healthcare System',
        'I support universal healthcare',
        mockGovernmentData,
        []
      );
      
      expect(prompt).toContain('Healthcare System');
      expect(prompt).toContain('I support universal healthcare');
    });

    it('should instruct to challenge with statistics', () => {
      const prompt = buildContrarianUserPrompt(
        'Healthcare System',
        'I support universal healthcare',
        mockGovernmentData,
        mockHistory
      );
      
      expect(prompt.toLowerCase()).toMatch(/statistic|data|quantitative|evidence/);
    });
  });
});

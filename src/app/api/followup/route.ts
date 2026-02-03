import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUp, generateFollowUpSuggestions, AnalysisContext } from '@/lib/analysis';
import { jsonError } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();
    if (!question || typeof question !== 'string') return jsonError('Question is required', 400);
    if (!context?.analysisHistory?.length) return jsonError('Context with analysis history is required', 400);
    const analysisContext: AnalysisContext = context;
    const analysis = await generateFollowUp(analysisContext, question);
    const suggestions = await generateFollowUpSuggestions(analysis);
    return NextResponse.json({ analysis, suggestions, context: analysisContext });
  } catch (error) {
    console.error('Follow-up error:', error);
    return jsonError('Follow-up failed', 500);
  }
}

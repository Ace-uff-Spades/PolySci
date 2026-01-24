import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUp, generateFollowUpSuggestions, AnalysisContext } from '@/lib/analysis';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!context || !context.analysisHistory || context.analysisHistory.length === 0) {
      return NextResponse.json(
        { error: 'Context with analysis history is required' },
        { status: 400 }
      );
    }

    // Use context sent from client
    const analysisContext: AnalysisContext = context;

    // Generate follow-up analysis (non-streaming)
    const analysis = await generateFollowUp(analysisContext, question);

    // Generate contextual follow-up suggestions based on new analysis
    const suggestions = await generateFollowUpSuggestions(analysis);

    return NextResponse.json({
      analysis,
      suggestions,
      context: analysisContext, // Return updated context
    });
  } catch (error) {
    console.error('Follow-up error:', error);
    return NextResponse.json(
      { error: 'Follow-up failed' },
      { status: 500 }
    );
  }
}

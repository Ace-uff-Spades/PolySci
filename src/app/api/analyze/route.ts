import { NextRequest, NextResponse } from 'next/server';
import { gatherContext, generateAnalysis, generateFollowUpSuggestions } from '@/lib/analysis';

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Gather context from all data sources
    const context = await gatherContext(topic);

    // Generate analysis (non-streaming)
    const analysis = await generateAnalysis(context);

    // Generate contextual follow-up suggestions based on analysis
    const suggestions = await generateFollowUpSuggestions(analysis);

    return NextResponse.json({
      analysis,
      suggestions,
      context, // Return context for follow-up questions
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

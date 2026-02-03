import { NextRequest, NextResponse } from 'next/server';
import { gatherContext, generateAnalysis, generateFollowUpSuggestions } from '@/lib/analysis';
import { jsonError, requireTopic } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = requireTopic(body);
    if (topic instanceof NextResponse) return topic;
    const context = await gatherContext(topic);
    const analysis = await generateAnalysis(context);
    const suggestions = await generateFollowUpSuggestions(analysis);
    return NextResponse.json({ analysis, suggestions, context });
  } catch (error) {
    console.error('Analysis error:', error);
    return jsonError('Analysis failed', 500);
  }
}

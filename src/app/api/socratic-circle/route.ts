import { NextRequest, NextResponse } from 'next/server';
import { generateAllPerspectives } from '@/lib/socratic';
import { isValidTopic } from '@/lib/socratic/topics';

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!isValidTopic(topic)) {
      return NextResponse.json(
        { error: 'Invalid topic. Topic must be from the predefined list.' },
        { status: 400 }
      );
    }

    // Generate all 4 perspectives in parallel
    const perspectives = await generateAllPerspectives(topic);

    return NextResponse.json({
      perspectives,
      topic,
    });
  } catch (error) {
    console.error('Socratic Circle error:', error);
    return NextResponse.json(
      { error: 'Failed to generate perspectives' },
      { status: 500 }
    );
  }
}

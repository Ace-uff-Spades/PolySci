import { NextRequest, NextResponse } from 'next/server';
import { isValidTopic } from '@/lib/contrarian/topics';
import { AlignmentScores } from '@/lib/contrarian';

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

    // Initial question
    const initialQuestion = `What's your stance on ${topic}?`;

    // Initial scores: all neutral (5)
    const alignmentScores: AlignmentScores = {
      liberalism: 5,
      conservatism: 5,
      socialism: 5,
      libertarianism: 5,
    };

    return NextResponse.json({
      initialQuestion,
      alignmentScores,
    });
  } catch (error) {
    console.error('Contrarian start error:', error);
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 }
    );
  }
}

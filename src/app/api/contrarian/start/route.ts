import { NextRequest, NextResponse } from 'next/server';
import { isValidTopic } from '@/lib/contrarian/topics';
import { AlignmentScores } from '@/lib/contrarian';
import { jsonError, requireTopic, invalidTopicResponse } from '../../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = requireTopic(body);
    if (topic instanceof NextResponse) return topic;
    if (!isValidTopic(topic)) return invalidTopicResponse();
    const alignmentScores: AlignmentScores = { liberalism: 5, conservatism: 5, socialism: 5, libertarianism: 5 };
    return NextResponse.json({ initialQuestion: `What's your stance on ${topic}?`, alignmentScores });
  } catch (error) {
    console.error('Contrarian start error:', error);
    return jsonError('Failed to start conversation', 500);
  }
}

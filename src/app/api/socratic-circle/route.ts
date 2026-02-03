import { NextRequest, NextResponse } from 'next/server';
import { generateAllPerspectives } from '@/lib/socratic';
import { isValidTopic } from '@/lib/socratic/topics';
import { jsonError, requireTopic, invalidTopicResponse } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = requireTopic(body);
    if (topic instanceof NextResponse) return topic;
    if (!isValidTopic(topic)) return invalidTopicResponse();
    const perspectives = await generateAllPerspectives(topic);
    return NextResponse.json({ perspectives, topic });
  } catch (error) {
    console.error('Socratic Circle error:', error);
    return jsonError('Failed to generate perspectives', 500);
  }
}

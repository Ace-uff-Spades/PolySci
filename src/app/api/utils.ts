import { NextResponse } from 'next/server';

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function requireTopic(body: { topic?: unknown }): string | NextResponse {
  if (!body.topic || typeof body.topic !== 'string') return jsonError('Topic is required', 400);
  return body.topic;
}

export function invalidTopicResponse(): NextResponse {
  return jsonError('Invalid topic. Topic must be from the predefined list.', 400);
}

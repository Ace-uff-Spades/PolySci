import { NextResponse } from 'next/server';
import { getFeaturedStories } from '@/lib/news-service';
import { jsonError } from '../utils';

export async function GET() {
  try {
    const stories = await getFeaturedStories();
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Failed to fetch featured stories:', error);
    return jsonError('Failed to fetch featured stories', 500);
  }
}

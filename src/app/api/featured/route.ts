import { NextResponse } from 'next/server';
import { getFeaturedStories } from '@/lib/news-service';

export async function GET() {
  try {
    const stories = await getFeaturedStories();
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Failed to fetch featured stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured stories' },
      { status: 500 }
    );
  }
}

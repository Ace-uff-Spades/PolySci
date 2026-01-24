'use client';

import { NewsArticle } from '@/lib/newsdata';

interface FeaturedStoriesProps {
  stories: NewsArticle[];
  onSelectStory: (story: NewsArticle) => void;
  isLoading?: boolean;
}

export function FeaturedStories({
  stories,
  onSelectStory,
  isLoading,
}: FeaturedStoriesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-4 h-24 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!stories.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {stories.map((story) => (
        <button
          key={story.article_id}
          onClick={() => onSelectStory(story)}
          className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
            {story.title}
          </h3>
          {story.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {story.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

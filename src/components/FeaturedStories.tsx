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
            className="bg-[#E7E5E4] rounded-lg p-4 h-24 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
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
      {stories.map((story, idx) => (
        <button
          key={story.article_id}
          onClick={() => onSelectStory(story)}
          className="w-full text-left bg-white border border-[#D6D3D1] rounded-lg p-4 hover:border-[#6B8E6F] hover:bg-[#F5F5F4] transition-all hover:shadow-md hover:scale-[1.01] animate-fade-in-up"
          style={{ 
            animationDelay: `${idx * 100}ms`,
            willChange: 'transform'
          }}
        >
          <h3 className="font-medium text-[#1C1917] line-clamp-2 mb-2">
            {story.title}
          </h3>
          {story.description && (
            <p className="text-sm text-[#78716C] line-clamp-2">
              {story.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

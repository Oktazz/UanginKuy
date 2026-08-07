import React from 'react';
import { getEnvironmentalNews } from '@/utils/rss-fetcher';
import { NewsCarousel, type NewsCarouselItem } from './carousel';

export async function NewsSection() {
  const news = await getEnvironmentalNews();

  // Graceful degradation: If fetching fails or returns empty, render nothing
  if (!news || news.length === 0) return null;

  const items: NewsCarouselItem[] = news.map((item, index) => ({
    id: item.link || `${index}-${item.title}`,
    title: item.title,
    summary: item.snippet,
    publishedAt: item.pubDate,
    imageSrc: item.imageUrl,
    href: item.link,
    source: 'Mongabay Indonesia',
    isNew: index === 0,
  }));

  return (
    <section className="mt-8 mb-6">
      <NewsCarousel items={items} />
    </section>
  );
}

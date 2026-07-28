import React from 'react';
import { getEnvironmentalNews } from '@/utils/rss-fetcher';
import { NewsCarousel } from './NewsCarousel';

export async function NewsSection() {
  const news = await getEnvironmentalNews();

  // Graceful degradation: If fetching fails or returns empty, render nothing
  if (!news || news.length === 0) return null;

  return (
    <section className="mt-8 mb-6">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Kabar Lingkungan</h3>
      </div>
      <NewsCarousel news={news} />
    </section>
  );
}

"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { NewsItem } from '@/utils/rss-fetcher';
import { ArrowRight, Calendar, Leaf } from 'lucide-react';

interface NewsCarouselProps {
  news: NewsItem[];
}

export function NewsCarousel({ news }: NewsCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    duration: 25, // lower = snappier snap animation
  });

  if (!news || news.length === 0) return null;

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex -ml-4 touch-pan-y">
        {news.map((item, index) => (
          <div
            key={index}
            // Explicitly prevent shrinking with shrink-0 and set width
            className="shrink-0 w-[85%] sm:w-[350px] pl-4"
          >
            <div className="bg-surface rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col group hover:shadow-xl transition-all duration-300">
              {/* Image Container */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                {/* Fallback Leaf Icon if image fails to load somehow, but we have a fallback URL so this img tag will show it */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                  <Leaf size={40} />
                </div>
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              {/* Content Container */}
              <div className="p-5 flex flex-col flex-grow bg-white">
                <div className="flex items-center text-xs text-primary font-semibold mb-3">
                  <Calendar size={14} className="mr-1.5" />
                  {item.pubDate}
                </div>
                
                <h4 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                
                <p className="text-sm text-gray-600 mb-5 flex-grow line-clamp-3 leading-relaxed">
                  {item.snippet}
                </p>
                
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center text-sm font-bold text-primary-dark hover:text-primary transition-colors"
                >
                  Baca Selengkapnya 
                  <ArrowRight size={16} className="ml-1.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

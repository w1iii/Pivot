"use client"

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  published_at: string;
  publisher: string;
  url: string;
  thumbnail?: string;
}

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState('stocks');

  const { data, isLoading } = useQuery<{ data: NewsArticle[]; meta: { has_more: boolean } }>({
    queryKey: ['news', searchQuery],
    queryFn: async () => {
      let url = `/api/news?limit=12`;
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery.trim())}&in_title=stock`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
  });

  const articles = data?.data || [];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
    }
  };

  const openArticle = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="px-16 py-12 space-y-12">
      <section className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-headline-xl font-headline-xl text-on-surface mb-2">Stock Market News</h2>
            <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl opacity-80">
              Real-time stock market news and analysis.
            </p>
          </div>
          <div className="flex items-center bg-surface-container-low pl-4 pr-2 py-1.5 rounded-full border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-label-md font-label-md w-40 placeholder:text-on-surface-variant/50"
              placeholder="Search stocks..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>

        {/* News Grid */}
        {isLoading ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <p className="text-label-md text-on-surface-variant">Loading news...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant p-12 rounded flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-4">newspaper</span>
              <p className="text-headline-md font-headline-md text-on-surface mb-2">No articles found</p>
              <p className="text-body-md text-on-surface-variant">Try a different stock search.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <article
                key={article.uuid}
                onClick={() => openArticle(article.url)}
                className="bg-surface-container border border-outline-variant p-8 rounded hover:bg-surface-container-high transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">{article.publisher || 'Markets'}</span>
                  {article.published_at && (
                    <>
                      <span className="text-label-sm text-on-surface-variant">·</span>
                      <span className="text-label-sm text-on-surface-variant">{formatDate(article.published_at)}</span>
                    </>
                  )}
                </div>
                <h3 className="text-headline-md font-headline-md text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-body-md text-body-md text-on-surface-variant line-clamp-2">{article.description}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

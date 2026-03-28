'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getVideos, Video, CATEGORIES } from '../../../lib/api/video.api';
import VideoCard from '../videos/VideoCard';

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 animate-pulse">
          <div className="w-full aspect-video bg-gray-200 dark:bg-slate-700" />
          <div className="p-4 space-y-2">
            <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchVideos = useCallback((reset = false) => {
    const pg = reset ? 1 : page + 1;
    if (!reset && (loadingMore || page >= totalPages)) return;
    reset ? setLoading(true) : setLoadingMore(true);
    getVideos({ page: pg, ...(activeCategory ? { category: activeCategory } : {}) })
      .then((res) => {
        setVideos((prev) => reset ? res.videos : [...prev, ...res.videos]);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, page, totalPages, loadingMore]);

  useEffect(() => { fetchVideos(true); }, [activeCategory]); // eslint-disable-line

  const loadMore = useCallback(() => fetchVideos(false), [fetchVideos]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const filtered = query.trim()
    ? videos.filter((v) => v.title.toLowerCase().includes(query.toLowerCase()))
    : videos;

  return (
    <div className="space-y-5">

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-shadow"
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category chips */}
      {!query && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button type="button"
            onClick={() => setActiveCategory('')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !activeCategory ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-indigo-400'
            }`}
          >All</button>
          {CATEGORIES.map((cat) => (
            <button type="button" key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-indigo-400'
              }`}
            >{cat}</button>
          ))}
        </div>
      )}

      {query && (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {filtered.length === 0 ? 'No results' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`} for <span className="font-medium text-gray-700 dark:text-slate-200">"{query}"</span>
        </p>
      )}

      {loading ? <SkeletonGrid /> : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-sm font-medium">{query ? 'No videos match your search' : `No ${activeCategory} videos yet`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filtered.map((video) => <VideoCard key={video._id} video={video} />)}
        </div>
      )}

      {!query && (
        <div ref={sentinelRef} className="flex items-center justify-center py-4 h-12">
          {loadingMore && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
    </div>
  );
}

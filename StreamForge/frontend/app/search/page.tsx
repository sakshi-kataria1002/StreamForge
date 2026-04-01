'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getVideos, Video, CATEGORIES, VideoFilters } from '../../lib/api/video.api';
import VideoCard from '../../components/features/videos/VideoCard';

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState<VideoFilters['duration']>(undefined);
  const [dateFrom, setDateFrom] = useState<VideoFilters['dateFrom']>(undefined);
  const [sortBy, setSortBy] = useState<VideoFilters['sortBy']>('newest');

  const search = useCallback((q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    getVideos({ q, category: category || undefined, duration, dateFrom, sortBy, page: 1 })
      .then((res) => { setVideos(res.videos); setTotal(res.total); })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [category, duration, dateFrom, sortBy]);

  useEffect(() => { if (query) search(query); }, [query, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setQuery(inputVal.trim());
    router.push(`/search?q=${encodeURIComponent(inputVal.trim())}`, { scroll: false });
  };

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-indigo-400'}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 space-y-6">

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search videos, creators, topics…"
            className="w-full pl-12 pr-24 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm placeholder-gray-400 dark:placeholder-slate-500"
          />
          <button type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors">
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-start">
          {/* Sort */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider self-center">Sort</span>
            {(['newest', 'oldest', 'views'] as const).map((s) => (
              <FilterChip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={sortBy === s} onClick={() => setSortBy(s)} />
            ))}
          </div>
          {/* Duration */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider self-center">Duration</span>
            {([['short', 'Under 4 min'], ['medium', '4–20 min'], ['long', '20+ min']] as const).map(([val, label]) => (
              <FilterChip key={val} label={label} active={duration === val} onClick={() => setDuration(duration === val ? undefined : val)} />
            ))}
          </div>
          {/* Upload date */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider self-center">Date</span>
            {([['today', 'Today'], ['week', 'This week'], ['month', 'This month']] as const).map(([val, label]) => (
              <FilterChip key={val} label={label} active={dateFrom === val} onClick={() => setDateFrom(dateFrom === val ? undefined : val)} />
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All categories" active={!category} onClick={() => setCategory('')} />
          {CATEGORIES.map((cat) => (
            <FilterChip key={cat} label={cat} active={category === cat} onClick={() => setCategory(category === cat ? '' : cat)} />
          ))}
        </div>

        {/* Results */}
        {!query ? (
          <div className="text-center py-24 text-gray-400 dark:text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-sm font-medium">Search for videos, creators or topics</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 animate-pulse">
                <div className="w-full aspect-video bg-gray-200 dark:bg-slate-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
            <p className="text-gray-700 dark:text-slate-300 font-semibold">No results for "{query}"</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Try different keywords or remove filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {total} result{total !== 1 ? 's' : ''} for <span className="font-semibold text-gray-800 dark:text-slate-200">"{query}"</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((v) => <VideoCard key={v._id} video={v} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

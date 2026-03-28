'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTrendingVideos, Video } from '../../lib/api/video.api';

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatDuration(s: number) {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl font-black text-amber-400">🥇</span>;
  if (rank === 2) return <span className="text-2xl font-black text-slate-400">🥈</span>;
  if (rank === 3) return <span className="text-2xl font-black text-amber-600">🥉</span>;
  return <span className="text-sm font-bold text-gray-400 dark:text-slate-500 w-6 text-center">#{rank}</span>;
}

export default function TrendingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingVideos()
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-64 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trending</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Most popular videos right now</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl animate-pulse bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                <div className="w-8 shrink-0" />
                <div className="w-40 h-24 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
            <p className="text-gray-500 dark:text-slate-400 font-medium">No videos yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Upload some videos to see trending content</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video, idx) => (
              <Link key={video._id} href={`/videos/${video._id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 group"
              >
                {/* Rank */}
                <div className="w-8 flex justify-center shrink-0">
                  <RankBadge rank={idx + 1} />
                </div>

                {/* Thumbnail */}
                <div className="relative w-40 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  )}
                  {video.duration > 0 && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-semibold bg-black/75 text-white px-1 py-0.5 rounded">{formatDuration(video.duration)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {video.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">{video.owner?.name ?? 'Unknown'}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 dark:text-slate-500">{formatViews(video.views)} views</span>
                    {video.category && video.category !== 'Other' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">{video.category}</span>
                    )}
                  </div>
                </div>

                {/* Trending icon */}
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

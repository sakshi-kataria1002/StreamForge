'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLikedVideos, Video } from '../../lib/api/video.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatDuration(seconds: number) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LikedPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!accessToken) return;
    getLikedVideos(accessToken, 1)
      .then((res) => {
        setVideos(res.videos);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [user, accessToken, router]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages || !accessToken) return;
    setLoadingMore(true);
    try {
      const res = await getLikedVideos(accessToken, page + 1);
      setVideos((prev) => [...prev, ...res.videos]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages, accessToken]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">

      {/* Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-64 bg-rose-400/10 dark:bg-rose-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/10 dark:bg-pink-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liked Videos</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                {loading ? '—' : `${total} video${total !== 1 ? 's' : ''} you've liked`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6">

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl animate-pulse">
                <div className="w-6 h-4 bg-gray-200 dark:bg-slate-700 rounded shrink-0 mt-3" />
                <div className="w-36 h-20 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <p className="text-gray-800 dark:text-slate-200 font-semibold">No liked videos yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Videos you like will appear here</p>
            <Link href="/feed" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
              Browse videos
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-800">
              {videos.map((video, idx) => (
                <Link
                  key={video._id}
                  href={`/videos/${video._id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  {/* Index / play icon */}
                  <div className="w-6 text-center shrink-0">
                    <span className="text-sm text-gray-400 dark:text-slate-600 font-medium group-hover:hidden block">{idx + 1}</span>
                    <svg className="w-4 h-4 text-indigo-500 mx-auto hidden group-hover:block" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-36 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    )}
                    {video.duration > 0 && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-semibold bg-black/75 text-white px-1 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">{video.owner?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatViews(video.views)} views</p>
                  </div>

                  {/* Like indicator */}
                  <div className="shrink-0 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="flex items-center justify-center py-4 h-12">
              {loadingMore && (
                <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

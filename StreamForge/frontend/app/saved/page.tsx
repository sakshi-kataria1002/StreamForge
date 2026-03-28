'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSaved, SavedEntry } from '../../lib/api/saved.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export default function SavedPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!accessToken) return;
    getSaved(accessToken)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user, accessToken, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">

      {/* Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-64 bg-purple-400/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/10 dark:bg-pink-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Videos</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                {loading ? '—' : entries.length} video{entries.length !== 1 ? 's' : ''} in your library
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
        ) : entries.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <p className="text-gray-800 dark:text-slate-200 font-semibold">Your library is empty</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Save videos while watching to find them here</p>
            <Link href="/feed" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
              Browse videos
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-800">
            {entries.map((entry, idx) => (
              <Link
                key={entry._id}
                href={`/videos/${entry.video._id}`}
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
                <div className="w-36 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                  {entry.video.thumbnailUrl ? (
                    <img src={entry.video.thumbnailUrl} alt={entry.video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {entry.video.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">{entry.video.owner?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatViews(entry.video.views)} views</p>
                </div>

                {/* Arrow */}
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

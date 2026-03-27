'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getSaved, SavedEntry } from '../../lib/api/saved.api';
import VideoCard from '../../components/features/videos/VideoCard';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
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
      <div className="relative bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-2.5 mb-1">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Videos</h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">{loading ? '—' : entries.length} video{entries.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-gray-100/60 dark:bg-slate-800/60 animate-pulse">
                <div className="w-full aspect-video bg-gray-200 dark:bg-slate-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24 border border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-100/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-slate-300 font-semibold">No saved videos yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Bookmark videos to watch them later</p>
            <a href="/feed" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
              Browse videos
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {entries.map((entry) => (
              <VideoCard key={entry._id} video={entry.video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

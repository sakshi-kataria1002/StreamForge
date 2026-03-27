'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getHistory, clearHistory, HistoryEntry } from '../../lib/api/history.api';
import VideoCard from '../../components/features/videos/VideoCard';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!accessToken) return;
    getHistory(accessToken)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user, accessToken, router]);

  const handleClear = async () => {
    if (!accessToken) return;
    setClearing(true);
    await clearHistory(accessToken);
    setEntries([]);
    setClearing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Watch History</h1>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm">{loading ? '—' : entries.length} video{entries.length !== 1 ? 's' : ''} watched</p>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Clear history'}
            </button>
          )}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-slate-300 font-semibold">No watch history yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Videos you watch will appear here</p>
            <a href="/feed" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
              Browse videos
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry._id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-slate-900/50 transition-colors group">
                <div className="w-40 shrink-0">
                  <VideoCard video={entry.video} />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-700 dark:text-slate-300 font-medium text-sm line-clamp-2">{entry.video.title}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">{entry.video.owner?.name ?? 'Unknown'}</p>
                  <p className="text-gray-400 dark:text-slate-600 text-xs mt-1">Watched {timeAgo(entry.watchedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

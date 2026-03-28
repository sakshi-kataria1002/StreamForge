'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHistory, clearHistory, HistoryEntry } from '../../lib/api/history.api';

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

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function groupByDay(entries: HistoryEntry[]) {
  const now = Date.now();
  const MS_DAY = 1000 * 60 * 60 * 24;
  const today: HistoryEntry[] = [];
  const yesterday: HistoryEntry[] = [];
  const earlier: HistoryEntry[] = [];

  for (const e of entries) {
    const diff = now - new Date(e.watchedAt).getTime();
    if (diff < MS_DAY) today.push(e);
    else if (diff < MS_DAY * 2) yesterday.push(e);
    else earlier.push(e);
  }

  return [
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Earlier', items: earlier },
  ].filter((s) => s.items.length > 0);
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

  const groups = groupByDay(entries);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">

      {/* Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-64 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 py-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Watch History</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                {loading ? '—' : entries.length} video{entries.length !== 1 ? 's' : ''} watched
              </p>
            </div>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-500/30 transition-colors disabled:opacity-50 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {clearing ? 'Clearing...' : 'Clear history'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6">
        {loading ? (
          <div className="space-y-6">
            {['Today', 'Earlier'].map((label) => (
              <div key={label}>
                <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 animate-pulse">
                      <div className="w-40 h-[90px] rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-800 dark:text-slate-200 font-semibold">No watch history yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Videos you watch will appear here</p>
            <Link href="/feed" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
              Browse videos
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.label}>
                {/* Day label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
                  <span className="text-xs text-gray-400 dark:text-slate-600">{group.items.length}</span>
                </div>

                <div className="space-y-1">
                  {group.items.map((entry) => (
                    <Link
                      key={entry._id}
                      href={`/videos/${entry.video._id}`}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-gray-200 dark:hover:border-slate-800 hover:shadow-sm transition-all duration-150 group"
                    >
                      {/* Thumbnail */}
                      <div className="w-40 h-[90px] rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0 relative">
                        {entry.video.thumbnailUrl ? (
                          <img src={entry.video.thumbnailUrl} alt={entry.video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        )}
                        {/* Hover play overlay */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-8 h-8 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {entry.video.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">{entry.video.owner?.name ?? 'Unknown'}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-400 dark:text-slate-500">{formatViews(entry.video.views)} views</span>
                          <span className="text-gray-200 dark:text-slate-700">·</span>
                          <span className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400/80">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeAgo(entry.watchedAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

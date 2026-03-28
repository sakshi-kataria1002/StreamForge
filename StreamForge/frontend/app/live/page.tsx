'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLiveStreams, LiveStream } from '../../lib/api/livestream.api';

interface RootState {
  auth: { user: { id: string; name: string } | null };
}

export default function LivePage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
  }, [user, router]);

  useEffect(() => {
    getLiveStreams()
      .then(setStreams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Streams</h1>
        </div>
        <Link
          href="/go-live"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Go Live
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse">
              <div className="aspect-video rounded-t-2xl bg-gray-200 dark:bg-slate-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-slate-300 font-semibold">No streams live right now</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Be the first to go live!</p>
          <Link href="/go-live" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            Start streaming
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {streams.map((stream) => (
            <Link key={stream._id} href={`/live/${stream._id}`} className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
              <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
                {stream.viewerCount > 0 && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    {stream.viewerCount}
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {stream.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {typeof stream.host === 'object' ? stream.host.name : 'Unknown host'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

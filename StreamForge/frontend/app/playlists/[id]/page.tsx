'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { getPlaylist, Playlist, PlaylistVideo } from '../../../lib/api/playlist.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatDuration(s: number) {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function timeAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'today';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default function PlaylistViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    getPlaylist(id, accessToken ?? undefined)
      .then(setPlaylist)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 aspect-video bg-gray-200 dark:bg-slate-800 rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-32 h-20 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !playlist) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-2">Playlist not found</p>
        <p className="text-sm text-gray-400 dark:text-slate-500">It may be private or deleted.</p>
        <Link href="/playlists" className="mt-6 inline-block text-indigo-600 hover:underline text-sm font-medium">← My playlists</Link>
      </div>
    );
  }

  const isOwner = user?.id === playlist.owner._id;
  const activeVideo: PlaylistVideo | null = playlist.videos[activeIndex] ?? null;
  const totalDuration = playlist.videos.reduce((s, v) => s + (v.duration || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {playlist.visibility === 'private' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25-2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Private
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{playlist.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500 dark:text-slate-400">
            <Link href={`/channel/${playlist.owner._id}`} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {playlist.owner.name}
            </Link>
            <span>·</span>
            <span>{playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}</span>
            {totalDuration > 0 && (
              <>
                <span>·</span>
                <span>{formatDuration(totalDuration)} total</span>
              </>
            )}
          </div>
          {playlist.description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 max-w-xl">{playlist.description}</p>
          )}
        </div>
        {isOwner && (
          <Link
            href={`/playlists/${playlist._id}/edit`}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit
          </Link>
        )}
      </div>

      {playlist.videos.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
          <p className="text-gray-700 dark:text-slate-300 font-semibold">This playlist is empty</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Add videos from the watch page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active video player */}
          <div className="lg:col-span-2 space-y-4">
            {activeVideo && (
              <>
                <div className="rounded-2xl overflow-hidden bg-black shadow-lg">
                  <video
                    key={activeVideo._id}
                    src={activeVideo.fileUrl}
                    controls
                    autoPlay
                    className="w-full aspect-video"
                    onEnded={() => {
                      if (activeIndex < playlist.videos.length - 1) {
                        setActiveIndex((i) => i + 1);
                      }
                    }}
                  />
                </div>
                <div>
                  <Link href={`/videos/${activeVideo._id}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
                    {activeVideo.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-slate-400">
                    <Link href={`/channel/${activeVideo.owner._id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                      {activeVideo.owner.name}
                    </Link>
                    <span>·</span>
                    <span>{formatViews(activeVideo.views)} views</span>
                    <span>·</span>
                    <span>{timeAgo(activeVideo.createdAt)}</span>
                  </div>
                </div>
                {/* Prev / Next */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveIndex((i) => i - 1)}
                    disabled={activeIndex === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Previous
                  </button>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{activeIndex + 1} / {playlist.videos.length}</span>
                  <button
                    onClick={() => setActiveIndex((i) => i + 1)}
                    disabled={activeIndex === playlist.videos.length - 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Playlist queue */}
          <div className="lg:col-span-1">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3 px-1">
              Queue — {playlist.videos.length} video{playlist.videos.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
              {playlist.videos.map((v, idx) => (
                <button
                  key={v._id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                    idx === activeIndex
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-5 shrink-0 text-right">
                    {idx === activeIndex ? (
                      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300 dark:text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    )}
                    {v.duration > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/70 text-white px-1 rounded font-semibold">{formatDuration(v.duration)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold line-clamp-2 leading-snug ${idx === activeIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-slate-200'}`}>
                      {v.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">{v.owner.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

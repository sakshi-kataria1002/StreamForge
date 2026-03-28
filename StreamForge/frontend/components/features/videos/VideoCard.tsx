'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video } from '../../../lib/api/video.api';

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface VideoCardProps {
  video: Video;
}

// Generate a consistent avatar color from the creator's name
const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
];

function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

export default function VideoCard({ video }: VideoCardProps) {
  const [thumbError, setThumbError] = useState(false);
  const ownerName = video.owner?.name ?? 'Unknown';
  const ownerId = video.owner?._id;

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-md transition-all duration-200">

      {/* Thumbnail — clickable to video */}
      <Link href={`/videos/${video._id}`} className="relative block w-full aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden">
        {video.thumbnailUrl && !thumbError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setThumbError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
            <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium px-4 text-center line-clamp-2 leading-tight">{video.title}</span>
          </div>
        )}

        {video.status !== 'ready' && (
          <span className="absolute top-2 left-2 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Processing...
          </span>
        )}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 text-[11px] font-semibold bg-black/75 text-white px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
        )}
      </Link>

      {/* Info row */}
      <div className="flex gap-3 p-3">
        {/* Avatar — links to channel */}
        <Link
          href={ownerId ? `/channel/${ownerId}` : '#'}
          onClick={(e) => !ownerId && e.preventDefault()}
          className="shrink-0 mt-0.5"
          tabIndex={ownerId ? 0 : -1}
          aria-label={`View ${ownerName}'s channel`}
        >
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(ownerName)} flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 dark:hover:ring-offset-slate-900 transition-all`}>
            {ownerName.charAt(0).toUpperCase()}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Video title — links to video */}
          <Link href={`/videos/${video._id}`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {video.title}
            </h3>
          </Link>

          {/* Creator name — links to channel */}
          <Link
            href={ownerId ? `/channel/${ownerId}` : '#'}
            onClick={(e) => !ownerId && e.preventDefault()}
            className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block"
          >
            {ownerName}
          </Link>

          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {formatViews(video.views)}
            {video.createdAt && <> · {timeAgo(video.createdAt)}</>}
          </p>
        </div>
      </div>
    </div>
  );
}

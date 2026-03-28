'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video } from '../../../lib/api/video.api';

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
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

function ThumbnailPlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
      <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium px-4 text-center line-clamp-2 leading-tight">{title}</span>
    </div>
  );
}

export default function VideoCard({ video }: VideoCardProps) {
  const [thumbError, setThumbError] = useState(false);

  return (
    <Link href={`/videos/${video._id}`} className="cursor-pointer group rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-slate-700/80 transition-all duration-200 block border border-gray-100 dark:border-slate-700/50">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-slate-700">
        {video.thumbnailUrl && !thumbError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
        ) : video.fileUrl && !thumbError ? (
          <video
            src={video.fileUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              (e.currentTarget as HTMLVideoElement).currentTime = 1;
            }}
            onError={() => setThumbError(true)}
          />
        ) : (
          <ThumbnailPlaceholder title={video.title} />
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
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{video.owner?.name ?? 'Unknown'}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatViews(video.views)}</p>
      </div>
    </Link>
  );
}

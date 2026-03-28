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

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link href={`/videos/${video._id}`} className="cursor-pointer group rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-slate-700/80 transition-all duration-200 block border border-gray-100 dark:border-slate-700/50">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-slate-700">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : video.fileUrl ? (
          <video
            src={video.fileUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              (e.currentTarget as HTMLVideoElement).currentTime = 1;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-4xl">
            ▶
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

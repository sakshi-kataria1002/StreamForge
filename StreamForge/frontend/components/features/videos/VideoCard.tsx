import { Video } from '../../../lib/api/video.api';

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="cursor-pointer group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            ▶
          </div>
        )}
        {video.status !== 'ready' && (
          <span className="absolute top-2 left-2 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Processing...
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{video.owner.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatViews(video.views)}</p>
      </div>
    </div>
  );
}

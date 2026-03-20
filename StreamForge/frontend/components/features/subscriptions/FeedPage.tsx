'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getFeed } from '../../../lib/api/subscription.api';
import { Video } from '../../../lib/api/video.api';
import VideoCard from '../videos/VideoCard';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm animate-pulse">
          <div className="w-full aspect-video bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!currentUser || !accessToken) {
      setLoading(false);
      return;
    }
    getFeed(1, accessToken)
      .then((res) => {
        setVideos(res.videos);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [currentUser, accessToken]);

  const loadMore = async () => {
    if (!accessToken) return;
    setLoadingMore(true);
    try {
      const res = await getFeed(page + 1, accessToken);
      setVideos((prev) => [...prev, ...res.videos]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">Sign in to see your feed</p>
        <p className="text-sm mt-1">Subscribe to creators to get their latest videos here.</p>
      </div>
    );
  }

  if (loading) return <SkeletonGrid />;

  if (videos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">Your feed is empty</p>
        <p className="text-sm mt-1">
          You haven't subscribed to any creators yet. Discover videos to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>

      {page < totalPages && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

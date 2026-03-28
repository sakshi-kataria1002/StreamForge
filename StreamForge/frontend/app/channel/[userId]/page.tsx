'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getChannel, ChannelData } from '../../../lib/api/video.api';
import { toggleSubscribe } from '../../../lib/api/subscription.api';
import VideoCard from '../../../components/features/videos/VideoCard';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function timeAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default function ChannelPage() {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [data, setData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getChannel(userId, accessToken ?? undefined)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId, accessToken]);

  const handleSubscribe = async () => {
    if (!accessToken || !data) return;
    setSubscribing(true);
    try {
      const res = await toggleSubscribe(data.channel._id, accessToken);
      setData((prev) => prev ? {
        ...prev,
        channel: {
          ...prev.channel,
          isSubscribed: res.subscribed,
          subscriberCount: res.subscriberCount,
        },
      } : prev);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="h-36 bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  if (notFound || !data) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-bold text-gray-800 dark:text-slate-200">Channel not found</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">This creator hasn't signed up yet</p>
      </div>
    </div>
  );

  const { channel, videos } = data;
  const isOwn = currentUser?.id === channel._id;

  // Generate a consistent gradient color based on name
  const colors = ['from-indigo-500 to-purple-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-sky-500 to-blue-600'];
  const colorIdx = channel.name.charCodeAt(0) % colors.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Banner */}
      <div className={`h-36 bg-gradient-to-r ${colors[colorIdx]} opacity-80 dark:opacity-60`} />

      {/* Channel header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-6">
          <div className="flex items-end gap-5 -mt-10">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white dark:ring-slate-900 shrink-0`}>
              {channel.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-10">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{channel.name}</h1>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                <span>{formatNum(channel.subscriberCount)} subscriber{channel.subscriberCount !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{channel.videoCount} video{channel.videoCount !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{formatNum(channel.totalViews)} total views</span>
                <span>·</span>
                <span>Joined {timeAgo(channel.createdAt)}</span>
              </div>
            </div>

            {/* Subscribe button */}
            {!isOwn && currentUser && (
              <button type="button" onClick={handleSubscribe} disabled={subscribing}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-60 ${
                  channel.isSubscribed
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}>
                {subscribing ? '...' : channel.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Videos grid */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
            <p className="text-gray-600 dark:text-slate-300 font-medium">No videos yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">This creator hasn't uploaded anything yet</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <h2 className="text-gray-900 dark:text-white font-semibold">Videos <span className="text-gray-400 dark:text-slate-500 font-normal text-sm">({videos.length})</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((v) => <VideoCard key={v._id} video={v} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

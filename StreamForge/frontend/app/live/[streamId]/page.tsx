'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getStream, LiveStream } from '../../../lib/api/livestream.api';
import LiveChat from '../../../components/features/livestream/LiveChat';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (d < 1) return 'Just started';
  if (d < 60) return `${d}m ago`;
  return `${Math.floor(d / 60)}h ${d % 60}m ago`;
}

export default function LiveStreamPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!streamId) return;
    getStream(streamId)
      .then(setStream)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [streamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading stream…</p>
        </div>
      </div>
    );
  }

  if (notFound || !stream) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-200">Stream not found</p>
          <p className="text-sm text-slate-500 mt-2">This stream may have ended or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const hasEnded = stream.status === 'ended';
  const username = currentUser?.name ?? 'Guest';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-col lg:flex-row gap-4 h-[calc(100vh-64px)]">

        {/* Left: Video + Info */}
        <div className="flex flex-col flex-1 min-w-0 gap-4">
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900" />
            <div className="relative z-10 flex flex-col items-center gap-3 text-slate-500">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              {isLive && <p className="text-sm text-slate-400">Live video stream</p>}
              {hasEnded && <p className="text-sm text-slate-400">This stream has ended</p>}
              {stream.status === 'scheduled' && <p className="text-sm text-slate-400">Stream hasn't started yet</p>}
            </div>

            {isLive && (
              <div className="absolute top-4 left-4 z-20">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>
            )}
            {hasEnded && (
              <div className="absolute top-4 left-4 z-20">
                <span className="px-2.5 py-1 rounded-md bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wide">ENDED</span>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl ring-1 ring-slate-800 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white leading-snug truncate">{stream.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{stream.host.name}</span>
                  {stream.startedAt && <><span>·</span><span>Started {timeAgo(stream.startedAt)}</span></>}
                  {isLive && (
                    <><span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {stream.viewerCount} watching
                    </span></>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {stream.host.name.charAt(0).toUpperCase()}
              </div>
            </div>
            {stream.description && <p className="mt-3 text-sm text-slate-400 leading-relaxed">{stream.description}</p>}
          </div>
        </div>

        {/* Right: Live Chat */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col" style={{ minHeight: '400px' }}>
          <LiveChat streamId={streamId} username={username} />
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getVideos, Video } from '../lib/api/video.api';
import VideoCard from '../components/features/videos/VideoCard';

interface RootState {
  auth: { user: { id: string; name: string } | null };
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function VideoSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-gray-100/60 dark:bg-slate-800/60 animate-pulse">
      <div className="w-full aspect-video bg-gray-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

function AuthenticatedHome({ userName }: { userName: string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVideos(1)
      .then((res) => setVideos(res.videos))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = videos[0] ?? null;
  const rest = videos.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">

      {/* Hero banner */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-64 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-80 h-64 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {userName.split(' ')[0]}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1.5">Here's what's been uploaded recently</p>
          </div>
          <Link
            href="/upload"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload Video
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-10">

        {loading ? (
          <>
            {/* Featured skeleton */}
            <div className="w-full rounded-2xl aspect-[16/7] bg-gray-200 dark:bg-slate-800 animate-pulse" />
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-1 h-5 bg-gray-200 dark:bg-slate-700 rounded-full" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 5 }).map((_, i) => <VideoSkeleton key={i} />)}
              </div>
            </div>
          </>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="text-gray-800 dark:text-slate-200 font-semibold">No videos yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Be the first to upload something!</p>
            <Link href="/upload" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
              Upload a video
            </Link>
          </div>
        ) : (
          <>
            {/* ── Featured video ── */}
            {featured && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                  <h2 className="text-gray-900 dark:text-white font-semibold text-base">Latest Upload</h2>
                </div>
                <Link href={`/videos/${featured._id}`} className="block group">
                  <div className="relative w-full rounded-2xl overflow-hidden aspect-[16/7] bg-gray-900">
                    {featured.thumbnailUrl ? (
                      <img
                        src={featured.thumbnailUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    {/* Play badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      Latest
                    </div>
                    {/* Play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* Info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-indigo-300 text-xs font-medium mb-1.5">{featured.owner?.name ?? 'Unknown creator'}</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">{featured.title}</h3>
                      <p className="text-gray-400 text-sm mt-2">{formatViews(featured.views)} views</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* ── More Videos ── */}
            {rest.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-purple-500 rounded-full" />
                    <h2 className="text-gray-900 dark:text-white font-semibold text-base">More Videos</h2>
                  </div>
                  <Link href="/feed" className="text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                    Browse all →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (user) return <AuthenticatedHome userName={user.name} />;

  return (
    <div className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative bg-gray-50 dark:bg-slate-950 overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">

        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative w-full max-w-5xl mx-auto px-6 py-24 text-center">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
            Free for creators
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
            Your stage.{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Your audience.
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload your videos, grow your audience, and discover content from creators you love — all in one place.
          </p>

          <div className="mt-10 flex justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-95"
            >
              Get started — it's free
            </Link>
            <Link
              href="/login"
              className="px-7 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-sm border border-gray-200 dark:border-slate-700 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-20 mb-10 flex items-center gap-4 max-w-xs mx-auto">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
            <span className="text-xs text-gray-400 dark:text-slate-600 font-medium">everything you need</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ),
                title: 'Upload Videos',
                desc: 'Share your content with the world in just a few clicks.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                  </svg>
                ),
                title: 'Watch & Discover',
                desc: 'Browse videos from creators and find content you love.',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
                title: 'Build an Audience',
                desc: 'Subscribe to creators and grow your own community.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 text-left hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}

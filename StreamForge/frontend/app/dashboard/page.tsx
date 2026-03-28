'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboard, DashboardData } from '../../lib/api/dashboard.api';
import { deleteVideo } from '../../lib/api/video.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!accessToken) return;
    getDashboard(accessToken)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, accessToken, router]);

  const handleDelete = async (videoId: string) => {
    if (!accessToken || !confirm('Delete this video? This cannot be undone.')) return;
    setDeletingId(videoId);
    try {
      await deleteVideo(videoId, accessToken);
      setData((prev) => prev ? {
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
        stats: { ...prev.stats, totalVideos: prev.stats.totalVideos - 1 },
      } : prev);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Creator Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Your channel performance at a glance</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Videos" value={data.stats.totalVideos} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            } />
            <StatCard label="Total Views" value={formatNumber(data.stats.totalViews)} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            } />
            <StatCard label="Total Likes" value={formatNumber(data.stats.totalLikes)} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
              </svg>
            } />
            <StatCard label="Subscribers" value={formatNumber(data.stats.subscriberCount)} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            } />
          </div>
        )}

        {/* Videos table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <h2 className="text-gray-900 dark:text-white font-semibold">Your Videos</h2>
            </div>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Upload
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data || data.videos.length === 0 ? (
            <div className="text-center py-16 border border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-100/50 dark:bg-slate-900/50">
              <p className="text-gray-500 dark:text-slate-400 text-sm">No videos uploaded yet</p>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800">
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">Video</th>
                    <th className="text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Views</th>
                    <th className="text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Likes</th>
                    <th className="text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Uploaded</th>
                    <th className="text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.videos.map((video, idx) => (
                    <tr key={video._id} className={`${idx < data.videos.length - 1 ? 'border-b border-gray-200/50 dark:border-slate-800/50' : ''} hover:bg-gray-100/30 dark:hover:bg-slate-800/30 transition-colors`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-9 rounded bg-white dark:bg-slate-800 overflow-hidden shrink-0">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-sm">▶</div>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 dark:text-slate-200 font-medium line-clamp-1">{video.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">{formatNumber(video.views)}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">{video.likesCount ?? 0}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-400 dark:text-slate-500 hidden md:table-cell">{timeAgo(video.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/videos/${video._id}/edit`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(video._id)}
                            disabled={deletingId === video._id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            {deletingId === video._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

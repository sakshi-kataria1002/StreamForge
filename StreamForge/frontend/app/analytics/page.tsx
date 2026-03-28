'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAnalytics, AnalyticsData } from '../../lib/api/video.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">
      No {label} data yet
    </div>
  );
}

// Fill missing dates so the chart has a continuous x-axis for the last 30 days
function fillDays(data: { _id: string; value: number }[]) {
  const map = Object.fromEntries(data.map((d) => [d._id, d.value]));
  const result: { date: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key.slice(5), value: map[key] ?? 0 });
  }
  return result;
}

export default function AnalyticsPage() {
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const user = useSelector((s: RootState) => s.auth.user);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    getAnalytics(accessToken)
      .then(setData)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!user || !accessToken) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400 dark:text-slate-500">
        Sign in to view your analytics.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-32 text-red-400">{error || 'No data'}</div>
    );
  }

  const viewsChartData = fillDays(data.viewsByDay.map((d) => ({ _id: d._id, value: d.views })));
  const subsChartData = fillDays((data.subscriberGrowth ?? []).map((d) => ({ _id: d._id, value: d.subs })));
  const topVideosData = data.topVideos.map((v) => ({
    name: v.title.length > 20 ? v.title.slice(0, 20) + '…' : v.title,
    views: v.views,
    likes: v.likes?.length ?? 0,
  }));

  const totalViews = data.viewsByDay.reduce((s, d) => s + d.views, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Last 30 days</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Views (30d)" value={totalViews} sub="from watch history" />
        <StatCard label="Subscribers" value={data.subscriberCount} sub="total" />
        <StatCard label="Top video views" value={data.topVideos[0]?.views ?? 0} sub={data.topVideos[0]?.title ?? '—'} />
      </div>

      {/* Views over time */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-5">Views over time</h2>
        {viewsChartData.every((d) => d.value === 0) ? (
          <EmptyChart label="views" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={viewsChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#334155]" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="value" name="Views" stroke="#6366f1" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subscriber growth */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-5">New subscribers over time</h2>
        {subsChartData.every((d) => d.value === 0) ? (
          <EmptyChart label="subscriber" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={subsChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="subsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#334155]" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }}
                cursor={{ stroke: '#10b981', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="value" name="New subs" stroke="#10b981" strokeWidth={2} fill="url(#subsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top videos */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-5">Top videos by views</h2>
        {topVideosData.length === 0 ? (
          <EmptyChart label="video" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topVideosData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#334155]" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              />
              <Bar dataKey="views" name="Views" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
              <Bar dataKey="likes" name="Likes" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top videos table */}
      {data.topVideos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Top videos detail</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400">Video</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400">Views</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400">Likes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {data.topVideos.map((v) => (
                <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-3 text-gray-800 dark:text-slate-200 font-medium max-w-xs truncate">{v.title}</td>
                  <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-400">{v.views.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-400">{(v.likes?.length ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

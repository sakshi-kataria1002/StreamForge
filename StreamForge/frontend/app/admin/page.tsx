'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getReports, updateReportStatus, Report, ReportStatus, ReportTargetType } from '../../lib/api/moderation.api';

interface RootState {
  auth: { user: { id: string; name: string; role?: string } | null; accessToken: string | null };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  reviewed:  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
  actioned:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
  dismissed: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 border border-gray-200 dark:border-slate-600',
};

const TARGET_LABELS: Record<ReportTargetType, string> = { video: 'Video', comment: 'Comment', user: 'User' };
const STATUS_OPTIONS: ReportStatus[] = ['pending', 'reviewed', 'actioned', 'dismissed'];
const FILTER_STATUSES: Array<ReportStatus | ''> = ['', 'pending', 'reviewed', 'actioned', 'dismissed'];

export default function AdminModerationPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    if (user.role && user.role !== 'admin') router.replace('/');
  }, [user, router]);

  const fetchReports = useCallback(async (pg = 1, status = statusFilter) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReports({ ...(status ? { status } : {}), page: pg, limit: 20 }, accessToken);
      setReports(res.reports);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    if (user && accessToken) fetchReports(1, statusFilter);
  }, [user, accessToken, statusFilter]); // eslint-disable-line

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    if (!accessToken) return;
    setUpdatingId(reportId);
    try {
      const updated = await updateReportStatus(reportId, newStatus, accessToken);
      setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch { /* silent */ } finally {
      setUpdatingId(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Review and action user-submitted reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            {FILTER_STATUSES.map((s) => (
              <button
                key={s === '' ? 'all' : s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {!loading && <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">{total} report{total !== 1 ? 's' : ''}</span>}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-5 py-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-3 w-16 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-3 flex-1 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-6 w-28 rounded-lg bg-gray-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No reports found</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {statusFilter ? `No ${statusFilter} reports at this time.` : 'No reports have been filed yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-left">
                    {['Type', 'Reason', 'Reported by', 'Description', 'Date', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                          {TARGET_LABELS[report.targetType]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800 dark:text-slate-200 capitalize font-medium">{report.reason}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700 dark:text-slate-300 font-medium">{report.reportedBy.name}</div>
                        <div className="text-xs text-gray-400 dark:text-slate-500">{report.reportedBy.email}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-gray-500 dark:text-slate-400 text-xs truncate">
                          {report.description || <span className="italic text-gray-300 dark:text-slate-600">No description</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-slate-400 text-xs">{formatDate(report.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report._id, e.target.value as ReportStatus)}
                            disabled={updatingId === report._id}
                            className={`appearance-none pl-2 pr-6 py-1 rounded-md text-xs font-semibold cursor-pointer disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_STYLES[report.status]}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => fetchReports(page - 1)} disabled={page <= 1 || loading} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-sm text-gray-500 dark:text-slate-400">Page {page} of {totalPages}</span>
            <button onClick={() => fetchReports(page + 1)} disabled={page >= totalPages || loading} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getVideo, updateVideo } from '../../../../lib/api/video.api';
import Link from 'next/link';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!id) return;
    getVideo(id)
      .then((v) => {
        if (v.owner?._id !== user.id) { router.replace('/dashboard'); return; }
        setTitle(v.title);
        setDescription(v.description || '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id) return;
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      await updateVideo(id, { title: title.trim(), description: description.trim() }, accessToken);
      router.push('/dashboard');
    } catch {
      setError('Failed to save changes. Please try again.');
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center text-center">
        <div>
          <p className="text-gray-700 dark:text-slate-300 font-semibold">Video not found</p>
          <Link href="/dashboard" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="relative bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-2xl mx-auto px-8 py-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-sm mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Video</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="video-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Title</label>
              <input
                id="video-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                placeholder="Enter video title"
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-shadow"
              />
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 text-right">{title.length}/200</p>
            </div>
            <div>
              <label htmlFor="video-description" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                id="video-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Describe your video..."
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-shadow resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 text-right">{description.length}/5000</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

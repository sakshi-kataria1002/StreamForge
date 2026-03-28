'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  getPlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
  Playlist,
  PlaylistVideo,
} from '../../../../lib/api/playlist.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatDuration(s: number) {
  if (!s) return '';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function EditPlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!id || !accessToken) return;
    getPlaylist(id, accessToken)
      .then((p) => {
        if (p.owner._id !== user.id) { router.replace('/playlists'); return; }
        setPlaylist(p);
        setTitle(p.title);
        setDescription(p.description);
        setVisibility(p.visibility);
        setVideos(p.videos);
      })
      .catch(() => router.replace('/playlists'))
      .finally(() => setLoading(false));
  }, [id, user, accessToken, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id) return;
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError(''); setSuccess(false);
    try {
      await updatePlaylist(id, {
        title: title.trim(),
        description: description.trim(),
        visibility,
        videos: videos.map((v) => v._id) as any,
      }, accessToken);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!accessToken || !id) return;
    setRemovingId(videoId);
    try {
      await removeVideoFromPlaylist(id, videoId, accessToken);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch { /* silent */ } finally {
      setRemovingId(null);
    }
  };

  const moveVideo = (from: number, to: number) => {
    if (to < 0 || to >= videos.length) return;
    const next = [...videos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setVideos(next);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <Link href="/playlists" className="inline-flex items-center gap-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-sm mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            My Playlists
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Playlist</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
        {/* Metadata form */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-5">Playlist details</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
              Changes saved!
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Optional description…"
                className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Visibility</label>
              <div className="flex gap-3">
                {(['public', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      visibility === v
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <Link
                href={`/playlists/${id}`}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                View playlist
              </Link>
            </div>
          </form>
        </div>

        {/* Video list */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Videos <span className="text-gray-400 dark:text-slate-500 font-normal">({videos.length})</span>
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500">Use arrows to reorder</p>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-slate-500">
              No videos in this playlist yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-slate-800">
              {videos.map((v, idx) => (
                <li key={v._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveVideo(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveVideo(idx, idx + 1)}
                      disabled={idx === videos.length - 1}
                      className="p-0.5 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>

                  {/* Index */}
                  <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-5 text-right shrink-0">{idx + 1}</span>

                  {/* Thumbnail */}
                  <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300 dark:text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    )}
                    {v.duration > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/70 text-white px-1 rounded font-semibold">{formatDuration(v.duration)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/videos/${v._id}`} className="text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {v.title}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{v.owner.name}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveVideo(v._id)}
                    disabled={removingId === v._id}
                    className="shrink-0 p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    title="Remove from playlist"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

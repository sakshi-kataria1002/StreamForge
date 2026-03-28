'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyPlaylists, createPlaylist, deletePlaylist, Playlist } from '../../lib/api/playlist.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function PlaylistCard({ playlist, onDelete }: { playlist: Playlist; onDelete: (id: string) => void }) {
  const cover = playlist.videos[0]?.thumbnailUrl ?? null;
  const count = playlist.videos.length;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-md overflow-hidden transition-all duration-200">
      {/* Thumbnail stack */}
      <Link href={`/playlists/${playlist._id}`} className="block relative aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden">
        {cover ? (
          <img src={cover} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-300 dark:text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
        )}
        {/* Video count badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-semibold">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          {count}
        </div>
        {/* Private badge */}
        {playlist.visibility === 'private' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Private
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/playlists/${playlist._id}`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {playlist.title}
            </h3>
          </Link>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {count} video{count !== 1 ? 's' : ''}
          </p>
          {playlist.description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">{playlist.description}</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/playlists/${playlist._id}/edit`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </Link>
          <button
            onClick={() => onDelete(playlist._id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getMyPlaylists(accessToken)
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !accessToken) return;
    setCreating(true);
    try {
      const p = await createPlaylist({ title: newTitle.trim(), description: newDesc.trim(), visibility: newVisibility }, accessToken);
      setPlaylists((prev) => [p, ...prev]);
      setNewTitle(''); setNewDesc(''); setNewVisibility('public'); setShowCreate(false);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm('Delete this playlist?')) return;
    await deletePlaylist(id, accessToken).catch(() => {});
    setPlaylists((prev) => prev.filter((p) => p._id !== id));
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Playlists</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Playlist
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Create playlist</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Coding Tutorials"
                  maxLength={200}
                  autoFocus
                  required
                  className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                  maxLength={2000}
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
                      onClick={() => setNewVisibility(v)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        newVisibility === v
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
                  disabled={!newTitle.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating…' : 'Create playlist'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse">
              <div className="aspect-video rounded-t-2xl bg-gray-200 dark:bg-slate-700" />
              <div className="p-4 space-y-2">
                <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-slate-300 font-semibold">No playlists yet</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Create a playlist to organise your favourite videos</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create your first playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {playlists.map((p) => (
            <PlaylistCard key={p._id} playlist={p} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

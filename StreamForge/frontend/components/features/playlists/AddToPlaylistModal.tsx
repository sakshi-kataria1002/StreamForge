'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getVideoPlaylistStatus,
  getMyPlaylists,
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  PlaylistStatus,
} from '../../../lib/api/playlist.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

interface Props {
  videoId: string;
  onClose: () => void;
}

export default function AddToPlaylistModal({ videoId, onClose }: Props) {
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const [playlists, setPlaylists] = useState<PlaylistStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getVideoPlaylistStatus(videoId, accessToken)
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [videoId, accessToken]);

  const toggle = async (playlistId: string, hasVideo: boolean) => {
    if (!accessToken || saving) return;
    setSaving(playlistId);
    try {
      if (hasVideo) {
        await removeVideoFromPlaylist(playlistId, videoId, accessToken);
      } else {
        await addVideoToPlaylist(playlistId, videoId, accessToken);
      }
      setPlaylists((prev) =>
        prev.map((p) => (p._id === playlistId ? { ...p, hasVideo: !hasVideo } : p))
      );
    } catch { /* silent */ } finally {
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !accessToken) return;
    setCreating(true);
    try {
      const playlist = await createPlaylist({ title: newTitle.trim() }, accessToken);
      await addVideoToPlaylist(playlist._id, videoId, accessToken);
      setPlaylists((prev) => [{ _id: playlist._id, title: playlist.title, hasVideo: true }, ...prev]);
      setNewTitle('');
      setShowNew(false);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Save to playlist</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Playlist list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : playlists.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">
                No playlists yet. Create one below.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-slate-800">
                {playlists.map((p) => (
                  <li key={p._id}>
                    <button
                      onClick={() => toggle(p._id, p.hasVideo)}
                      disabled={saving === p._id}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-left disabled:opacity-60"
                    >
                      {/* Checkbox */}
                      <span className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                        p.hasVideo
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}>
                        {p.hasVideo && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-gray-800 dark:text-slate-200 truncate">{p.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* New playlist */}
          <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-4">
            {showNew ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Playlist name"
                  autoFocus
                  className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || creating}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {creating ? 'Creating…' : 'Create & save'}
                  </button>
                  <button
                    onClick={() => { setShowNew(false); setNewTitle(''); }}
                    className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New playlist
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

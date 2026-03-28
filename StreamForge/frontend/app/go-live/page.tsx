'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { createStream, goLive } from '../../lib/api/livestream.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

export default function GoLivePage() {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'ready' | 'going-live'>('form');
  const [error, setError] = useState<string | null>(null);
  const [creatingStream, setCreatingStream] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);

  if (!currentUser || !accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800 dark:text-slate-200">Sign in to go live</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">You need to be logged in to start a stream.</p>
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a stream title.'); return; }
    setCreatingStream(true);
    setError(null);
    try {
      const stream = await createStream({ title: title.trim(), description: description.trim() }, accessToken);
      setStreamKey(stream.streamKey);
      setStreamId(stream._id);
      setStep('ready');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create stream.');
    } finally {
      setCreatingStream(false);
    }
  };

  const handleGoLive = async () => {
    if (!streamId) return;
    setStep('going-live');
    setError(null);
    try {
      await goLive(streamId, accessToken);
      router.push(`/live/${streamId}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to go live.');
      setStep('ready');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Creator Studio
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Go Live</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1.5">Start streaming to your audience</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl ring-1 ring-gray-200 dark:ring-slate-800 p-7 shadow-xl shadow-gray-200/60 dark:shadow-black/50">
          {step === 'form' && (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Stream Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you streaming today?"
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell your audience what to expect…"
                  rows={3}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={creatingStream} className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {creatingStream ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Setting up stream…
                  </span>
                ) : 'Create Stream'}
              </button>
            </form>
          )}

          {(step === 'ready' || step === 'going-live') && streamKey && (
            <div className="space-y-6">
              <div className="bg-gray-100 dark:bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Stream title</p>
                <p className="text-gray-900 dark:text-white font-medium">{title}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Stream Key</p>
                  <button onClick={() => setKeyVisible((v) => !v)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                    {keyVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-3 ring-1 ring-gray-200 dark:ring-slate-700">
                  <code className="flex-1 min-w-0 text-xs text-emerald-600 dark:text-emerald-400 font-mono break-all">
                    {keyVisible ? streamKey : '•'.repeat(streamKey.length)}
                  </code>
                  <button onClick={() => navigator.clipboard.writeText(streamKey)} className="shrink-0 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700">
                    Copy
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 dark:text-slate-500">Keep this key private. Use it with OBS or any broadcasting software.</p>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

              <button onClick={handleGoLive} disabled={step === 'going-live'} className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {step === 'going-live' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Going Live…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Go Live Now
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

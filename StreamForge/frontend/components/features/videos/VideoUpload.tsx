'use client';

import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { uploadVideo } from '../../../lib/api/video.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function generateThumbnail(videoFile: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    let resolved = false;

    const capture = () => {
      if (resolved) return;
      resolved = true;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    video.addEventListener('seeked', capture);
    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, video.duration > 0 ? video.duration / 4 : 0);
    });
    video.addEventListener('canplay', () => {
      setTimeout(() => { if (!resolved) capture(); }, 2000);
    });
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      if (!resolved) { resolved = true; resolve(null); }
    });

    video.load();
  });
}

export default function VideoUpload() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneTitle, setDoneTitle] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!currentUser || !accessToken) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-800 dark:text-slate-200">Sign in to upload</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Create a free account to start sharing your content.</p>
      </div>
    );
  }

  const reset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setProgress(0);
    setUploading(false);
    setDone(false);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = (f: File) => {
    setFile(f);
    setError('');
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('video/')) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || !accessToken) return;
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      const thumbnailBlob = await generateThumbnail(file);
      if (thumbnailBlob) formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');

      const video = await uploadVideo(formData, accessToken, setProgress);
      setDoneTitle(video.title);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Video published!</h2>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-2 max-w-xs mx-auto">{doneTitle}</p>
        <div className="flex justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Upload another
          </button>
          <Link
            href="/feed"
            className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            Go to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Left: Drop zone ── */}
        <div className="lg:col-span-2">
          <div
            className={`relative h-64 lg:h-full min-h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
              dragging
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.01]'
                : file
                ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-500/5'
                : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/30 hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              disabled={uploading}
              aria-label="Upload video file"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="hidden"
            />

            {file ? (
              <div className="px-6 w-full">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate px-2">{file.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                {!uploading && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="mt-3 text-xs text-red-400 hover:text-red-500 font-medium transition-colors"
                  >
                    Remove file
                  </button>
                )}
              </div>
            ) : (
              <div className="px-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Drop your video here</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">or <span className="text-indigo-500 font-medium">browse files</span></p>
                <p className="text-xs text-gray-300 dark:text-slate-600 mt-3">MP4, MOV, AVI, MKV · up to 500 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              maxLength={200}
              placeholder="Give your video a title"
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-900 placeholder-gray-300 dark:placeholder-slate-600 transition-shadow"
            />
            <p className="text-xs text-gray-300 dark:text-slate-600 mt-1 text-right">{title.length}/200</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Description <span className="text-gray-300 dark:text-slate-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              maxLength={5000}
              rows={5}
              placeholder="Tell viewers about your video..."
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 resize-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-900 placeholder-gray-300 dark:placeholder-slate-600 transition-shadow"
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl px-4 py-3">
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-indigo-600 dark:text-indigo-400">Uploading video...</span>
                <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
              </div>
              <div className="w-full bg-indigo-100 dark:bg-indigo-500/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file || !title.trim()}
            className="w-full py-3 px-6 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Uploading {progress}%...
              </span>
            ) : 'Publish Video'}
          </button>

          <p className="text-xs text-center text-gray-300 dark:text-slate-600">
            By uploading, you agree to our terms of service.
          </p>
        </div>

      </div>
    </div>
  );
}

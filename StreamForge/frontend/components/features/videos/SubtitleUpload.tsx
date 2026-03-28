'use client';

import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { uploadSubtitle, deleteSubtitle } from '../../../lib/api/subtitle.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

interface SubtitleUploadProps {
  videoId: string;
  initialSubtitleUrl?: string | null;
}

export default function SubtitleUpload({ videoId, initialSubtitleUrl }: SubtitleUploadProps) {
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(initialSubtitleUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    setSuccessMsg(null);

    if (file && !file.name.endsWith('.srt')) {
      setError('Only .srt files are accepted.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return;
    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await uploadSubtitle(videoId, selectedFile, accessToken);
      setSubtitleUrl(result.subtitleUrl);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg('Subtitle uploaded successfully.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken) return;
    setDeleting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await deleteSubtitle(videoId, accessToken);
      setSubtitleUrl(null);
      setSuccessMsg('Subtitle removed.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to remove subtitle.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-4 space-y-3"
      aria-label="Subtitle upload"
    >
      <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
        Subtitles / Captions
      </h3>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            subtitleUrl ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
          aria-hidden="true"
        />
        <span className={subtitleUrl ? 'text-emerald-400' : 'text-slate-400'}>
          {subtitleUrl ? 'Subtitle file uploaded' : 'No subtitle file'}
        </span>
        {subtitleUrl && (
          <a
            href={subtitleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-indigo-400 hover:underline"
          >
            View file
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt"
            className="sr-only"
            onChange={handleFileChange}
          />
          <span
            className="inline-block px-3 py-1.5 text-sm rounded-lg border border-slate-600
                       text-slate-300 hover:border-indigo-500 hover:text-indigo-300
                       transition-colors duration-150 cursor-pointer"
          >
            {selectedFile ? selectedFile.name : 'Choose .srt file'}
          </span>
        </label>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white
                     hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-150"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>

        {subtitleUrl && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-red-700/60
                       text-red-400 hover:bg-red-900/30 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors duration-150 ml-auto"
          >
            {deleting ? 'Removing…' : 'Remove subtitle'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="text-xs text-emerald-400" role="status">
          {successMsg}
        </p>
      )}
    </section>
  );
}

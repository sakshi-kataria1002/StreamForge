'use client';

import { useState } from 'react';
import { generateVideoSummary } from '../../../lib/api/summary.api';

interface VideoSummaryProps {
  videoId: string;
  initialSummary?: string | null;
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-indigo-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  );
}

export default function VideoSummary({ videoId, initialSummary }: VideoSummaryProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateVideoSummary(videoId);
      setSummary(result.summary);
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
        ?.response?.data?.error;
      if (apiError?.code === 'INSUFFICIENT_CREDITS') {
        setError('AI summaries are currently unavailable (API credits exhausted).');
      } else if (apiError?.code === 'INVALID_API_KEY') {
        setError('AI summaries are currently unavailable (API key not configured).');
      } else {
        setError(apiError?.message ?? 'Failed to generate summary. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 p-4 space-y-3"
      aria-label="AI-generated video summary"
    >
      <div className="flex items-center gap-2">
        <span className="text-indigo-500 dark:text-indigo-400">
          <SparkleIcon />
        </span>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 tracking-wide uppercase">
          AI Summary
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">Powered by Claude</span>
      </div>

      {summary ? (
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{summary}</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm py-1">
          <SpinnerIcon />
          <span>Generating summary…</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            No summary yet. Generate one with AI to get a quick overview of this video.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                       bg-indigo-600 text-white hover:bg-indigo-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150"
          >
            <SparkleIcon />
            Generate Summary
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-1" role="alert">
          {error}
        </p>
      )}

      {summary && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          title="Regenerate summary"
        >
          {loading ? <SpinnerIcon /> : <SparkleIcon />}
          Regenerate
        </button>
      )}
    </section>
  );
}

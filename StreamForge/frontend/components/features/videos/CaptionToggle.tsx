'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── SRT parser ──────────────────────────────────────────────────────────────
interface CaptionCue {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

function srtTimeToSeconds(ts: string): number {
  const normalised = ts.replace(',', '.');
  const parts = normalised.split(':');
  const hours = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

function parseSrt(raw: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const timeLine = lines[1];
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/
    );
    if (!timeMatch) continue;

    const start = srtTimeToSeconds(timeMatch[1]);
    const end = srtTimeToSeconds(timeMatch[2]);
    const text = lines.slice(2).join('\n').trim();

    if (text) cues.push({ start, end, text });
  }

  return cues;
}

// ── Component ───────────────────────────────────────────────────────────────
interface CaptionToggleProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  subtitleUrl: string | null;
}

function CCIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path
        strokeLinecap="round"
        d="M7 12.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5M14 12.5c.5-1 1.5-1.5 2.5-1.5s2 .5 2.5 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function CaptionToggle({ videoRef, subtitleUrl }: CaptionToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const rafRef = useRef<number | null>(null);

  const loadSubtitles = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      setCues(parseSrt(text));
      setLoadError(false);
    } catch {
      setLoadError(true);
      setEnabled(false);
    }
  }, []);

  const handleToggle = async () => {
    if (!subtitleUrl) return;
    const next = !enabled;
    setEnabled(next);
    setActiveCue(null);

    if (next && cues.length === 0) {
      await loadSubtitles(subtitleUrl);
    }

    if (!next && rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled || cues.length === 0) return;

    const tick = () => {
      const video = videoRef.current;
      if (!video) return;

      const t = video.currentTime;
      const match = cues.find((c) => t >= c.start && t <= c.end);
      setActiveCue(match?.text ?? null);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, cues, videoRef]);

  useEffect(() => {
    setCues([]);
    setActiveCue(null);
    setEnabled(false);
  }, [subtitleUrl]);

  const disabled = !subtitleUrl;

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={disabled}
        title={disabled ? 'No subtitles available' : enabled ? 'Hide captions' : 'Show captions'}
        aria-label={enabled ? 'Hide captions' : 'Show captions'}
        aria-pressed={enabled}
        className={`
          inline-flex items-center justify-center rounded-md p-1.5 transition-colors duration-150
          ${disabled ? 'opacity-30 cursor-not-allowed text-slate-500' : ''}
          ${!disabled && enabled ? 'text-indigo-400 bg-indigo-900/40' : ''}
          ${!disabled && !enabled ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' : ''}
        `}
      >
        <CCIcon active={enabled} />
      </button>

      {enabled && activeCue && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="
            absolute bottom-10 left-1/2 -translate-x-1/2
            max-w-[80%] text-center
            bg-black/75 text-white text-sm leading-snug
            px-3 py-1.5 rounded-md
            pointer-events-none select-none
            whitespace-pre-wrap
          "
        >
          {activeCue}
        </div>
      )}

      {loadError && (
        <span className="text-xs text-red-400 ml-2" role="alert">
          Could not load subtitle file.
        </span>
      )}
    </>
  );
}

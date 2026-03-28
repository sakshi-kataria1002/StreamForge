'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const PARTICLES = [
  { color: 'bg-violet-400', size: 'w-3 h-3', top: '10%', left: '15%', delay: '0s', duration: '3s' },
  { color: 'bg-indigo-400', size: 'w-2 h-2', top: '20%', left: '80%', delay: '0.3s', duration: '2.5s' },
  { color: 'bg-pink-400',   size: 'w-4 h-4', top: '5%',  left: '55%', delay: '0.6s', duration: '3.5s' },
  { color: 'bg-amber-400',  size: 'w-2 h-2', top: '70%', left: '10%', delay: '0.9s', duration: '2.8s' },
  { color: 'bg-emerald-400',size: 'w-3 h-3', top: '80%', left: '85%', delay: '0.2s', duration: '3.2s' },
  { color: 'bg-sky-400',    size: 'w-2 h-2', top: '40%', left: '5%',  delay: '1.1s', duration: '2.6s' },
  { color: 'bg-rose-400',   size: 'w-3 h-3', top: '60%', left: '92%', delay: '0.5s', duration: '3s'   },
  { color: 'bg-yellow-400', size: 'w-2 h-2', top: '90%', left: '50%', delay: '0.8s', duration: '2.7s' },
  { color: 'bg-violet-300', size: 'w-2 h-2', top: '30%', left: '70%', delay: '1.4s', duration: '3.3s' },
  { color: 'bg-indigo-300', size: 'w-4 h-4', top: '85%', left: '30%', delay: '0.4s', duration: '2.9s' },
];

export default function MembershipSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-300/30 dark:bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-300/30 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-200/20 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>

      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute ${p.color} ${p.size} rounded-sm opacity-70 animate-bounce`}
          style={{ top: p.top, left: p.left, animationDelay: p.delay, animationDuration: p.duration }}
        />
      ))}

      <div
        className={`relative z-10 w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-gray-100 dark:ring-slate-800 p-10 text-center transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="flex items-center justify-center mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-300/50">
          <span className="text-4xl" role="img" aria-label="party">🎉</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to the channel!</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          Your membership is now active. Enjoy exclusive perks, ad-free viewing, and direct support for your favourite creator.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Membership confirmed</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors text-center">
            Go to Home
          </Link>
          <Link href="/feed" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-center">
            Browse Feed
          </Link>
        </div>

        {sessionId && (
          <p className="mt-6 text-[11px] text-gray-300 dark:text-slate-600 break-all">Ref: {sessionId}</p>
        )}
      </div>
    </div>
  );
}

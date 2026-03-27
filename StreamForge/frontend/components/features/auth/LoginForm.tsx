'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '../../../lib/store/store';
import { loginThunk } from '../../../lib/store/authSlice';
import Link from 'next/link';

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.rejected.match(result)) {
      setError(result.payload as string);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col bg-indigo-50 dark:bg-slate-900 relative overflow-hidden">

        {/* Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/25 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/15 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-14">

          {/* Top tagline */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
              Your creator space
            </span>
          </div>

          {/* Main headline */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Create.<br />Share.<br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Grow.
              </span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-base leading-relaxed max-w-sm">
              Everything you need to upload videos, build your audience and connect with creators.
            </p>

            {/* Divider */}
            <div className="w-12 h-0.5 bg-indigo-400/50 rounded-full" />

            {/* Stats row */}
            <div className="flex items-center gap-8">
              {[
                { value: '500+', label: 'Creators' },
                { value: '10K+', label: 'Videos' },
                { value: '100%', label: 'Free' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="border-l-2 border-indigo-300 dark:border-indigo-500/40 pl-5">
            <p className="text-gray-600 dark:text-slate-300 text-sm italic leading-relaxed">
              "The cleanest platform I've used to share my videos. Simple and just works."
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                A
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-xs font-semibold">Alex Johnson</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs">Video Creator</p>
              </div>
            </div>
          </div>

          <p className="text-gray-400 dark:text-slate-700 text-xs">© 2025 StreamForge. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right — Form panel ── */}
      <div className="flex flex-col justify-center items-center bg-gray-50 dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-sm">

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Sign in to your StreamForge account</p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-shadow"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '../../../lib/store/store';
import { setCredentials } from '../../../lib/store/authSlice';
import { register } from '../../../lib/api/auth.api';
import Link from 'next/link';

export default function SignupForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await register(name, email, password);
      dispatch(setCredentials({ user: response.data.user, accessToken: response.data.accessToken }));
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 dark:placeholder-slate-500 transition-shadow';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col bg-purple-50 dark:bg-slate-900 relative overflow-hidden">

        {/* Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/25 dark:bg-indigo-600/25 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-400/10 dark:bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #a5b4fc 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-14">

          {/* Top badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" />
              Free to get started
            </span>
          </div>

          {/* Main headline */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Start sharing<br />your world<br />
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-400 bg-clip-text text-transparent">
                today.
              </span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-base leading-relaxed max-w-sm">
              Create your free account and start uploading videos to an audience that wants to watch.
            </p>

            <div className="w-12 h-0.5 bg-purple-400/50 rounded-full" />

            {/* Checklist */}
            <ul className="space-y-3">
              {[
                'Upload and share videos instantly',
                'Build a subscriber base',
                'Comment and engage with creators',
                'Free forever — no credit card needed',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-300 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial */}
          <div className="border-l-2 border-purple-300 dark:border-purple-500/40 pl-5">
            <p className="text-gray-600 dark:text-slate-300 text-sm italic leading-relaxed">
              "I signed up in two minutes and had my first video live the same day. Couldn't be easier."
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                S
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-xs font-semibold">Sarah Miller</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs">Content Creator</p>
              </div>
            </div>
          </div>

          <p className="text-gray-400 dark:text-slate-700 text-xs">© 2025 StreamForge. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right — Form panel ── */}
      <div className="flex flex-col justify-center items-center bg-gray-50 dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-sm">

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Free forever. No credit card needed.</p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={inputClass}
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
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400">
            <Link href="/forgot-password" className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

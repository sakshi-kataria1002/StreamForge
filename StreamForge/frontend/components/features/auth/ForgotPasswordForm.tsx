'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left — Branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-indigo-50 dark:bg-slate-900 px-12 py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/15 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 flex flex-col justify-center h-full">
          <p className="text-3xl font-bold text-gray-900 dark:text-white leading-snug">
            Happens to the<br />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              best of us.
            </span>
          </p>
          <p className="text-gray-500 dark:text-slate-400 mt-4 text-sm leading-relaxed max-w-sm">
            Enter your email and we'll send you a link to reset your password and get back to creating.
          </p>
        </div>

        <p className="text-gray-400 dark:text-slate-600 text-xs z-10">© 2025 StreamForge. All rights reserved.</p>
      </div>

      {/* ── Right — Form panel ── */}
      <div className="flex flex-col justify-center items-center bg-gray-50 dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-sm">

          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                We sent a password reset link to <span className="font-medium text-gray-700 dark:text-slate-200">{email}</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">Didn't receive it? Check your spam folder.</p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">We'll send a reset link to your email.</p>

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

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] mt-2"
                >
                  Send reset link
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
                Remember it?{' '}
                <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

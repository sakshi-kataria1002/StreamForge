'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getMembershipStatus, createCheckoutSession, cancelMembership, MembershipStatus } from '../../../lib/api/membership.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

const TIERS = [
  { id: 'basic', label: 'Basic', price: 4.99, perks: 'Ad-free viewing + member badge' },
  { id: 'premium', label: 'Premium', price: 9.99, perks: 'Everything in Basic + exclusive content' },
] as const;

export default function MembershipButton({ creatorId }: { creatorId: string }) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTiers, setShowTiers] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !accessToken) { setLoading(false); return; }
    getMembershipStatus(creatorId, accessToken)
      .then(setStatus)
      .catch(() => setError('Failed to load membership status'))
      .finally(() => setLoading(false));
  }, [creatorId, currentUser, accessToken]);

  const handleJoin = async (tier: (typeof TIERS)[number]) => {
    if (!accessToken) return;
    setCheckingOut(tier.id);
    setError(null);
    try {
      const { url } = await createCheckoutSession({ creatorId, tier: tier.id, price: tier.price }, accessToken);
      window.location.href = url;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Could not start checkout.');
      setCheckingOut(null);
    }
  };

  const handleCancel = async () => {
    if (!accessToken || !status?.membership) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelMembership(status.membership._id, accessToken);
      setStatus({ isMember: false, membership: null });
      setShowCancelConfirm(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />;

  if (!currentUser || !accessToken) {
    return (
      <button disabled className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed">
        Join Channel
      </button>
    );
  }

  if (status?.isMember && status.membership) {
    const tierLabel = TIERS.find((t) => t.id === status.membership!.tier)?.label ?? status.membership.tier;
    return (
      <div className="relative">
        <button
          onClick={() => setShowCancelConfirm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <span className="text-base leading-none">✓</span>
          <span>Member · {tierLabel}</span>
          <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {showCancelConfirm && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black/5 dark:ring-slate-700 z-20 p-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1">Cancel membership?</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">You'll keep access until the end of your billing period.</p>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                {cancelling ? 'Cancelling…' : 'Yes, cancel'}
              </button>
              <button onClick={() => { setShowCancelConfirm(false); setError(null); }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowTiers((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
      >
        Join Channel
        <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {showTiers && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-black/5 dark:ring-slate-700 z-20 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 px-1 pb-1">Choose a plan</p>
          {error && <p className="text-xs text-red-500 px-1">{error}</p>}
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => handleJoin(tier)}
              disabled={!!checkingOut}
              className="w-full flex items-center justify-between p-3 rounded-xl text-left border border-gray-100 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group disabled:opacity-60"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                  {checkingOut === tier.id ? 'Redirecting…' : tier.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{tier.perks}</p>
              </div>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0 ml-3">
                ${tier.price}<span className="text-xs font-normal text-gray-400">/mo</span>
              </span>
            </button>
          ))}
          <p className="text-[11px] text-center text-gray-400 dark:text-slate-500 pt-1">Billed monthly · Cancel any time</p>
        </div>
      )}
    </div>
  );
}

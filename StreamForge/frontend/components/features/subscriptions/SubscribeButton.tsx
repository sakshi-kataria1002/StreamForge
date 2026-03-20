'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getSubscriptionStatus,
  toggleSubscribe,
  SubscriptionStatus,
} from '../../../lib/api/subscription.api';

interface RootState {
  auth: { user: { id: string; name: string } | null; accessToken: string | null };
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface SubscribeButtonProps {
  creatorId: string;
  creatorName: string;
}

export default function SubscribeButton({ creatorId, creatorName }: SubscribeButtonProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!currentUser || !accessToken) {
      setLoading(false);
      return;
    }
    getSubscriptionStatus(creatorId, accessToken)
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [creatorId, currentUser, accessToken]);

  const handleToggle = async () => {
    if (!accessToken || !status) return;
    setToggling(true);
    // Optimistic update
    setStatus((prev) =>
      prev
        ? {
            subscribed: !prev.subscribed,
            subscriberCount: prev.subscribed
              ? prev.subscriberCount - 1
              : prev.subscriberCount + 1,
          }
        : prev
    );
    try {
      const updated = await toggleSubscribe(creatorId, accessToken);
      setStatus(updated);
    } catch {
      // Revert on failure
      setStatus((prev) =>
        prev
          ? {
              subscribed: !prev.subscribed,
              subscriberCount: prev.subscribed
                ? prev.subscriberCount - 1
                : prev.subscriberCount + 1,
            }
          : prev
      );
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />;
  }

  if (!currentUser || !accessToken) {
    return (
      <div className="flex items-center gap-3">
        <button
          disabled
          title="Sign in to subscribe"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          Subscribe
        </button>
      </div>
    );
  }

  const subscribed = status?.subscribed ?? false;
  const count = status?.subscriberCount ?? 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          subscribed
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        } disabled:opacity-60`}
      >
        {subscribed ? `✓ Subscribed` : `Subscribe`}
      </button>
      <span className="text-sm text-gray-500">{formatCount(count)} subscribers</span>
    </div>
  );
}

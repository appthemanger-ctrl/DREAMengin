// components/ads/SkipCreditBalance.tsx
// Phase 9 — Skip Credit Balance Display
//
// Shows user's skip credit balance in header/nav.
// Per ACTIVITY_FIRST_PROTOCOL.md §V (Skip Reward System)

'use client';

import { useEffect, useState } from 'react';

export function SkipCreditBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalance() {
      try {
        const res = await fetch('/api/skip-credits/balance');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.skip_credit?.credits_balance ?? 0);
        }
      } catch (err) {
        console.error('[SkipCreditBalance] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBalance();

    // Refresh every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse">
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-full cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
      title={`You have ${balance} skip ${balance === 1 ? 'credit' : 'credits'}. Next ${balance} ads will be skipped.`}
    >
      <span className="text-lg">🎫</span>
      <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
        {balance} {balance === 1 ? 'skip' : 'skips'}
      </span>
    </div>
  );
}

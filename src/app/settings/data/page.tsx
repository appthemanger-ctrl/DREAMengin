"use client";

import { useState } from "react";

export default function DeleteDataPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  function handleDelete() {
    // TODO: wire to Supabase / backend delete API
    setDone(true);
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-black px-4 py-8">
        <p className="mt-12 text-green-400">Your data has been deleted.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-4 py-8">
      <header className="mb-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white">Delete My Data</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Removes connectors, layout, feed config, and widget params. Your
          login identity is kept.
        </p>
      </header>

      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="mt-0.5 accent-red-500"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I understand this is permanent and cannot be undone.
        </label>

        <button
          type="button"
          disabled={!confirmed}
          onClick={handleDelete}
          className="mt-6 w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-40 hover:bg-red-500"
        >
          Delete My Data
        </button>
      </div>
    </main>
  );
}

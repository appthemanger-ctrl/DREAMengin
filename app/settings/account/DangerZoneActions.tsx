'use client';

import { useState } from 'react';

export default function DangerZoneActions() {
  const [deleteDataPending, setDeleteDataPending] = useState(false);
  const [deleteDreamPending, setDeleteDreamPending] = useState(false);

  async function handleDeleteData() {
    if (
      !window.confirm(
        'This will permanently remove your connections, widgets, and content.\n\nYour login and handle will be kept.\n\nAre you sure?'
      )
    ) return;

    setDeleteDataPending(true);
    try {
      const res = await fetch('/api/account/delete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_MY_DATA' }),
      });
      const json = await res.json();
      if (json.ok) {
        alert(`Data deleted: ${(json.deleted as string[]).join(', ')}`);
      } else {
        alert(`Error: ${json.error?.message ?? 'Unknown error'}`);
      }
    } catch {
      alert('Request failed. Please try again.');
    } finally {
      setDeleteDataPending(false);
    }
  }

  async function handleDeleteDream() {
    const confirmed = window.prompt(
      'This will permanently delete your account and cannot be undone.\n\nType DELETE_MY_DREAM to confirm:'
    );
    if (confirmed !== 'DELETE_MY_DREAM') return;

    setDeleteDreamPending(true);
    try {
      const res = await fetch('/api/account/delete-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_MY_DREAM' }),
      });
      const json = await res.json();
      if (json.ok) {
        alert('Your account has been deleted. You will be signed out.');
        window.location.href = '/';
      } else {
        alert(`Error: ${json.error?.message ?? 'Unknown error'}`);
      }
    } catch {
      alert('Request failed. Please try again.');
    } finally {
      setDeleteDreamPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          onClick={handleDeleteData}
          disabled={deleteDataPending}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors min-h-[44px] disabled:opacity-60"
        >
          {deleteDataPending ? 'Deleting…' : 'Delete My Data'}
        </button>
        <p className="mt-1 text-xs text-muted-foreground">
          Removes connections, widgets, and content. Your login is kept.
        </p>
      </div>
      <div>
        <button
          onClick={handleDeleteDream}
          disabled={deleteDreamPending}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors min-h-[44px] disabled:opacity-60"
        >
          {deleteDreamPending ? 'Deleting…' : 'Delete My Dream'}
        </button>
        <p className="mt-1 text-xs text-muted-foreground">
          Permanently deletes your account. Cannot be undone.
        </p>
      </div>
    </div>
  );
}

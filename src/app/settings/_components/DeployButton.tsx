'use client';

import React, { useState } from 'react';

export default function DeployButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function trigger() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/deploy', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === 'Cooldown') {
          setMessage(`Please wait ${json.remaining}s before triggering again.`);
        } else {
          setMessage('Failed to trigger deploy.');
        }
      } else {
        setMessage('Deploy triggered successfully.');
      }
    } catch {
      setMessage('Failed to trigger deploy.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={trigger} disabled={loading} className="rounded-lg bg-primary px-6 py-[9px] font-semibold text-white hover:bg-opacity-90 disabled:opacity-60">
        {loading ? 'Triggering...' : 'Trigger Deploy'}
      </button>
      {message && <span className="text-sm text-dark-6">{message}</span>}
    </div>
  );
} 
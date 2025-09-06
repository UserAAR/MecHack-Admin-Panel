'use client';

import React, { useState } from 'react';

export default function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/auth/change-password', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Failed to change password');
      else setSuccess('Password updated');
    } catch {
      setError('Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-stroke px-6 py-[9px] font-medium hover:shadow-1 dark:border-dark-3">
        Change Password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-lg dark:bg-gray-dark">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Change Password</h3>
              <button onClick={() => setOpen(false)} className="text-sm text-dark-6">Close</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">Current Password</label>
                <input className="w-full rounded border p-2" name="current" type="password" required />
              </div>
              <div>
                <label className="mb-1 block text-sm">New Password</label>
                <input className="w-full rounded border p-2" name="next" type="password" required />
              </div>
              <div>
                <label className="mb-1 block text-sm">Confirm New Password</label>
                <input className="w-full rounded border p-2" name="confirm" type="password" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-stroke px-5 py-[7px] dark:border-dark-3">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-6 py-[9px] font-semibold text-white disabled:opacity-60">
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
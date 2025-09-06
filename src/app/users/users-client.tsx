"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/roles";

export default function UsersClient({ profiles, currentRole }: { profiles: { id: string; email: string; role: ProfileRole }[]; currentRole: ProfileRole | null }) {
  const [rows, setRows] = useState(profiles);
  const isSuperadmin = currentRole === "superadmin";

  const updateRole = async (id: string, role: ProfileRole) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (!error) setRows((r) => r.map((p) => (p.id === id ? { ...p, role } : p)));
  };

  const removeProfile = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("profiles").delete().eq("id", id);
    setRows((r) => r.filter((p) => p.id !== id));
  };

  return (
    <div className="overflow-hidden rounded border border-gray-200 dark:border-dark-3">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-3">
        <thead className="bg-gray-50 dark:bg-dark-3">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
            {isSuperadmin && <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-dark-3">
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-2">{p.email}</td>
              <td className="px-4 py-2">
                {isSuperadmin ? (
                  <select
                    className="rounded border p-1"
                    value={p.role}
                    onChange={(e) => updateRole(p.id, e.target.value as ProfileRole)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                ) : (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs">{p.role}</span>
                )}
              </td>
              {isSuperadmin && (
                <td className="px-4 py-2 text-right">
                  <button className="rounded border px-2 py-1 text-sm" onClick={() => removeProfile(p.id)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
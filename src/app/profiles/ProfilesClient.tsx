"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/roles";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";

export type ProfileRow = { id: string; email: string; role: ProfileRole; created_at: string | null };

function roleStyles(role: ProfileRole) {
  switch (role) {
    case "superadmin":
      return { badge: "bg-fuchsia-600 text-white ring-1 ring-fuchsia-400", dot: "bg-white", text: "text-fuchsia-700", border: "border-fuchsia-500", selectBg: "bg-fuchsia-50" };
    case "admin":
      return { badge: "bg-blue-600 text-white ring-1 ring-blue-400", dot: "bg-white", text: "text-blue-700", border: "border-blue-500", selectBg: "bg-blue-50" };
    default:
      return { badge: "bg-gray-700 text-white ring-1 ring-gray-400", dot: "bg-white", text: "text-gray-700", border: "border-gray-500", selectBg: "bg-gray-50" };
  }
}

function formatDate(v?: string | null) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "";
  }
}

export default function ProfilesClient({ initial, currentRole }: { initial: ProfileRow[]; currentRole: ProfileRole | null }) {
  const [allRows, setAllRows] = useState<ProfileRow[]>(initial);
  const [rows, setRows] = useState<ProfileRow[]>(initial);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | ProfileRole>("all");
  const isSuperadmin = currentRole === "superadmin";

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Debounced client-side filtering to avoid server roundtrips
  useEffect(() => {
    const t = setTimeout(() => {
      const q = search.trim().toLowerCase();
      const filtered = allRows.filter((r) => {
        const okRole = roleFilter === "all" || r.role === roleFilter;
        const okSearch = !q || r.email.toLowerCase().includes(q);
        return okRole && okSearch;
      });
      setRows(filtered);
    }, 150);
    return () => clearTimeout(t);
  }, [search, roleFilter, allRows]);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("profiles").select("id,email,role,created_at").order("created_at", { ascending: false });
      setAllRows((data || []) as any);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: ProfileRole) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (!error) {
        setAllRows((r) => r.map((p) => (p.id === id ? { ...p, role } : p)));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeProfile = async (id: string) => {
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    setLoading(true);
    try {
      await supabase.from("profiles").delete().eq("id", id);
      setAllRows((r) => r.filter((p) => p.id !== id));
    } finally {
      setLoading(false);
    }
  };

  async function resetPassword(userId: string) {
    const newPassword = prompt("Enter a new password (min 6 chars)");
    if (!newPassword) return;
    const fd = new FormData();
    fd.append("userId", userId);
    fd.append("newPassword", newPassword);
    const res = await fetch("/api/auth/admin-reset-password", { method: "POST", body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed to reset password (service key required)");
    } else {
      alert("Password reset successfully");
    }
  }

  const counts = useMemo(() => {
    const c: Record<"all" | ProfileRole, number> = { all: allRows.length, user: 0, admin: 0, superadmin: 0 } as any;
    for (const r of allRows) c[r.role]++;
    return c;
  }, [allRows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            className="w-72 rounded border p-2 focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="Search email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rounded border p-2 focus:border-primary focus:ring-2 focus:ring-primary/30" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}>
            <option value="all">All roles</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-dark-6">{loading ? "Loading..." : `${rows.length} result(s)`}</div>
          <button className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "small" }))} onClick={refresh} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setRoleFilter("all")} className={cn("rounded-full px-3 py-1 text-xs font-medium ring-1", roleFilter === "all" ? "bg-primary text-white ring-primary/60" : "bg-gray-100 text-dark ring-gray-300 dark:bg-dark-2 dark:text-white/80")}>All {counts.all}</button>
        <button onClick={() => setRoleFilter("user")} className={cn("rounded-full px-3 py-1 text-xs font-medium ring-1", roleFilter === "user" ? "bg-gray-700 text-white ring-gray-400" : "bg-gray-100 text-dark ring-gray-300 dark:bg-dark-2 dark:text-white/80")}>User {counts.user}</button>
        <button onClick={() => setRoleFilter("admin")} className={cn("rounded-full px-3 py-1 text-xs font-medium ring-1", roleFilter === "admin" ? "bg-blue-600 text-white ring-blue-400" : "bg-blue-50 text-blue-700 ring-blue-200")}>Admin {counts.admin}</button>
        <button onClick={() => setRoleFilter("superadmin")} className={cn("rounded-full px-3 py-1 text-xs font-medium ring-1", roleFilter === "superadmin" ? "bg-fuchsia-600 text-white ring-fuchsia-400" : "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200")}>Superadmin {counts.superadmin}</button>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 dark:border-dark-3">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-3">
          <thead className="bg-gray-50 dark:bg-dark-3">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Created</th>
              {isSuperadmin && <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-3">
            {rows.map((p) => {
              const s = roleStyles(p.role);
              return (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-2/40">
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">
                    {isSuperadmin ? (
                      <div className="inline-flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                        <select
                          className={cn("rounded px-2 py-1 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30", s.text, s.border, s.selectBg, "border")}
                          value={p.role}
                          onChange={(e) => updateRole(p.id, e.target.value as ProfileRole)}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </div>
                    ) : (
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", s.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                        {p.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">{formatDate(p.created_at)}</td>
                  {isSuperadmin && (
                    <td className="px-4 py-2 text-right space-x-2">
                      <button className={cn(buttonVariants({ variant: "outlineDanger", shape: "rounded", size: "small" }))} onClick={() => removeProfile(p.id)} disabled={loading}>
                        Delete
                      </button>
                      <button className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))} onClick={() => resetPassword(p.id)} disabled={loading}>
                        Reset Password
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={isSuperadmin ? 4 : 3} className="px-4 py-10 text-center text-sm text-dark-6">
                  {loading ? "Loading..." : "No results"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
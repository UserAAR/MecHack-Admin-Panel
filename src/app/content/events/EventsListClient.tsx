"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type Role = "user" | "admin" | "superadmin" | null;

export type EventRow = {
  id: string;
  title: string;
  location: string | null;
  event_date: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
};

export default function EventsListClient({ initial, role }: { initial: EventRow[]; role: Role }) {
  const [rows, setRows] = useState<EventRow[]>(initial);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  async function load() {
    setLoading(true);
    try {
      let query = supabase
        .from("events")
        .select("id,title,location,event_date,published_at,created_at,updated_at,image_url")
        .order("created_at", { ascending: false });
      if (search) {
        query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
      }
      if (status === "published") query = query.not("published_at", "is", null);
      if (status === "draft") query = query.is("published_at", null);
      const { data } = await query;
      setRows((data || []) as any);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  async function togglePublish(id: string, publish: boolean) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ published_at: publish ? new Date().toISOString() : null })
        .eq("id", id);
      if (!error) await load();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (!error) setRows((r) => r.filter((x) => x.id !== id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <input
            className="w-full max-w-sm rounded border p-2"
            placeholder="Search title or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {(role === "admin" || role === "superadmin") && (
          <Link href="/content/events/new" className={cn(buttonVariants({ variant: "primary", shape: "rounded", size: "small" }))}>
            New Event
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded border border-gray-200 dark:border-dark-3">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-3">
          <thead className="bg-gray-50 dark:bg-dark-3">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Title</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Location</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-3">
            {rows.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    {n.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image_url} alt="thumb" className="h-10 w-10 rounded object-cover" />
                    )}
                    <div className="truncate font-medium">{n.title}</div>
                  </div>
                </td>
                <td className="px-4 py-2">{n.location}</td>
                <td className="px-4 py-2 text-sm">{n.event_date ? new Date(n.event_date).toLocaleString() : "-"}</td>
                <td className="px-4 py-2">
                  {n.published_at ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Published</span>
                  ) : (
                    <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">Draft</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/content/events/${n.id}/edit`} className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}>
                      Edit
                    </Link>
                    {(role === "admin" || role === "superadmin") && (
                      n.published_at ? (
                        <button
                          onClick={() => togglePublish(n.id, false)}
                          className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}
                          disabled={loading}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => togglePublish(n.id, true)}
                          className={cn(buttonVariants({ variant: "primary", shape: "rounded", size: "small" }))}
                          disabled={loading}
                        >
                          Publish
                        </button>
                      )
                    )}
                    {(role === "admin" || role === "superadmin") && (
                      <button
                        onClick={() => remove(n.id)}
                        className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-dark-6">
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
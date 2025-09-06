"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/media/ImageUploader";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

type MediaItem = {
  id: string;
  name: string;
  path: string;
  url: string;
  updated_at?: string | null;
  created_at?: string | null;
  size?: number | null;
};

const FOLDERS = ["all", "news", "projects", "events", "uploads"] as const;

type Folder = typeof FOLDERS[number];

type SortCol = "name" | "updated_at";

type SortOrder = "asc" | "desc";

export default function MediaLibraryClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("grid");
  const [folder, setFolder] = useState<Folder>("all");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [total, setTotal] = useState(0);
  const [usageBytes, setUsageBytes] = useState<number | null>(null);

  // New UX states
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const prefix = folder === "all" ? "" : folder;

  async function load() {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const options: any = {
        limit: pageSize,
        offset: from,
        sortBy: { column: sortCol, order: sortOrder },
        search: search || undefined,
      };
      const { data, error } = await supabase.storage.from("media").list(prefix, options);
      if (error) throw error;
      const mapped: MediaItem[] = (data || []).map((i: any) => {
        const path = prefix ? `${prefix}/${i.name}` : i.name;
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
        const size = i?.metadata?.size ?? null;
        return {
          id: i.id || path,
          name: i.name,
          path,
          url: urlData.publicUrl,
          updated_at: i.updated_at || null,
          created_at: i.created_at || null,
          size,
        };
      });
      setItems(mapped);
      setSelected(new Set());
      setTotal(from + mapped.length + (mapped.length === pageSize ? pageSize : 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsage() {
    try {
      let sum = 0;
      for (const f of FOLDERS) {
        const p = f === "all" ? "" : f;
        const { data } = await supabase.storage.from("media").list(p, { limit: 1000 });
        for (const it of data || []) sum += (it as any)?.metadata?.size ?? 0;
      }
      setUsageBytes(sum);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, search, sortCol, sortOrder, page]);

  useEffect(() => {
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onUploaded(url: string, path: string) {
    const inFolder = !prefix || path.startsWith(`${prefix}/`) || path === prefix;
    if (inFolder) {
      setPage(1);
      load();
    }
  }

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected(new Set(items.map((i) => i.path)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} file(s)? This cannot be undone.`)) return;
    await supabase.storage.from("media").remove(Array.from(selected));
    await load();
    await loadUsage();
  }

  async function bulkCopyUrls() {
    if (!selected.size) return;
    const urlMap = new Map(items.map((i) => [i.path, i.url] as const));
    const list = Array.from(selected).map((p) => urlMap.get(p)).filter(Boolean).join("\n");
    await navigator.clipboard.writeText(list as string);
    setCopiedId("__bulk__");
    setTimeout(() => setCopiedId(null), 1200);
  }

  async function handleDelete(path: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    await supabase.storage.from("media").remove([path]);
    await load();
    await loadUsage();
  }

  async function handleReplace(path: string, file: File) {
    await supabase.storage.from("media").upload(path, file, { upsert: true });
    await load();
  }

  async function copySingle(path: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(path);
    setTimeout(() => setCopiedId(null), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded border p-2" value={folder} onChange={(e) => { setFolder(e.target.value as Folder); setPage(1); }}>
            {FOLDERS.map((f) => (
              <option key={f} value={f}>{f === "all" ? "All folders" : f}</option>
            ))}
          </select>
          <input className="w-56 rounded border p-2" placeholder="Search name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="rounded border p-2" value={sortCol} onChange={(e) => setSortCol(e.target.value as SortCol)}>
            <option value="updated_at">Updated</option>
            <option value="name">Name</option>
          </select>
          <select className="rounded border p-2" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <div className="ml-2 inline-flex gap-2">
            <button className={cn(buttonVariants({ variant: view === "grid" ? "primary" : "ghost", shape: "rounded", size: "small" }))} onClick={() => setView("grid")}>Grid</button>
            <button className={cn(buttonVariants({ variant: view === "list" ? "primary" : "ghost", shape: "rounded", size: "small" }))} onClick={() => setView("list")}>List</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Upload to:</label>
          <select className="rounded border p-2" value={folder} onChange={(e) => setFolder(e.target.value as Folder)}>
            {FOLDERS.filter((f) => f !== "all").map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="w-72">
            <ImageUploader folder={folder === "all" ? "uploads" : folder} onUploaded={onUploaded} />
          </div>
        </div>
      </div>

      {!!selected.size && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selected.size} selected</span>
            {copiedId === "__bulk__" && <span className="text-green-600">Copied</span>}
          </div>
          <div className="flex items-center gap-2">
            <button className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "tiny" }))} onClick={selectAllOnPage}>Select all</button>
            <button className={cn(buttonVariants({ variant: "ghost", shape: "rounded", size: "tiny" }))} onClick={clearSelection}>Clear</button>
            <button className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "tiny" }))} onClick={bulkCopyUrls}>Copy URLs</button>
            <button className={cn(buttonVariants({ variant: "outlineDanger", shape: "rounded", size: "tiny" }))} onClick={bulkDelete}>Delete selected</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-dark-6">
        <div>{loading ? "Loading..." : `${items.length} items${search ? " (filtered)" : ""}`}</div>
        <div>{usageBytes != null ? `Approx. usage: ${(usageBytes / (1024 * 1024)).toFixed(1)} MB` : ""}</div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {items.map((f) => (
            <div key={f.id} className="relative rounded border p-2 dark:border-dark-3">
              <input
                type="checkbox"
                className="absolute left-2 top-2 h-4 w-4"
                checked={selected.has(f.path)}
                onChange={() => toggleSelect(f.path)}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.name} className="h-32 w-full cursor-zoom-in rounded object-cover" onClick={() => setPreviewUrl(f.url)} />
              <div className="mt-2 truncate text-xs" title={f.name}>{f.name}</div>
              <div className="mt-1 text-[11px] text-dark-6">
                {(f.size ? `${(f.size / 1024).toFixed(0)} KB` : "")}{f.updated_at ? ` · ${new Date(f.updated_at).toLocaleDateString()}` : ""}
              </div>
              <div className="mt-2 grid min-h-[36px] grid-cols-3 gap-2">
                <button title="Copy URL" className={cn(buttonVariants({ variant: "ghost", shape: "rounded", size: "tiny" }), "whitespace-nowrap") } onClick={() => copySingle(f.path, f.url)}>
                  {copiedId === f.path ? "Copied" : "Copy"}
                </button>
                <label className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "tiny" }), "text-center whitespace-nowrap") }>
                  Replace
                  <input type="file" className="hidden" onChange={(e) => e.target.files && handleReplace(f.path, e.target.files[0])} accept="image/*" />
                </label>
                <button title="Delete file" className={cn(buttonVariants({ variant: "outlineDanger", shape: "rounded", size: "tiny" }), "whitespace-nowrap")} onClick={() => handleDelete(f.path)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-gray-200 dark:border-dark-3">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-3">
            <thead className="bg-gray-50 dark:bg-dark-3">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Select</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Preview</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Size</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Updated</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-3">
              {items.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2">
                    <input type="checkbox" className="h-4 w-4" checked={selected.has(f.path)} onChange={() => toggleSelect(f.path)} />
                  </td>
                  <td className="px-4 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.name} className="h-12 w-12 cursor-zoom-in rounded object-cover" onClick={() => setPreviewUrl(f.url)} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="truncate" title={f.name}>{f.name}</div>
                  </td>
                  <td className="px-4 py-2 text-sm">{f.size ? `${(f.size / 1024).toFixed(0)} KB` : ""}</td>
                  <td className="px-4 py-2 text-sm">{f.updated_at ? new Date(f.updated_at).toLocaleString() : ""}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-grid grid-flow-col auto-cols-max gap-2">
                      <button title="Copy URL" className={cn(buttonVariants({ variant: "ghost", shape: "rounded", size: "tiny" }), "whitespace-nowrap")} onClick={() => copySingle(f.path, f.url)}>
                        {copiedId === f.path ? "Copied" : "Copy"}
                      </button>
                      <label className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "tiny" }), "whitespace-nowrap")}>
                        Replace
                        <input type="file" className="hidden" onChange={(e) => e.target.files && handleReplace(f.path, e.target.files[0])} accept="image/*" />
                      </label>
                      <button title="Delete file" className={cn(buttonVariants({ variant: "outlineDanger", shape: "rounded", size: "tiny" }), "whitespace-nowrap")} onClick={() => handleDelete(f.path)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "small" }))} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
          Prev
        </button>
        <div className="text-sm">Page {page}</div>
        <button className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "small" }))} onClick={() => setPage((p) => p + 1)} disabled={items.length < pageSize || loading}>
          Next
        </button>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white p-2 dark:bg-dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" className="mx-auto max-h-[80vh] w-auto rounded" />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button className={cn(buttonVariants({ variant: "ghost", shape: "rounded", size: "tiny" }))} onClick={() => { navigator.clipboard.writeText(previewUrl); setCopiedId("__modal__"); setTimeout(() => setCopiedId(null), 1200); }}>
                {copiedId === "__modal__" ? "Copied" : "Copy URL"}
              </button>
              <button className={cn(buttonVariants({ variant: "outlinePrimary", shape: "rounded", size: "tiny" }))} onClick={() => setPreviewUrl(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
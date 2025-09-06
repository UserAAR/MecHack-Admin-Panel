"use client";

import { useState, useMemo, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/media/ImageUploader";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type NewsDraft = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  slug: string;
  image_url: string | null;
};

function toLocalInputValue(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function NewsFormClient({
  initialEn,
  initialAz,
  mode,
  id,
}: {
  initialEn?: Partial<NewsDraft> & { published_at?: string | null; created_at?: string | null };
  initialAz?: Partial<NewsDraft> & { published_at?: string | null; created_at?: string | null };
  mode: "new" | "edit";
  id?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [activeTab, setActiveTab] = useState<"en" | "az">("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [en, setEn] = useState<NewsDraft>({
    title: initialEn?.title || "",
    excerpt: initialEn?.excerpt || "",
    content: initialEn?.content || "",
    category: initialEn?.category || "",
    slug: initialEn?.slug || "",
    image_url: initialEn?.image_url || null,
  });

  const [az, setAz] = useState<NewsDraft>({
    title: initialAz?.title || "",
    excerpt: initialAz?.excerpt || "",
    content: initialAz?.content || "",
    category: initialAz?.category || en.category || "",
    slug: initialAz?.slug || initialEn?.slug || "",
    image_url: initialAz?.image_url || en.image_url || null,
  });

  const [createdAt, setCreatedAt] = useState<string>(toLocalInputValue(initialEn?.created_at || null));

  useEffect(() => {
    if (!en.slug && en.title) {
      setEn((s) => ({ ...s, slug: slugify(en.title) }));
    }
    if (!az.slug && az.title) {
      setAz((s) => ({ ...s, slug: slugify(az.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  async function upsertAzWithSlug(userId: string | null, published_at: string | null, created_at_iso: string) {
    const exists = await supabase
      .from("news_az")
      .select("id")
      .eq("slug", az.slug || en.slug)
      .maybeSingle();
    if (exists.data?.id) {
      return supabase
        .from("news_az")
        .update({
          title: az.title || en.title,
          excerpt: az.excerpt || null,
          content: az.content || null,
          category: az.category || en.category || null,
          slug: az.slug || en.slug || null,
          image_url: az.image_url || en.image_url,
          published_at,
          created_at: created_at_iso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exists.data.id);
    } else {
      return supabase.from("news_az").insert({
        title: az.title || en.title,
        excerpt: az.excerpt || null,
        content: az.content || null,
        category: az.category || en.category || null,
        slug: az.slug || en.slug || null,
        image_url: az.image_url || en.image_url,
        published_at,
        created_by: userId,
        created_at: created_at_iso,
        updated_at: new Date().toISOString(),
      });
    }
  }

  async function audit(action: string, extra?: Record<string, any>) {
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          entity_type: "news",
          entity_id: id || en.slug || az.slug || undefined,
          metadata: {
            mode,
            published: !!(extra?.published ?? false),
            slug: en.slug || az.slug || null,
            title: en.title || az.title || null,
            ...extra,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        // eslint-disable-next-line no-console
        console.error("Audit failed:", j?.error || res.status);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Audit error:", e);
    }
  }

  async function handleSave(publish: boolean) {
    setSaving(true);
    setError(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;
      const published_at = publish ? new Date().toISOString() : null;
      const created_at_iso = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();

      if (mode === "new") {
        const { error: e1 } = await supabase.from("news").insert({
          title: en.title,
          excerpt: en.excerpt || null,
          content: en.content || null,
          category: en.category || null,
          slug: en.slug || null,
          image_url: en.image_url,
          published_at,
          created_by: userId,
          created_at: created_at_iso,
          updated_at: new Date().toISOString(),
        });
        if (e1) throw e1;
        const { error: e2 } = await upsertAzWithSlug(userId, published_at, created_at_iso);
        if (e2) throw e2;
        await audit(publish ? "news_created_published" : "news_created_draft", { published: !!published_at });
      } else if (mode === "edit" && id) {
        const wasPublished = !!initialEn?.published_at;
        const willBePublished = !!published_at;
        const { error: e1 } = await supabase
          .from("news")
          .update({
            title: en.title,
            excerpt: en.excerpt || null,
            content: en.content || null,
            category: en.category || null,
            slug: en.slug || null,
            image_url: en.image_url,
            published_at,
            created_at: created_at_iso,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (e1) throw e1;
        const { error: e2 } = await upsertAzWithSlug(userId, published_at, created_at_iso);
        if (e2) throw e2;
        if (!wasPublished && willBePublished) await audit("news_published", { published: true });
        else if (wasPublished && !willBePublished) await audit("news_unpublished", { published: false });
        else await audit("news_updated", { published: willBePublished });
      }
      router.replace("/content/news");
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setSaving(true);
    try {
      await supabase.from("news").delete().eq("id", id);
      if (en.slug) await supabase.from("news_az").delete().eq("slug", en.slug);
      await audit("news_deleted", { slug: en.slug || null });
      router.replace("/content/news");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{mode === "new" ? "New Article" : "Edit Article"}</h1>
        <div className="flex gap-2">
          {mode === "edit" && (
            <button
              className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}
              onClick={handleDelete}
              disabled={saving}
            >
              Delete
            </button>
          )}
          <button
            className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            Save as Draft
          </button>
          <button
            className={cn(buttonVariants({ variant: "primary", shape: "rounded", size: "small" }))}
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            Publish
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded border p-4 dark:border-dark-3">
            <div className="mb-4 flex gap-2">
              <button
                className={`rounded px-3 py-1 text-sm ${activeTab === "en" ? "bg-primary text-white" : "border"}`}
                onClick={() => setActiveTab("en")}
              >
                EN
              </button>
              <button
                className={`rounded px-3 py-1 text-sm ${activeTab === "az" ? "bg-primary text-white" : "border"}`}
                onClick={() => setActiveTab("az")}
              >
                AZ
              </button>
            </div>

            {activeTab === "en" ? (
              <LangForm data={en} onChange={setEn} />
            ) : (
              <LangForm data={az} onChange={setAz} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border p-4 dark:border-dark-3">
            <h2 className="mb-2 font-medium">Featured Image</h2>
            <ImageUploader
              folder="news"
              initialUrl={activeTab === "en" ? en.image_url : az.image_url}
              onUploaded={(url) => {
                setEn((s) => ({ ...s, image_url: url }));
                setAz((s) => ({ ...s, image_url: url }));
              }}
            />
          </div>

          <div className="rounded border p-4 dark:border-dark-3">
            <h2 className="mb-2 font-medium">Metadata</h2>
            <label className="mb-1 block text-sm">Created at</label>
            <input
              type="datetime-local"
              className="w-full rounded border p-2"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LangForm({ data, onChange }: { data: NewsDraft; onChange: (d: NewsDraft) => void }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm">Title</label>
      <input className="w-full rounded border p-2" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      <label className="block text-sm">Excerpt</label>
      <textarea className="w-full rounded border p-2" value={data.excerpt} onChange={(e) => onChange({ ...data, excerpt: e.target.value })} />
      <label className="block text-sm">Content</label>
      <textarea className="min-h-40 w-full rounded border p-2" value={data.content} onChange={(e) => onChange({ ...data, content: e.target.value })} />
      <label className="block text-sm">Category</label>
      <input className="w-full rounded border p-2" value={data.category} onChange={(e) => onChange({ ...data, category: e.target.value })} />
      <label className="block text-sm">Slug</label>
      <input className="w-full rounded border p-2" value={data.slug} onChange={(e) => onChange({ ...data, slug: e.target.value })} />
    </div>
  );
} 
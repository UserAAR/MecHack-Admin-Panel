"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/media/ImageUploader";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type ProjectDraft = {
  title: string;
  summary: string;
  content: string;
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

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function ProjectFormClient({
  initialEn,
  initialAz,
  mode,
  id,
}: {
  initialEn?: Partial<ProjectDraft> & { published_at?: string | null; created_at?: string | null };
  initialAz?: Partial<ProjectDraft> & { published_at?: string | null; created_at?: string | null };
  mode: "new" | "edit";
  id?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [activeTab, setActiveTab] = useState<"en" | "az">("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [en, setEn] = useState<ProjectDraft>({
    title: initialEn?.title || "",
    summary: initialEn?.summary || "",
    content: initialEn?.content || "",
    slug: initialEn?.slug || "",
    image_url: initialEn?.image_url || null,
  });

  const [az, setAz] = useState<ProjectDraft>({
    title: initialAz?.title || "",
    summary: initialAz?.summary || "",
    content: initialAz?.content || "",
    slug: initialAz?.slug || initialEn?.slug || "",
    image_url: initialAz?.image_url || en.image_url || null,
  });

  const [createdAt, setCreatedAt] = useState<string>(toLocalInputValue(initialEn?.created_at || null));

  useEffect(() => {
    if (!en.slug && en.title) setEn((s) => ({ ...s, slug: slugify(en.title) }));
    if (!az.slug && az.title) setAz((s) => ({ ...s, slug: slugify(az.title) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upsertAzWithSlug(userId: string | null, published_at: string | null, created_at_iso: string) {
    const exists = await supabase
      .from("projects_az")
      .select("id")
      .eq("slug", az.slug || en.slug)
      .maybeSingle();
    if (exists.data?.id) {
      return supabase
        .from("projects_az")
        .update({
          title: az.title || en.title,
          summary: az.summary || null,
          content: az.content || null,
          slug: az.slug || en.slug || null,
          image_url: az.image_url || en.image_url,
          published_at,
          created_at: created_at_iso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exists.data.id);
    } else {
      return supabase.from("projects_az").insert({
        title: az.title || en.title,
        summary: az.summary || null,
        content: az.content || null,
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
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          entity_type: "projects",
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
    } catch {}
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
        const { error: e1 } = await supabase.from("projects").insert({
          title: en.title,
          summary: en.summary || null,
          content: en.content || null,
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
        await audit(publish ? "project_created_published" : "project_created_draft", { published: !!published_at });
      } else if (mode === "edit" && id) {
        const wasPublished = !!initialEn?.published_at;
        const willBePublished = !!published_at;
        const { error: e1 } = await supabase
          .from("projects")
          .update({
            title: en.title,
            summary: en.summary || null,
            content: en.content || null,
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
        if (!wasPublished && willBePublished) await audit("project_published", { published: true });
        else if (wasPublished && !willBePublished) await audit("project_unpublished", { published: false });
        else await audit("project_updated", { published: willBePublished });
      }
      router.replace("/content/projects");
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setSaving(true);
    try {
      await supabase.from("projects").delete().eq("id", id);
      if (en.slug) await supabase.from("projects_az").delete().eq("slug", en.slug);
      await audit("project_deleted", { slug: en.slug || null });
      router.replace("/content/projects");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{mode === "new" ? "New Project" : "Edit Project"}</h1>
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
              folder="projects"
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

function LangForm({ data, onChange }: { data: ProjectDraft; onChange: (d: ProjectDraft) => void }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm">Title</label>
      <input className="w-full rounded border p-2" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      <label className="block text-sm">Summary</label>
      <textarea className="w-full rounded border p-2" value={data.summary} onChange={(e) => onChange({ ...data, summary: e.target.value })} />
      <label className="block text-sm">Content</label>
      <textarea className="min-h-40 w-full rounded border p-2" value={data.content} onChange={(e) => onChange({ ...data, content: e.target.value })} />
      <label className="block text-sm">Slug</label>
      <input className="w-full rounded border p-2" value={data.slug} onChange={(e) => onChange({ ...data, slug: e.target.value })} />
    </div>
  );
} 
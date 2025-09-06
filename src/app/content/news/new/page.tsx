"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/media/ImageUploader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-elements/button";

export default function NewsNewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"en" | "az">("en");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [en, setEn] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    slug: "",
  });

  const [az, setAz] = useState({
    title: "",
    excerpt: "",
    content: "",
    slug: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;

      const published_at = publish ? new Date().toISOString() : null;

      const { error: e1 } = await supabase.from("news").insert({
        title: en.title,
        excerpt: en.excerpt || null,
        content: en.content || null,
        category: en.category || null,
        slug: en.slug || null,
        image_url: imageUrl,
        published_at,
        created_by: userId,
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase.from("news_az").insert({
        title: az.title || en.title,
        excerpt: az.excerpt || null,
        content: az.content || null,
        category: en.category || null,
        slug: az.slug || en.slug || null,
        image_url: imageUrl,
        published_at,
        created_by: userId,
      });
      if (e2) throw e2;

      router.replace("/content/news");
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New Article</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
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
              <div className="space-y-3">
                <label className="block text-sm">Title</label>
                <input className="w-full rounded border p-2" value={en.title} onChange={(e) => setEn({ ...en, title: e.target.value })} />
                <label className="block text-sm">Excerpt</label>
                <textarea className="w-full rounded border p-2" value={en.excerpt} onChange={(e) => setEn({ ...en, excerpt: e.target.value })} />
                <label className="block text-sm">Content</label>
                <textarea className="min-h-40 w-full rounded border p-2" value={en.content} onChange={(e) => setEn({ ...en, content: e.target.value })} />
                <label className="block text-sm">Category</label>
                <input className="w-full rounded border p-2" value={en.category} onChange={(e) => setEn({ ...en, category: e.target.value })} />
                <label className="block text-sm">Slug</label>
                <input className="w-full rounded border p-2" value={en.slug} onChange={(e) => setEn({ ...en, slug: e.target.value })} />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm">Title (AZ)</label>
                <input className="w-full rounded border p-2" value={az.title} onChange={(e) => setAz({ ...az, title: e.target.value })} />
                <label className="block text-sm">Excerpt (AZ)</label>
                <textarea className="w-full rounded border p-2" value={az.excerpt} onChange={(e) => setAz({ ...az, excerpt: e.target.value })} />
                <label className="block text-sm">Content (AZ)</label>
                <textarea className="min-h-40 w-full rounded border p-2" value={az.content} onChange={(e) => setAz({ ...az, content: e.target.value })} />
                <label className="block text-sm">Slug (AZ)</label>
                <input className="w-full rounded border p-2" value={az.slug} onChange={(e) => setAz({ ...az, slug: e.target.value })} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border p-4 dark:border-dark-3">
            <h2 className="mb-2 font-medium">Featured Image</h2>
            <ImageUploader
              folder="news"
              initialUrl={imageUrl}
              onUploaded={(url) => setImageUrl(url)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button
              label="Save as Draft"
              variant="outlineDark"
              shape="rounded"
              size="small"
              onClick={() => handleSave(false)}
              disabled={saving}
            />
            <Button
              label="Publish"
              variant="primary"
              shape="rounded"
              size="small"
              onClick={() => handleSave(true)}
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/media/ImageUploader";
import { useRouter } from "next/navigation";

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<{ name: string; id: string; path: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const guard = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        router.replace("/auth/sign-in");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.user.id).single();
      const role = profile?.role as "user" | "admin" | "superadmin" | undefined;
      if (role !== "admin" && role !== "superadmin") {
        router.replace("/");
        return;
      }
      loadFiles();
    };
    guard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from("media").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      console.error(error);
    } else {
      const items = (data || []).map((i) => {
        const path = i.name;
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        return { name: i.name, id: (i as any).id || i.name, path, url: data.publicUrl } as any;
      });
      setFiles(items);
    }
    setLoading(false);
  };

  const handleDelete = async (path: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.storage.from("media").remove([path]);
    await loadFiles();
  };

  const handleReplace = async (path: string, file: File) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.storage.from("media").upload(path, file, { upsert: true });
    await loadFiles();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Media Library</h1>
        <div className="w-80">
          <ImageUploader folder="uploads" onUploaded={() => loadFiles()} />
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {files.map((f) => (
            <div key={f.id} className="rounded border p-2 dark:border-dark-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.name} className="h-32 w-full rounded object-cover" />
              <div className="mt-2 truncate text-xs">{f.name}</div>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => navigator.clipboard.writeText(f.url)}
                >
                  Copy URL
                </button>
                <label className="rounded border px-2 py-1 text-xs">
                  Replace
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files && handleReplace(f.path, e.target.files[0])}
                    accept="image/*"
                  />
                </label>
                <button className="rounded border px-2 py-1 text-xs" onClick={() => handleDelete(f.path)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
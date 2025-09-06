"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ImageUploader({
  onUploaded,
  folder,
  initialUrl,
}: {
  onUploaded: (url: string, path: string) => void;
  folder: string; // e.g., "news" | "projects" | "events"
  initialUrl?: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop() || "png";
      const random = Math.random().toString(36).slice(2, 8);
      const timestamp = Date.now();
      const path = `${folder}/${timestamp}-${random}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setUrl(data.publicUrl);
      onUploaded(data.publicUrl, path);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [folder, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "image/*": [] },
  });

  return (
    <div className="space-y-2">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Uploaded" className="h-32 w-32 rounded object-cover" />
      )}
      <div
        {...getRootProps()}
        className="flex h-32 cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 text-sm text-gray-600 hover:bg-gray-50 dark:border-dark-3 dark:text-dark-6"
      >
        <input {...getInputProps()} />
        {uploading ? "Uploading..." : isDragActive ? "Drop the image here" : "Drag & drop or click to upload"}
      </div>
    </div>
  );
} 
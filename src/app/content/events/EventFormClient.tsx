"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ImageUploader } from "@/components/media/ImageUploader";
import { buttonVariants } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type EventDraft = {
  title: string;
  description: string;
  location: string;
  event_date: string | null;
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

export default function EventFormClient({
  initialEn,
  initialAz,
  mode,
  id,
}: {
  initialEn?: Partial<EventDraft> & { published_at?: string | null; created_at?: string | null };
  initialAz?: Partial<EventDraft> & { published_at?: string | null; created_at?: string | null };
  mode: "new" | "edit";
  id?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [activeTab, setActiveTab] = useState<"en" | "az">("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [en, setEn] = useState<EventDraft>({
    title: initialEn?.title || "",
    description: initialEn?.description || "",
    location: initialEn?.location || "",
    event_date: initialEn?.event_date || null,
    image_url: initialEn?.image_url || null,
  });

  const [az, setAz] = useState<EventDraft>({
    title: initialAz?.title || "",
    description: initialAz?.description || "",
    location: initialAz?.location || en.location || "",
    event_date: initialAz?.event_date || en.event_date || null,
    image_url: initialAz?.image_url || en.image_url || null,
  });

  const [createdAt, setCreatedAt] = useState<string>(toLocalInputValue(initialEn?.created_at || null));
  const [eventDate, setEventDate] = useState<string>(toLocalInputValue(initialEn?.event_date || null));

  useEffect(() => {
    // keep event date across langs
    setAz((s) => ({ ...s, event_date: en.event_date }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [en.event_date]);

  async function upsertAz(userId: string | null, published_at: string | null, created_at_iso: string, event_date_iso: string | null) {
    const exists = await supabase
      .from("events_az")
      .select("id")
      .eq("title", az.title || en.title)
      .eq("event_date", event_date_iso)
      .maybeSingle();
    if (exists.data?.id) {
      return supabase
        .from("events_az")
        .update({
          title: az.title || en.title,
          description: az.description || null,
          location: az.location || en.location || null,
          event_date: event_date_iso,
          image_url: az.image_url || en.image_url,
          published_at,
          created_at: created_at_iso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exists.data.id);
    } else {
      return supabase.from("events_az").insert({
        title: az.title || en.title,
        description: az.description || null,
        location: az.location || en.location || null,
        event_date: event_date_iso,
        image_url: az.image_url || en.image_url,
        published_at,
        created_by: userId,
        created_at: created_at_iso,
        updated_at: new Date().toISOString(),
      });
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
      const event_date_iso = eventDate ? new Date(eventDate).toISOString() : null;

      if (mode === "new") {
        const { error: e1 } = await supabase.from("events").insert({
          title: en.title,
          description: en.description || null,
          location: en.location || null,
          event_date: event_date_iso,
          image_url: en.image_url,
          published_at,
          created_by: userId,
          created_at: created_at_iso,
          updated_at: new Date().toISOString(),
        });
        if (e1) throw e1;
        const { error: e2 } = await upsertAz(userId, published_at, created_at_iso, event_date_iso);
        if (e2) throw e2;
      } else if (mode === "edit" && id) {
        const { error: e1 } = await supabase
          .from("events")
          .update({
            title: en.title,
            description: en.description || null,
            location: en.location || null,
            event_date: event_date_iso,
            image_url: en.image_url,
            published_at,
            created_at: created_at_iso,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (e1) throw e1;
        const { error: e2 } = await upsertAz(userId, published_at, created_at_iso, event_date_iso);
        if (e2) throw e2;
      }
      router.replace("/content/events");
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setSaving(true);
    try {
      await supabase.from("events").delete().eq("id", id);
      // try delete az by matching title and date
      if (en.title && eventDate) await supabase.from("events_az").delete().eq("title", en.title).eq("event_date", new Date(eventDate).toISOString());
      router.replace("/content/events");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{mode === "new" ? "New Event" : "Edit Event"}</h1>
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
              <LangForm data={en} onChange={setEn} showDate valueDate={eventDate} onChangeDate={setEventDate} />
            ) : (
              <LangForm data={az} onChange={setAz} showDate={false} valueDate={eventDate} onChangeDate={setEventDate} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border p-4 dark:border-dark-3">
            <h2 className="mb-2 font-medium">Featured Image</h2>
            <ImageUploader
              folder="events"
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

function LangForm({ data, onChange, showDate, valueDate, onChangeDate }: { data: EventDraft; onChange: (d: EventDraft) => void; showDate?: boolean; valueDate: string; onChangeDate: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm">Title</label>
      <input className="w-full rounded border p-2" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      <label className="block text-sm">Description</label>
      <textarea className="w-full rounded border p-2" value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <label className="block text-sm">Location</label>
      <input className="w-full rounded border p-2" value={data.location} onChange={(e) => onChange({ ...data, location: e.target.value })} />
      {showDate && (
        <>
          <label className="block text-sm">Event date</label>
          <input type="datetime-local" className="w-full rounded border p-2" value={valueDate} onChange={(e) => onChangeDate(e.target.value)} />
        </>
      )}
    </div>
  );
} 
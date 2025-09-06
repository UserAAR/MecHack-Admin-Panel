import { getSupabaseServerClient } from "@/lib/supabase/server";
import EventFormClient from "../../EventFormClient";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: en } = await supabase
    .from("events")
    .select("id,title,description,location,event_date,image_url,published_at,created_at")
    .eq("id", id)
    .single();

  let az: any = null;
  if (en?.title && en?.event_date) {
    const azRes = await supabase
      .from("events_az")
      .select("title,description,location,event_date,image_url,published_at,created_at")
      .eq("title", en.title)
      .eq("event_date", en.event_date)
      .maybeSingle();
    az = azRes.data || null;
  }

  return (
    <EventFormClient
      mode="edit"
      id={id}
      initialEn={en || undefined}
      initialAz={az || undefined}
    />
  );
} 
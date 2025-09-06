import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/profile";
import EventsListClient, { EventRow } from "./EventsListClient";

export const dynamic = "force-dynamic";

export default async function EventsListPage() {
  const { role } = await getCurrentUserWithRole();
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("id,title,location,event_date,published_at,created_at,updated_at,image_url")
    .order("created_at", { ascending: false });

  if (!role) redirect("/auth/sign-in");
  if (role !== "admin" && role !== "superadmin") redirect("/");

  return <EventsListClient initial={(data as EventRow[]) || []} role={role} />;
} 
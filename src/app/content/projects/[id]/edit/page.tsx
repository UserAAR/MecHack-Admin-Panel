import { getSupabaseServerClient } from "@/lib/supabase/server";
import ProjectFormClient from "../../ProjectFormClient";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: en } = await supabase
    .from("projects")
    .select("id,title,summary,content,slug,image_url,published_at,created_at")
    .eq("id", id)
    .single();

  let az: any = null;
  if (en?.slug) {
    const azRes = await supabase
      .from("projects_az")
      .select("title,summary,content,slug,image_url,published_at,created_at")
      .eq("slug", en.slug)
      .maybeSingle();
    az = azRes.data || null;
  }

  return (
    <ProjectFormClient
      mode="edit"
      id={id}
      initialEn={en || undefined}
      initialAz={az || undefined}
    />
  );
} 
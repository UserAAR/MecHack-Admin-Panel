import { getSupabaseServerClient } from "@/lib/supabase/server";
import NewsFormClient from "../../NewsFormClient";

export const dynamic = "force-dynamic";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: en } = await supabase
    .from("news")
    .select("id,title,excerpt,content,category,slug,image_url,published_at,created_at")
    .eq("id", id)
    .single();

  let az: any = null;
  if (en?.slug) {
    const azRes = await supabase
      .from("news_az")
      .select("title,excerpt,content,category,slug,image_url,published_at,created_at")
      .eq("slug", en.slug)
      .maybeSingle();
    az = azRes.data || null;
  }

  return (
    <NewsFormClient
      mode="edit"
      id={id}
      initialEn={en || undefined}
      initialAz={az || undefined}
    />
  );
} 
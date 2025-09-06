import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewsListClient, { NewsRow } from "./NewsListClient";
import { getCurrentUserWithRole } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function NewsListPage() {
  const { role } = await getCurrentUserWithRole();
  const supabase = await getSupabaseServerClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, published_at, created_at, updated_at, image_url")
    .order("created_at", { ascending: false });

  if (!role) redirect("/auth/sign-in");
  if (role !== "admin" && role !== "superadmin") redirect("/");

  return <NewsListClient initial={(news as NewsRow[]) || []} role={role} />;
} 
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/profile";
import ProjectsListClient, { ProjectRow } from "./ProjectsListClient";

export const dynamic = "force-dynamic";

export default async function ProjectsListPage() {
  const { role } = await getCurrentUserWithRole();
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("id,title,slug,published_at,created_at,updated_at,image_url")
    .order("created_at", { ascending: false });

  if (!role) redirect("/auth/sign-in");
  if (role !== "admin" && role !== "superadmin") redirect("/");

  return <ProjectsListClient initial={(data as ProjectRow[]) || []} role={role} />;
} 
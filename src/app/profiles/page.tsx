import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";
import ProfilesClient, { ProfileRow } from "./ProfilesClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const { role } = await getCurrentUserWithRole();
  if (!role) redirect("/auth/sign-in");
  if (role !== "admin" && role !== "superadmin") redirect("/");

  const supabase = await getSupabaseServerClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email,role,created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Profiles</h1>
      <ProfilesClient initial={(profiles as ProfileRow[]) || []} currentRole={role} />
    </div>
  );
} 
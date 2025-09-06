import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";
import UsersClient from "../users/users-client";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const { role } = await getCurrentUserWithRole();
  const supabase = await getSupabaseServerClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Profiles</h1>
      <UsersClient profiles={profiles || []} currentRole={role} />
    </div>
  );
} 
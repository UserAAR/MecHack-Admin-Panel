import { getSupabaseServerClient } from "./supabase/server";
import type { ProfileRole } from "@/types/roles";

export async function getCurrentUserWithRole() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as null | ProfileRole };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  return { user, role: (profile?.role as ProfileRole) || null };
} 
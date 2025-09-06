import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";

export async function POST() {
  const { user } = await getCurrentUserWithRole();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "others" as any });

  try {
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email,
      action: "signout_others",
      entity_type: "auth",
    } as any);
  } catch {}

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
} 
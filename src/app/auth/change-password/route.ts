import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";

export async function POST(request: Request) {
  const { user, role } = await getCurrentUserWithRole();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (role !== "superadmin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const current = (form.get("current") as string) || "";
  const next = (form.get("next") as string) || "";
  const confirm = (form.get("confirm") as string) || "";

  if (!next || next !== confirm) {
    return NextResponse.json({ ok: false, error: "Passwords do not match" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();

  // Re-authenticate (optional): try sign-in with current password to verify
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email!, password: current });
  if (reauthError) return NextResponse.json({ ok: false, error: "Current password is incorrect" }, { status: 400 });

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  try {
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email,
      action: "password_changed",
      entity_type: "auth",
    } as any);
  } catch {}

  return NextResponse.json({ ok: true });
} 
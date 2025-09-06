import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { role } = await getCurrentUserWithRole();
  if (role !== "superadmin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const userId = (form.get("userId") as string) || "";
  const newPassword = (form.get("newPassword") as string) || "";
  if (!userId || !newPassword) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });

  const supabase = await getSupabaseServerClient();

  // Update user password via admin API is not available with anon key; instead, use auth.admin if you have service role.
  // Here, we fallback to sending a password reset email or reject if service key is not present.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ ok: false, error: "Service role key not configured" }, { status: 500 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to reset password" }, { status: 500 });
  }

  try {
    await supabase.from("audit_logs").insert({
      action: "admin_password_reset",
      entity_type: "profile",
      entity_id: userId,
    } as any);
  } catch {}

  return NextResponse.json({ ok: true });
} 
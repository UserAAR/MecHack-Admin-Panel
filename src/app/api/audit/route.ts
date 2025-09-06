import { NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { user } = await getCurrentUserWithRole();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { action, entity_type, entity_id, metadata } = body || {};

  if (!action) return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });

  const supabase = await getSupabaseServerClient();

  // Capture minimal client info
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0] || null;
  const userAgent = request.headers.get("user-agent") || null;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action,
    entity_type: entity_type || null,
    entity_id: entity_id || null,
    metadata: metadata || null,
    ip,
    user_agent: userAgent,
  } as any);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const { role } = await getCurrentUserWithRole();
  if (role !== "superadmin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, actor_email, action, entity_type, entity_id, ip, user_agent, metadata")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, logs: data || [] });
} 
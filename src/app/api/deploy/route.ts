import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";

const COOLDOWN_SECONDS = 180;

// Fallback in-memory throttle (per runtime)
const globalAny = global as any;
if (!globalAny.__deploy_last_ts) globalAny.__deploy_last_ts = 0;

export async function POST() {
  const { user, role } = await getCurrentUserWithRole();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const supabase = await getSupabaseServerClient();

  // Check DB cooldown (deploy_triggers table)
  let lastTriggeredAt: number | null = null;
  try {
    const { data, error } = await supabase
      .from("deploy_triggers")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.created_at) {
      lastTriggeredAt = Math.floor(new Date(data.created_at).getTime() / 1000);
    }
  } catch {}

  const now = Math.floor(Date.now() / 1000);
  const lastInMemory = globalAny.__deploy_last_ts as number;
  const effectiveLast = Math.max(lastTriggeredAt ?? 0, lastInMemory ?? 0);

  const remaining = COOLDOWN_SECONDS - (now - effectiveLast);
  if (remaining > 0) {
    return NextResponse.json({ ok: false, error: "Cooldown", remaining }, { status: 429 });
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return NextResponse.json({ ok: false, error: "Missing VERCEL_DEPLOY_HOOK_URL" }, { status: 500 });
  }

  // Trigger deploy
  const res = await fetch(hookUrl, { method: "POST" });
  const ok = res.ok;
  const status = res.status;

  // Update cooldowns (best-effort)
  globalAny.__deploy_last_ts = Math.floor(Date.now() / 1000);
  try {
    await supabase.from("deploy_triggers").insert({
      triggered_by: user.id,
      triggered_by_email: user.email,
    });
  } catch {}

  // Log audit
  try {
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email,
      action: "deploy_triggered",
      entity_type: "system",
      metadata: { status },
    } as any);
  } catch {}

  if (!ok) {
    return NextResponse.json({ ok: false, status }, { status: 502 });
  }

  return NextResponse.json({ ok: true, status });
} 
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";
import DeployButton from "./_components/DeployButton";
import ChangePasswordModal from "./_components/ChangePasswordModal";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { role, user } = await getCurrentUserWithRole();
  const supabase = await getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user?.id || "")
    .single();

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark xl:col-span-2">
          <h2 className="mb-3 text-base font-semibold">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <input className="w-full rounded border p-2" value={profile?.email || ""} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm">Role</label>
              <input className="w-full rounded border p-2" value={profile?.role || role || ""} disabled />
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
          <h2 className="mb-3 text-base font-semibold">Avatar</h2>
          <p className="text-sm text-dark-6">Avatar management is handled in Profiles.</p>
        </div>
      </div>

      {/* Deploy card moved up here */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-[14px] border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-primary/30 dark:from-primary/20 xl:col-span-3">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/15 blur-2xl dark:bg-primary/25" />
          <h2 className="mb-2 text-base font-semibold">Trigger Deploy</h2>
          <p className="mb-3 text-sm text-dark-6">Redeploy the website to refresh static content. Cooldown: 3 minutes.</p>
          <DeployButton />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {role === "superadmin" ? (
          <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark xl:col-span-2">
            <h2 className="mb-3 text-base font-semibold">Change Password</h2>
            <ChangePasswordModal />
          </div>
        ) : null}

        <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
          <h2 className="mb-3 text-base font-semibold">Active Sessions</h2>
          <form action="/api/auth/signout-others" method="post">
            <p className="mb-3 text-sm text-dark-6">Sign out from other devices and browsers.</p>
            <button className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white" type="submit">
              Sign out other sessions
            </button>
          </form>
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-dark-6">Recent logins</h3>
            <MyLoginHistory />
          </div>
        </div>
      </div>

      {role === "superadmin" && (
        <div className="mt-6 rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
          <h2 className="mb-3 text-base font-semibold">Activity Logs</h2>
          <p className="text-sm text-dark-6">For a detailed view, go to the Activity Logs page from the sidebar.</p>
        </div>
      )}
    </div>
  );
}

async function MyLoginHistory() {
  "use server";
  const { user } = await getCurrentUserWithRole();
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, ip, user_agent")
    .eq("actor_id", user?.id || "")
    .in("action", ["login", "logout"])
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <ul className="space-y-1 text-xs text-dark-6">
      {(data || []).map((log) => (
        <li key={log.id} className="truncate">
          <span className="font-medium">{log.action}</span> • {new Date(log.created_at as any).toLocaleString()} • {log.ip || "-"}
        </li>
      ))}
      {!data?.length && <li>No history.</li>}
    </ul>
  );
} 
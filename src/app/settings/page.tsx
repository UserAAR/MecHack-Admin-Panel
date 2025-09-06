import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserWithRole } from "@/lib/profile";

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
    </div>
  );
} 
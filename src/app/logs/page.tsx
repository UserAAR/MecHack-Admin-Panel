import { getCurrentUserWithRole } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function prettyAction(action: string, metadata?: any) {
  switch (action) {
    case "deploy_triggered": {
      const status = metadata?.status;
      return status ? `Deploy triggered (status ${status})` : "Deploy triggered";
    }
    case "login":
      return "User signed in";
    case "logout":
      return "User signed out";
    case "password_changed":
      return "Password changed";
    case "signout_others":
      return "Other sessions signed out";
    case "news_created_published":
      return "News published (new)";
    case "news_created_draft":
      return "News drafted (new)";
    case "news_updated":
      return "News updated";
    case "news_published":
      return "News published";
    case "news_unpublished":
      return "News unpublished";
    case "news_deleted":
      return "News deleted";
    case "project_created_published":
      return "Project published (new)";
    case "project_created_draft":
      return "Project drafted (new)";
    case "project_updated":
      return "Project updated";
    case "project_published":
      return "Project published";
    case "project_unpublished":
      return "Project unpublished";
    case "project_deleted":
      return "Project deleted";
    case "event_created_published":
      return "Event published (new)";
    case "event_created_draft":
      return "Event drafted (new)";
    case "event_updated":
      return "Event updated";
    case "event_published":
      return "Event published";
    case "event_unpublished":
      return "Event unpublished";
    case "event_deleted":
      return "Event deleted";
    default:
      return action;
  }
}

export default async function LogsPage(props: any) {
  const { role } = await getCurrentUserWithRole();
  if (role !== "superadmin") return null;

  const supabase = await getSupabaseServerClient();

  const limit = 50;
  const sp = (await props?.searchParams) || {};
  const page = Number((sp.page as string) || "1");
  const action = (sp.action as string) || "";
  const actor = (sp.actor as string) || "";

  let query = supabase
    .from("audit_logs")
    .select("id, created_at, actor_email, action, entity_type, entity_id, ip, user_agent, metadata", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (action) query = query.ilike("action", `%${action}%`);
  if (actor) query = query.ilike("actor_email", `%${actor}%`);

  const { data, count } = await query;

  const totalPages = Math.max(1, Math.ceil((count || 0) / limit));

  return (
    <div className="w-full max-w-none px-4 xl:px-6">
      <h1 className="mb-4 text-xl font-semibold">Activity Logs</h1>

      <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm">Action</label>
          <input name="action" defaultValue={action} className="w-full rounded border p-2" placeholder="e.g. event_updated" />
        </div>
        <div>
          <label className="mb-1 block text-sm">Actor (email)</label>
          <input name="actor" defaultValue={actor} className="w-full rounded border p-2" placeholder="email@example.com" />
        </div>
        <div className="flex items-end">
          <button className="rounded-lg bg-primary px-6 py-[9px] font-medium text-gray-2 hover:bg-opacity-90" type="submit">Apply</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <table className="w-full table-auto text-left text-sm">
          <thead className="bg-gray-2 text-xs font-medium dark:bg-dark-2">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">IP</th>
              <th className="p-3">UA</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((log) => (
              <tr key={log.id} className="border-t border-stroke align-top dark:border-dark-3">
                <td className="p-3 whitespace-nowrap">{new Date(log.created_at as any).toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">{log.actor_email}</td>
                <td className="p-3">
                  <div className="font-medium">{prettyAction(log.action, log.metadata)}</div>
                </td>
                <td className="p-3">{log.entity_type || "-"} {log.entity_id || ""}</td>
                <td className="p-3 whitespace-nowrap">{log.ip || "-"}</td>
                <td className="p-3 text-xs break-all">{log.user_agent || "-"}</td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td className="p-5 text-center text-dark-6" colSpan={6}>No logs</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-dark-6">Page {page} / {totalPages}</div>
        <div className="flex gap-2">
          <a className="rounded border px-3 py-1 text-sm disabled:opacity-40" href={`?action=${encodeURIComponent(action)}&actor=${encodeURIComponent(actor)}&page=${Math.max(1, page - 1)}`}>Prev</a>
          <a className="rounded border px-3 py-1 text-sm disabled:opacity-40" href={`?action=${encodeURIComponent(action)}&actor=${encodeURIComponent(actor)}&page=${Math.min(totalPages, page + 1)}`}>Next</a>
        </div>
      </div>
    </div>
  );
} 
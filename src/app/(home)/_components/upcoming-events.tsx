import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function UpcomingEvents() {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const in7 = new Date();
  in7.setDate(now.getDate() + 7);

  const { data } = await supabase
    .from("events")
    .select("id,title,event_date,location")
    .gte("event_date", now.toISOString())
    .lte("event_date", in7.toISOString())
    .order("event_date", { ascending: true })
    .limit(6);

  return (
    <div className="flex h-full flex-col rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
      <h3 className="mb-3 text-base font-semibold">Upcoming (7 days)</h3>
      <ul className="space-y-2">
        {(data || []).length === 0 && (
          <li className="rounded bg-gray-2 p-3 text-sm text-dark-6 dark:bg-dark-3">
            No upcoming events
          </li>
        )}
        {(data || []).map((e) => (
          <li key={e.id} className="rounded bg-gray-2 p-3 text-sm dark:bg-dark-3">
            <div className="truncate font-medium">{e.title}</div>
            <div className="mt-0.5 text-xs text-dark-6">
              {e.event_date ? new Date(e.event_date).toLocaleString() : ""}
              {e.location ? ` · ${e.location}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 
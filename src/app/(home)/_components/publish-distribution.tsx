import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getCounts(table: string) {
  const supabase = await getSupabaseServerClient();
  const [pub, draft] = await Promise.all([
    supabase.from(table).select("id", { count: "exact", head: true }).not("published_at", "is", null),
    supabase.from(table).select("id", { count: "exact", head: true }).is("published_at", null),
  ]);
  return { published: pub.count || 0, draft: draft.count || 0 };
}

export default async function PublishDistribution() {
  const [newsEn, newsAz, projectsEn, projectsAz, eventsEn, eventsAz] = await Promise.all([
    getCounts("news"),
    getCounts("news_az"),
    getCounts("projects"),
    getCounts("projects_az"),
    getCounts("events"),
    getCounts("events_az"),
  ]);

  const news = { published: newsEn.published + newsAz.published, draft: newsEn.draft + newsAz.draft };
  const projects = { published: projectsEn.published + projectsAz.published, draft: projectsEn.draft + projectsAz.draft };
  const events = { published: eventsEn.published + eventsAz.published, draft: eventsEn.draft + eventsAz.draft };

  const items = [
    { label: "News", ...news },
    { label: "Projects", ...projects },
    { label: "Events", ...events },
  ];

  return (
    <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
      <h3 className="mb-3 text-base font-semibold">Publish Distribution</h3>
      <div className="space-y-4">
        {items.map((it) => {
          const total = it.published + it.draft || 1;
          const pubPct = Math.round((it.published / total) * 100);
          const draftPct = 100 - pubPct;
          return (
            <div key={it.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{it.label}</span>
                <span className="text-xs text-dark-6">{it.published} / {it.draft}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-dark-3">
                <div className="h-2 bg-primary" style={{ width: `${pubPct}%` }} />
              </div>
              <div className="mt-1 text-xs text-dark-6">Published {pubPct}% · Draft {draftPct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
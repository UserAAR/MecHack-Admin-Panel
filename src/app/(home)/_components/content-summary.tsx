import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getCounts(table: string) {
  const supabase = await getSupabaseServerClient();
  const [pub, draft] = await Promise.all([
    supabase.from(table).select("id", { count: "exact", head: true }).not("published_at", "is", null),
    supabase.from(table).select("id", { count: "exact", head: true }).is("published_at", null),
  ]);
  return { published: pub.count || 0, draft: draft.count || 0 };
}

export default async function ContentSummary() {
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
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
          <div className="mb-2 text-sm font-medium text-dark-6">{it.label}</div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-2xl font-bold text-dark dark:text-white">{it.published}</div>
              <div className="text-xs text-dark-6">Published</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-dark dark:text-white">{it.draft}</div>
              <div className="text-xs text-dark-6">Draft</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
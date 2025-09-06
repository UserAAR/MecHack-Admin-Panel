import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getDraftCount(table: string) {
  const supabase = await getSupabaseServerClient();
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).is("published_at", null);
  return count || 0;
}

export async function OverviewCardsGroup() {
  const supabase = await getSupabaseServerClient();

  const [news, newsAz, projects, projectsAz, events, eventsAz, profiles, draftNews, draftNewsAz, draftProjects, draftProjectsAz, draftEvents, draftEventsAz] = await Promise.all([
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("news_az").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects_az").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("events_az").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    getDraftCount("news"),
    getDraftCount("news_az"),
    getDraftCount("projects"),
    getDraftCount("projects_az"),
    getDraftCount("events"),
    getDraftCount("events_az"),
  ]);

  const totalNews = (news.count || 0) + (newsAz.count || 0);
  const totalProjects = (projects.count || 0) + (projectsAz.count || 0);
  const totalEvents = (events.count || 0) + (eventsAz.count || 0);
  const totalUsers = profiles.count || 0;

  const draftNewsTotal = (draftNews as number) + (draftNewsAz as number);
  const draftProjectsTotal = (draftProjects as number) + (draftProjectsAz as number);
  const draftEventsTotal = (draftEvents as number) + (draftEventsAz as number);

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="News"
        data={{ value: compactFormat(totalNews), secondaryLabel: "Draft", secondaryValue: draftNewsTotal }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Projects"
        data={{ value: compactFormat(totalProjects), secondaryLabel: "Draft", secondaryValue: draftProjectsTotal }}
        Icon={icons.Product}
      />

      <OverviewCard
        label="Events"
        data={{ value: compactFormat(totalEvents), secondaryLabel: "Draft", secondaryValue: draftEventsTotal }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Users"
        data={{ value: compactFormat(totalUsers) }}
        Icon={icons.Users}
      />
    </div>
  );
}

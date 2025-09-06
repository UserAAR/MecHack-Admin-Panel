import React from "react";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { getCurrentUserWithRole } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpcomingEvents from "./_components/upcoming-events";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui-elements/button";
import { PaymentsOverview } from "@/components/Charts/payments-overview";

export const dynamic = "force-dynamic";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);
  const { role } = await getCurrentUserWithRole();

  const [{ data: latestNews }, { data: latestProjects }, { data: latestEvents }, mediaList] = await Promise.all([
    supabase.from("news").select("id,title,created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("projects").select("id,title,created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("events").select("id,title,event_date,created_at").order("created_at", { ascending: false }).limit(3),
    supabase.storage.from("media").list("", { limit: 24, sortBy: { column: "created_at", order: "desc" } }),
  ]);

  const recentFiles = (mediaList.data || []).filter((m) => m.name.includes(".")).slice(0, 12);

  return (
    <div>
      {role && (
        <div className="mb-4 rounded-md bg-gray-2 px-3 py-2 text-sm text-dark dark:bg-dark-3 dark:text-dark-6">
          Signed in as: <strong>{role}</strong>
        </div>
      )}

      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup />
      </Suspense>

      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/content/news/new" className={cn(buttonVariants({ variant: "primary", shape: "rounded", size: "small" }))}>New News</Link>
        <Link href="/content/projects/new" className={cn(buttonVariants({ variant: "primary", shape: "rounded", size: "small" }))}>New Project</Link>
        <Link href="/content/events/new" className={cn(buttonVariants({ variant: "primary", shape: "rounded", size: "small" }))}>New Event</Link>
      </div>

      {/* Content Overview chart */}
      <div className="mt-4">
        <PaymentsOverview timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]} />
      </div>

      {/* Latest content + Upcoming events + Media */}
      <div className="mt-4 grid grid-cols-12 gap-5 md:gap-6">
        <div className="col-span-12 xl:col-span-6">
          <div className="h-full rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
            <h3 className="mb-3 text-base font-semibold">Latest News</h3>
            <ul className="space-y-2">
              {(latestNews || []).map((n) => (
                <li key={n.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{n.title}</span>
                  <Link href={`/content/news/${n.id}/edit`} className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}>Edit</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <div className="h-full rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
            <h3 className="mb-3 text-base font-semibold">Latest Projects</h3>
            <ul className="space-y-2">
              {(latestProjects || []).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.title}</span>
                  <Link href={`/content/projects/${p.id}/edit`} className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}>Edit</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <div className="h-full rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
            <h3 className="mb-3 text-base font-semibold">Latest Events</h3>
            <ul className="space-y-2">
              {(latestEvents || []).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{e.title}</span>
                  <Link href={`/content/events/${e.id}/edit`} className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))}>Edit</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <UpcomingEvents />
        </div>
        <div className="col-span-12">
          <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
            <h3 className="mb-3 text-base font-semibold">Recent Media</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {recentFiles.map((m) => (
                <div key={m.name} className="aspect-square overflow-hidden rounded bg-gray-2 dark:bg-dark-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={supabase.storage.from("media").getPublicUrl(m.name).data.publicUrl} alt={m.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

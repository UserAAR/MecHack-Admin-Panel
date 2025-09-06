"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui-elements/button";

type EventItem = {
  id: string;
  title: string;
  event_date: string | null;
  location: string | null;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
function fmtKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarBox() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfMonth(new Date()));
  const [eventsByDay, setEventsByDay] = useState<Record<string, EventItem[]>>({});
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);

  const daysGrid = useMemo(() => {
    const firstDayIndex = monthStart.getDay(); // 0=Sun .. 6=Sat
    const daysInMonth = monthEnd.getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    // prev month tail
    for (let i = 0; i < firstDayIndex; i++) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() - (firstDayIndex - i));
      cells.push({ date: d, inMonth: false });
    }
    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(monthStart);
      date.setDate(d);
      cells.push({ date, inMonth: true });
    }
    // next month head to fill 42 cells (6 rows)
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [monthStart, monthEnd]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const fromIso = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).toISOString();
        const toIso = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999).toISOString();
        const { data } = await supabase
          .from("events")
          .select("id,title,location,event_date")
          .gte("event_date", fromIso)
          .lte("event_date", toIso)
          .order("event_date", { ascending: true });
        const byDay: Record<string, EventItem[]> = {};
        for (const e of data || []) {
          if (!e.event_date) continue;
          const key = fmtKey(new Date(e.event_date));
          if (!byDay[key]) byDay[key] = [];
          byDay[key].push(e as any);
        }
        setEventsByDay(byDay);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate]);

  const todayKey = fmtKey(new Date());

  function prevMonth() {
    setAnchorDate((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
  }
  function nextMonth() {
    setAnchorDate((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
  }
  function thisMonth() {
    setAnchorDate(startOfMonth(new Date()));
  }

  const monthLabel = anchorDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="w-full max-w-full rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-dark dark:text-white">{monthLabel}</div>
        <div className="flex gap-2">
          <button className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))} onClick={prevMonth}>Prev</button>
          <button className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))} onClick={thisMonth}>Today</button>
          <button className={cn(buttonVariants({ variant: "outlineDark", shape: "rounded", size: "small" }))} onClick={nextMonth}>Next</button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="grid grid-cols-7 rounded-t-[10px] bg-primary text-white">
            <th className="flex h-15 items-center justify-center rounded-tl-[10px] p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Sunday </span>
              <span className="block lg:hidden"> Sun </span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Monday </span>
              <span className="block lg:hidden"> Mon </span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Tuesday </span>
              <span className="block lg:hidden"> Tue </span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Wednesday </span>
              <span className="block lg:hidden"> Wed </span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Thursday </span>
              <span className="block lg:hidden"> Thur </span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Friday </span>
              <span className="block lg:hidden"> Fri </span>
            </th>
            <th className="flex h-15 items-center justify-center rounded-tr-[10px] p-1 text-body-xs font-medium sm:text-base xl:p-5">
              <span className="hidden lg:block"> Saturday </span>
              <span className="block lg:hidden"> Sat </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, row) => (
            <tr key={row} className="grid grid-cols-7">
              {daysGrid.slice(row * 7, row * 7 + 7).map(({ date, inMonth }) => {
                const key = fmtKey(date);
                const isToday = key === todayKey;
                const dayEvents = eventsByDay[key] || [];
                return (
                  <td key={key} className={cn("ease relative h-24 cursor-pointer border border-stroke p-2 align-top transition duration-300 hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2 md:h-28 md:p-3 xl:h-32", !inMonth && "opacity-50")}>
                    <span className={cn("inline-flex items-center gap-2 font-medium", isToday && "rounded bg-primary/10 px-1 text-primary")}>{date.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((e) => (
                        <Link key={e.id} href={`/content/events/${e.id}/edit`} className="block truncate rounded-[4px] border-l-2 border-primary bg-gray-2 px-2 py-0.5 text-xs text-dark hover:bg-primary/10 dark:bg-dark-2 dark:text-white">
                          {e.title || "Untitled"}
                        </Link>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="block text-[11px] text-dark-6">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="p-2 text-sm text-dark-6">Loading events...</div>}
    </div>
  );
}

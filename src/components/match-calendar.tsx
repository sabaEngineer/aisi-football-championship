"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ka } from "@/lib/ka";

type MatchItem = {
  id: number;
  date: Date | null;
  time: string | null;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  status: string;
  roundLabel?: string;
};

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function MatchCalendar({
  matches,
  championshipName,
}: {
  matches: MatchItem[];
  championshipName: string;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const withDate = matches.find((m) => m.date);
    return withDate?.date ? getMonday(new Date(withDate.date)) : getMonday(new Date());
  });

  const matchesWithDate = useMemo(
    () => matches.filter((m): m is MatchItem & { date: Date } => m.date !== null),
    [matches]
  );

  const uniqueMatchDays = useMemo(() => {
    const seen = new Set<string>();
    const days: Date[] = [];
    for (const m of matchesWithDate) {
      const d = new Date(m.date);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      if (!seen.has(key)) {
        seen.add(key);
        days.push(d);
      }
    }
    days.sort((a, b) => a.getTime() - b.getTime());
    return days;
  }, [matchesWithDate]);

  const showOnlyMatchDays = uniqueMatchDays.length >= 1 && uniqueMatchDays.length <= 3;
  const displayDays = showOnlyMatchDays ? uniqueMatchDays : (() => {
    const monday = getMonday(viewDate);
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  })();

  function getMatchesForDay(date: Date) {
    return matchesWithDate.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });
  }

  function prevWeek() {
    setViewDate((d) => {
      const m = getMonday(d);
      m.setDate(m.getDate() - 7);
      return m;
    });
  }

  function nextWeek() {
    setViewDate((d) => {
      const m = getMonday(d);
      m.setDate(m.getDate() + 7);
      return m;
    });
  }

  if (matchesWithDate.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        {ka.match.noDatesYet}
      </p>
    );
  }

  const headerLabel = showOnlyMatchDays
    ? displayDays.length === 1
      ? displayDays[0].toLocaleDateString("ka-GE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : `${displayDays[0].toLocaleDateString("ka-GE", { day: "numeric", month: "short" })} – ${displayDays[displayDays.length - 1].toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" })}`
    : `${getMonday(viewDate).toLocaleDateString("ka-GE", { day: "numeric", month: "short" })} – ${displayDays[6].toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showOnlyMatchDays ? (
          <div />
        ) : (
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <span className="font-semibold capitalize">{headerLabel}</span>
        {showOnlyMatchDays ? (
          <div />
        ) : (
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        className="grid gap-3 min-w-[20rem]"
        style={{ gridTemplateColumns: `repeat(${displayDays.length}, minmax(0, 1fr))` }}
      >
        {displayDays.map((date) => {
          const dayMatches = getMatchesForDay(date);
          const hasMatches = dayMatches.length > 0;
          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={date.toISOString()}
              className={`
                flex flex-col rounded-xl border min-h-[10rem] overflow-hidden
                ${hasMatches ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900" : "bg-muted/30 border-border"}
                ${isToday ? "ring-2 ring-green-500" : ""}
              `}
            >
              <div className="p-2 text-center border-b shrink-0">
                <p className="text-xs font-medium text-muted-foreground capitalize">
                  {date.toLocaleDateString("ka-GE", { weekday: "short" })}
                </p>
                <p className="text-lg font-bold">{date.getDate()}</p>
                <p className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("ka-GE", { month: "short" })}
                </p>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-auto">
                {dayMatches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">—</p>
                ) : (
                  dayMatches.map((m) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="block p-2 rounded-lg bg-background/80 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200/50 dark:border-green-800/50 transition-colors"
                    >
                      <p className="text-xs font-medium text-foreground leading-tight">
                        {m.homeTeam && m.awayTeam
                          ? `${m.homeTeam.name} ${ka.common.vs} ${m.awayTeam.name}`
                          : (m.roundLabel ?? ka.match.tbd)}
                      </p>
                      {m.time && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">{m.time}</p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ka } from "@/lib/ka";

export interface GroupStageMatch {
  id: number;
  groupNumber: number;
  bracketPosition: number;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  homeScore: number;
  awayScore: number;
  winnerId: number | null;
  status: string;
}

interface Props {
  matches: GroupStageMatch[];
}

export function GroupStageBracket({ matches }: Props) {
  const byGroup = new Map<number, GroupStageMatch[]>();
  for (const m of matches) {
    const g = m.groupNumber;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(m);
  }
  const groups = [...byGroup.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {ka.match.groupTitle.replace("{n}", String(g))}
          </h3>
          <div className="flex flex-wrap gap-3">
            {byGroup.get(g)!
              .sort((a, b) => a.bracketPosition - b.bracketPosition)
              .map((match) => (
                <GroupMatchCard key={match.id} match={match} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupMatchCard({ match }: { match: GroupStageMatch }) {
  const isCompleted = match.status === "COMPLETED";
  const hasTeams = match.homeTeam !== null && match.awayTeam !== null;

  const card = (
    <div
      className={cn(
        "w-52 rounded-lg border text-sm overflow-hidden transition-shadow",
        isCompleted ? "border-green-200 bg-green-50/30" : "border-border bg-card",
        hasTeams && "hover:shadow-md hover:border-green-300 cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <span
          className={cn(
            "truncate flex-1",
            match.winnerId !== null && match.homeTeam?.id === match.winnerId && "font-semibold text-green-800"
          )}
        >
          {match.homeTeam?.name ?? ka.match.tbd}
        </span>
        {isCompleted && (
          <span className="text-xs font-mono tabular-nums">{match.homeScore}</span>
        )}
      </div>
      <div className="border-t border-dashed border-border/50" />
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <span
          className={cn(
            "truncate flex-1",
            match.winnerId !== null && match.awayTeam?.id === match.winnerId && "font-semibold text-green-800"
          )}
        >
          {match.awayTeam?.name ?? ka.match.tbd}
        </span>
        {isCompleted && (
          <span className="text-xs font-mono tabular-nums">{match.awayScore}</span>
        )}
      </div>
      {isCompleted && match.homeScore === match.awayScore && hasTeams && (
        <p className="text-[10px] text-center text-muted-foreground px-2 pb-1">{ka.match.draw}</p>
      )}
    </div>
  );

  if (hasTeams) {
    return <Link href={`/matches/${match.id}`}>{card}</Link>;
  }
  return card;
}

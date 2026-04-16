"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Eye } from "lucide-react";
import { ka } from "@/lib/ka";

interface BracketMatch {
  id: number;
  round: number;
  bracketPosition: number;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  homeScore: number;
  awayScore: number;
  winnerId: number | null;
  status: string;
  date?: string | null;
  time?: string | null;
}

interface Props {
  matches: BracketMatch[];
  totalRounds: number;
  isAdmin?: boolean;
}

function getRoundLabel(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return ka.match.round.final;
  if (fromFinal === 1) return ka.match.round.semiFinal;
  if (fromFinal === 2) return ka.match.round.quarterFinal;
  return ka.match.round.roundN.replace("{n}", String(round));
}

export function TournamentBracket({ matches, totalRounds, isAdmin }: Props) {
  const champion = (() => {
    const final = matches.find((m) => m.round === totalRounds);
    if (final?.winnerId) {
      return final.homeTeam?.id === final.winnerId
        ? final.homeTeam
        : final.awayTeam;
    }
    return null;
  })();

  return (
    <div className="space-y-4">
      {champion && (
        <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-yellow-50 border border-yellow-200">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span className="text-lg font-bold text-yellow-800">{champion.name}</span>
          <span className="text-sm text-yellow-600">{ka.match.champion}</span>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-0 min-w-max items-stretch">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
            const roundMatches = matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.bracketPosition - b.bracketPosition);

            return (
              <div key={round} className="flex flex-col">
                <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
                  {getRoundLabel(round, totalRounds)}
                </div>
                <div className="flex flex-col flex-1 justify-around gap-2 px-2">
                  {roundMatches.map((match) => (
                    <MatchCard key={match.id} match={match} isAdmin={isAdmin} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatMatchDate(date?: string | null, time?: string | null) {
  if (!date && !time) return null;
  if (!date && time) return time;
  const d = new Date(date);
  const day = d.toLocaleDateString("ka-GE", { day: "numeric", month: "short" });
  return time ? `${day}, ${time}` : day;
}

function MatchCard({ match, isAdmin }: { match: BracketMatch; isAdmin?: boolean }) {
  const isCompleted = match.status === "COMPLETED";
  const isBye =
    isCompleted && (match.homeTeam === null || match.awayTeam === null);
  const hasTeams = match.homeTeam !== null && match.awayTeam !== null;
  const isTbdScheduled = !hasTeams && !isBye && match.status !== "COMPLETED";
  const dateLabel = formatMatchDate(match.date, match.time);

  const card = (
    <div
      className={cn(
        "w-52 rounded-lg border text-sm my-1 overflow-hidden transition-shadow",
        isCompleted ? "border-green-200 bg-green-50/30" : "border-border bg-card",
        isBye && "opacity-50",
        (hasTeams && !isBye || (isTbdScheduled && isAdmin)) && "hover:shadow-md hover:border-green-300 cursor-pointer"
      )}
    >
      {dateLabel && (
        <div className="flex items-center gap-1 px-3 py-1 bg-muted/50 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {dateLabel}
        </div>
      )}
      <TeamSlot
        team={match.homeTeam}
        score={match.homeScore}
        isWinner={match.winnerId !== null && match.homeTeam?.id === match.winnerId}
        isCompleted={isCompleted}
        isBye={isBye && match.homeTeam === null}
      />
      <div className="border-t border-dashed border-border/50" />
      <TeamSlot
        team={match.awayTeam}
        score={match.awayScore}
        isWinner={match.winnerId !== null && match.awayTeam?.id === match.winnerId}
        isCompleted={isCompleted}
        isBye={isBye && match.awayTeam === null}
      />
      {(hasTeams && !isBye || (isTbdScheduled && isAdmin)) && (
        <div className="flex items-center justify-center gap-1 px-3 py-1.5 border-t text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <Eye className="h-3 w-3" />
          {ka.match.viewMatch}
        </div>
      )}
    </div>
  );

  if ((hasTeams && !isBye) || (isTbdScheduled && isAdmin)) {
    return <Link href={`/matches/${match.id}`}>{card}</Link>;
  }
  return card;
}

function TeamSlot({
  team,
  score,
  isWinner,
  isCompleted,
  isBye,
}: {
  team: { id: number; name: string } | null;
  score: number;
  isWinner: boolean;
  isCompleted: boolean;
  isBye: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 gap-2",
        isWinner && "bg-green-100 font-semibold"
      )}
    >
      <span
        className={cn(
          "truncate flex-1",
          !team && "text-muted-foreground italic",
          isWinner && "text-green-800",
          isBye && "text-muted-foreground/50"
        )}
      >
        {isBye ? ka.match.bye : team ? team.name : ka.match.tbd}
      </span>
      {isCompleted && team && !isBye && (
        <span
          className={cn(
            "text-xs font-mono tabular-nums w-5 text-center rounded",
            isWinner
              ? "bg-green-600 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

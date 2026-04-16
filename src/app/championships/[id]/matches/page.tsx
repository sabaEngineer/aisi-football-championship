import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentBracket } from "@/components/tournament-bracket";
import { GroupStageBracket } from "@/components/group-stage-bracket";
import { CalendarModalTrigger } from "@/components/calendar-modal-trigger";
import { MatchScoreEntry } from "./match-score-entry";
import { ka } from "@/lib/ka";

export const dynamic = "force-dynamic";

export default async function ChampionshipMatchesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [championship, matches, session] = await Promise.all([
    prisma.championship.findUnique({
      where: { id },
      select: { name: true },
    }),
    prisma.match.findMany({
      where: { championshipId: id },
      include: {
        homeTeam: true,
        awayTeam: true,
        winner: true,
      },
      orderBy: [{ round: "asc" }, { bracketPosition: "asc" }],
    }),
    getSession(),
  ]);

  const isAdmin = session?.role === "ADMIN";

  if (!championship) notFound();

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {ka.match.noMatches}
          </p>
        </CardContent>
      </Card>
    );
  }

  const groupRawMatches = matches.filter((m) => m.groupNumber != null);
  const knockoutRawMatches = matches.filter((m) => m.groupNumber === null);

  const hasGroupStage = groupRawMatches.length > 0;
  const hasKnockout = knockoutRawMatches.length > 0;

  const knockoutTotalRounds = hasKnockout
    ? Math.max(...knockoutRawMatches.map((m) => m.round ?? 0))
    : 0;
  const totalRounds = hasKnockout
    ? knockoutTotalRounds
    : Math.max(...matches.map((m) => m.round ?? 0));

  const knockoutBracketMatches = knockoutRawMatches.map((m) => ({
    id: m.id,
    round: m.round ?? 1,
    bracketPosition: m.bracketPosition ?? 1,
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    winnerId: m.winnerId,
    status: m.status,
    date: m.date?.toISOString() ?? null,
    time: m.time,
  }));

  const allBracketMatches = matches.map((m) => ({
    id: m.id,
    round: m.round ?? 1,
    bracketPosition: m.bracketPosition ?? 1,
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    winnerId: m.winnerId,
    status: m.status,
    date: m.date?.toISOString() ?? null,
    time: m.time,
  }));

  const playableMatches = matches.filter(
    (m) =>
      m.homeTeamId !== null &&
      m.awayTeamId !== null &&
      m.status !== "COMPLETED" &&
      !(m.homeTeam === null && m.awayTeam === null)
  );

  const groupStageMatches = hasGroupStage
    ? groupRawMatches.map((m) => ({
          id: m.id,
          groupNumber: m.groupNumber!,
          bracketPosition: m.bracketPosition ?? 0,
          homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
          awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          winnerId: m.winnerId,
          status: m.status,
          date: m.date?.toISOString() ?? null,
          time: m.time,
        }))
    : [];

  function getRoundLabel(round: number, totalRounds: number): string {
    const fromFinal = totalRounds - round;
    if (fromFinal === 0) return ka.match.round.final;
    if (fromFinal === 1) return ka.match.round.semiFinal;
    if (fromFinal === 2) return ka.match.round.quarterFinal;
    return ka.match.round.roundN.replace("{n}", String(round));
  }

  const calendarMatches = matches
    .filter((m) => m.date !== null)
    .map((m) => ({
      id: m.id,
      date: m.date,
      time: m.time,
      homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
      awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
      status: m.status,
      roundLabel: getRoundLabel(m.round ?? 1, totalRounds),
    }));

  const hasAnyScheduledDate = calendarMatches.length > 0;

  return (
    <div className="space-y-6">
      {hasAnyScheduledDate && (
        <div className="flex justify-start">
          <CalendarModalTrigger matches={calendarMatches} championshipName={championship.name} />
        </div>
      )}

      {hasGroupStage && (
        <Card>
          <CardHeader>
            <CardTitle>{ka.match.groupStageTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupStageBracket matches={groupStageMatches} />
          </CardContent>
        </Card>
      )}

      {hasKnockout && (
        <Card>
          <CardHeader>
            <CardTitle>{ka.settings.knockoutTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentBracket matches={knockoutBracketMatches} totalRounds={knockoutTotalRounds} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      )}

      {!hasGroupStage && !hasKnockout && (
        <Card>
          <CardHeader>
            <CardTitle>{ka.match.tournamentBracket}</CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentBracket matches={allBracketMatches} totalRounds={totalRounds} isAdmin={isAdmin} />
          </CardContent>
        </Card>
      )}

      {isAdmin && playableMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{ka.match.enterResults}</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchScoreEntry
              matches={playableMatches.map((m) => ({
                id: m.id,
                round: m.round ?? 1,
                homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
                awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                status: m.status,
                groupNumber: m.groupNumber,
              }))}
              totalRounds={totalRounds}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

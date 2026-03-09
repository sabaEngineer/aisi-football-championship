import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentBracket } from "@/components/tournament-bracket";
import { MatchScoreEntry } from "./match-score-entry";

export const dynamic = "force-dynamic";

export default async function ChampionshipMatchesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [matches, session] = await Promise.all([
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

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No matches yet.{isAdmin ? " Go to Settings to draw the tournament bracket." : ""}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalRounds = Math.max(...matches.map((m) => m.round ?? 0));

  const bracketMatches = matches.map((m) => ({
    id: m.id,
    round: m.round ?? 1,
    bracketPosition: m.bracketPosition ?? 1,
    homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    winnerId: m.winnerId,
    status: m.status,
  }));

  const playableMatches = matches.filter(
    (m) =>
      m.homeTeamId !== null &&
      m.awayTeamId !== null &&
      m.status !== "COMPLETED" &&
      !(m.homeTeam === null && m.awayTeam === null)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentBracket matches={bracketMatches} totalRounds={totalRounds} />
        </CardContent>
      </Card>

      {isAdmin && playableMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Match Results</CardTitle>
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
              }))}
              totalRounds={totalRounds}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

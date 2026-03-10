import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchPitch } from "./match-pitch";
import { MatchInfoEditor } from "./match-info-editor";
import { StaffAssignment } from "./staff-assignment";
import { ka } from "@/lib/ka";

export const dynamic = "force-dynamic";

function getRoundLabel(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return ka.match.round.final;
  if (fromFinal === 1) return ka.match.round.semiFinal;
  if (fromFinal === 2) return ka.match.round.quarterFinal;
  return ka.match.round.roundN.replace("{n}", String(round));
}

const statusColor: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  LIVE: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [match, session] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: {
        championship: true,
        homeTeam: {
          include: {
            members: {
              where: { status: "ACTIVE" },
              include: { user: true },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
        awayTeam: {
          include: {
            members: {
              where: { status: "ACTIVE" },
              include: { user: true },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
        winner: true,
        staff: { include: { user: true } },
      },
    }),
    getSession(),
  ]);

  if (!match) notFound();

  const isAdmin = session?.role === "ADMIN";
  const hasTeams = match.homeTeam !== null && match.awayTeam !== null;

  // Non-admins cannot view matches where teams are not yet known (semi-final, final TBD)
  if (!hasTeams && !isAdmin) notFound();

  const totalRounds = await prisma.match.aggregate({
    where: { championshipId: match.championshipId },
    _max: { round: true },
  });
  const maxRound = totalRounds._max.round ?? 1;
  const roundLabel = getRoundLabel(match.round ?? 1, maxRound);

  const homeMembers = match.homeTeam?.members.map((m) => ({
    id: m.id,
    fullName: m.user.fullName,
    position: m.position || m.user.position || "?",
    positionX: m.positionX,
    positionY: m.positionY,
    role: m.role as "CAPTAIN" | "PLAYER",
  })) ?? [];

  const awayMembers = match.awayTeam?.members.map((m) => ({
    id: m.id,
    fullName: m.user.fullName,
    position: m.position || m.user.position || "?",
    positionX: m.positionX,
    positionY: m.positionY,
    role: m.role as "CAPTAIN" | "PLAYER",
  })) ?? [];

  const staffUsers = isAdmin
    ? await prisma.user.findMany({
        where: { role: "STAFF" },
        orderBy: { fullName: "asc" },
      })
    : [];

  // When current match is empty, find another match in championship with date/time/location to suggest
  const currentMatchEmpty = !match.date && !match.time && !match.location;
  const suggestedFrom = currentMatchEmpty && isAdmin
    ? await prisma.match.findFirst({
        where: {
          championshipId: match.championshipId,
          id: { not: match.id },
          OR: [
            { date: { not: null } },
            { time: { not: null } },
            { location: { not: null } },
          ],
        },
        select: {
          date: true,
          time: true,
          location: true,
          locationUrl: true,
          description: true,
        },
      })
    : null;

  const suggestedDefaults = suggestedFrom
    ? {
        date: suggestedFrom.date ? suggestedFrom.date.toISOString().split("T")[0] : null,
        time: suggestedFrom.time,
        location: suggestedFrom.location,
        locationUrl: suggestedFrom.locationUrl,
        description: suggestedFrom.description,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/championships/${match.championshipId}/matches`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {ka.match.backToBracket}
        </Link>
      </div>

      <div className="rounded-xl bg-green-700 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{match.championship.name} · {roundLabel}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold text-white">{match.homeTeam?.name ?? ka.match.tbd}</span>
              {match.status === "COMPLETED" ? (
                <span className="text-3xl font-extrabold text-white tabular-nums">
                  {match.homeScore} – {match.awayScore}
                </span>
              ) : (
                <span className="text-xl font-semibold text-white/60">{ka.common.vs}</span>
              )}
              <span className="text-2xl font-bold text-white">{match.awayTeam?.name ?? ka.match.tbd}</span>
            </div>
          </div>
          <Badge className={statusColor[match.status] || "bg-white/20 text-white"}>
            {ka.match.statusMap[match.status] ?? match.status}
          </Badge>
        </div>
        {match.winner && (
          <p className="text-white/80 text-sm mt-2">
            {ka.match.winner} <span className="font-semibold text-white">{match.winner.name}</span>
          </p>
        )}
        {(match.date || match.time || match.location) && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-white/70 text-sm">
            {match.date && <span>{new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
            {match.time && <span>{match.time}</span>}
            {match.location && <span>{match.location}</span>}
          </div>
        )}
      </div>

      <MatchInfoEditor
        matchId={match.id}
        date={match.date ? match.date.toISOString().split("T")[0] : null}
        time={match.time}
        location={match.location}
        locationUrl={match.locationUrl}
        description={match.description}
        suggestedDefaults={suggestedDefaults}
        isAdmin={isAdmin}
      />

      {hasTeams && (
        <MatchPitch
          homeTeamName={match.homeTeam!.name}
          awayTeamName={match.awayTeam!.name}
          homePlayers={homeMembers}
          awayPlayers={awayMembers}
          maxPlayers={match.championship.maxPlayersPerTeam}
        />
      )}

      {hasTeams && (
      <Card>
        <CardHeader>
          <CardTitle>{ka.match.matchStaff}</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffAssignment
            matchId={match.id}
            assignedStaff={match.staff.map((s) => ({
              id: s.id,
              userId: s.userId,
              fullName: s.user.fullName,
              role: s.role,
              position: s.user.position,
            }))}
            availableStaff={staffUsers.map((u) => ({
              id: u.id,
              fullName: u.fullName,
              position: u.position,
            }))}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
      )}
    </div>
  );
}

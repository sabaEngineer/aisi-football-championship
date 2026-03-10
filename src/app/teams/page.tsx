import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ka } from "@/lib/ka";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { AllTeamsFullModal } from "@/components/all-teams-full-modal";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await getSession();
  const [teams, userChampionshipIds] = await Promise.all([
    prisma.team.findMany({
      include: {
        championship: { select: { id: true, name: true, maxPlayersPerTeam: true, maxReservesPerTeam: true } },
        _count: { select: { members: true } },
        members: {
          select: { status: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    session?.userId
      ? prisma.teamMember.findMany({
          where: { userId: session.userId, status: { not: "LEFT" } },
          select: { team: { select: { championshipId: true } } },
        }).then((ms) => new Set(ms.map((m) => m.team.championshipId)))
      : Promise.resolve(new Set<number>()),
  ]);

  const isAdmin = session?.role === "ADMIN";
  const isPlayer = session?.role === "PLAYER";

  function teamNeedsPlayers(t: (typeof teams)[0]) {
    const activeCount = t.members.filter((m) => m.status === "ACTIVE").length;
    const reserveCount = t.members.filter((m) => m.status === "RESERVE").length;
    const canJoinActive = activeCount < t.championship.maxPlayersPerTeam;
    const canJoinReserve = activeCount >= t.championship.maxPlayersPerTeam && reserveCount < t.championship.maxReservesPerTeam;
    return canJoinActive || canJoinReserve;
  }

  function canUserJoin(t: (typeof teams)[0]) {
    if (!isPlayer || !session) return false;
    if (userChampionshipIds.has(t.championship.id)) return false;
    return teamNeedsPlayers(t);
  }

  const allTeamsFull =
    teams.length > 0 && teams.every((t) => !teamNeedsPlayers(t));
  const noTeamsOrAllFull = teams.length === 0 || allTeamsFull;
  const showAllTeamsFullModal =
    isPlayer &&
    !!session &&
    userChampionshipIds.size === 0 &&
    noTeamsOrAllFull;

  return (
    <div className="space-y-6">
      {showAllTeamsFullModal && <AllTeamsFullModal open={true} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ka.team.title}</h1>
          <p className="text-muted-foreground mt-1">{ka.team.allTeamsDesc}</p>
        </div>
        {isAdmin && (
          <Link href="/teams/new">
            <Button><Plus className="h-4 w-4 mr-2" />{ka.team.newTeam}</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{ka.team.noTeams}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.championship.teams}</TableHead>
                  <TableHead>{ka.team.championship}</TableHead>
                  <TableHead>{ka.team.activePlayers}</TableHead>
                  <TableHead>{ka.team.reserve}</TableHead>
                  <TableHead>{ka.team.totalMembers}</TableHead>
                  {isPlayer && <TableHead className="w-[100px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t) => {
                  const activeCount = t.members.filter((m) => m.status === "ACTIVE").length;
                  const reserveCount = t.members.filter((m) => m.status === "RESERVE").length;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link href={`/teams/${t.id}`} className="font-medium hover:underline">
                          {t.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/championships/${t.championship.id}`} className="hover:underline text-muted-foreground">
                          {t.championship.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {activeCount} / {t.championship.maxPlayersPerTeam}
                      </TableCell>
                      <TableCell>
                        {reserveCount} / {t.championship.maxReservesPerTeam}
                      </TableCell>
                      <TableCell>{t._count.members}</TableCell>
                      {isPlayer && (
                        <TableCell>
                          {canUserJoin(t) ? (
                            <Link href={`/teams/${t.id}`}>
                              <Button size="sm" variant="default">{ka.team.join}</Button>
                            </Link>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

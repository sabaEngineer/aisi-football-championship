import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { ka } from "@/lib/ka";
import { AllTeamsFullModal } from "@/components/all-teams-full-modal";
import { PaymentInfoModal } from "@/components/payment-info-modal";

export const dynamic = "force-dynamic";

export default async function ChampionshipTeamsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [championship, session] = await Promise.all([
    prisma.championship.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            members: { where: { status: { not: "LEFT" } }, include: { user: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    }),
    getSession(),
  ]);

  if (!championship) notFound();

  // Sort teams by member count (more full first)
  const teams = [...championship.teams].sort((a, b) => b.members.length - a.members.length);

  const isAdmin = session?.role === "ADMIN";
  const isPlayer = session?.role === "PLAYER";

  const currentUserHasTeamInChampionship = session
    ? await prisma.teamMember.findFirst({
        where: {
          userId: session.userId,
          status: { not: "LEFT" },
          team: { championshipId: championship.id },
        },
        include: { team: true },
      })
    : null;

  const userCanJoin = isPlayer && session && !currentUserHasTeamInChampionship;

  const champ = championship!;
  function teamNeedsPlayers(team: { members: { status: string }[] }) {
    const activeCount = team.members.filter((m) => m.status === "ACTIVE").length;
    const reserveCount = team.members.filter((m) => m.status === "RESERVE").length;
    const canJoinActive = activeCount < champ.maxPlayersPerTeam;
    const canJoinReserve = activeCount >= champ.maxPlayersPerTeam && reserveCount < champ.maxReservesPerTeam;
    return canJoinActive || canJoinReserve;
  }

  const allTeamsFullInChampionship =
    teams.length > 0 && teams.every((t) => !teamNeedsPlayers(t));
  const noTeamsOrAllFull =
    teams.length === 0 || allTeamsFullInChampionship;
  const showAllTeamsFullModal =
    isPlayer &&
    !!session &&
    !currentUserHasTeamInChampionship &&
    noTeamsOrAllFull;

  return (
    <>
      {showAllTeamsFullModal && <AllTeamsFullModal open={true} />}
      {currentUserHasTeamInChampionship?.team && (
        <div className="flex justify-start mb-4">
          <PaymentInfoModal teamName={currentUserHasTeamInChampionship.team.name} />
        </div>
      )}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {`${ka.tabs.teams} (${teams.length} / ${championship.maxTeams})`}
        </CardTitle>
        {isAdmin && teams.length < championship.maxTeams && (
          <Link href={`/teams/new?championshipId=${championship.id}`}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />{ka.team.addTeam}
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">{ka.team.noTeams}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ka.team.teamName}</TableHead>
                <TableHead>{ka.team.activePlayers}</TableHead>
                <TableHead>{ka.team.reserve}</TableHead>
                <TableHead>{ka.team.captain}</TableHead>
                {isPlayer && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => {
                const captain = team.members.find((m) => m.role === "CAPTAIN" && m.status === "ACTIVE");
                const activeCount = team.members.filter((m) => m.status === "ACTIVE").length;
                const reserveCount = team.members.filter((m) => m.status === "RESERVE").length;
                const canJoin = userCanJoin && teamNeedsPlayers(team);
                return (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Link href={`/teams/${team.id}`} className="font-medium hover:underline">
                        {team.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {activeCount} / {championship.maxPlayersPerTeam}
                    </TableCell>
                    <TableCell>{reserveCount} / {championship.maxReservesPerTeam}</TableCell>
                    <TableCell>{captain?.user.fullName || "\u2014"}</TableCell>
                    {isPlayer && (
                      <TableCell>
                        {canJoin ? (
                          <Link href={`/teams/${team.id}`}>
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
    </>
  );
}

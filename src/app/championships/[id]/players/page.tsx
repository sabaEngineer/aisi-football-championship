import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ka, getPositionLabel } from "@/lib/ka";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ChampionshipPlayersTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [championship, members] = await Promise.all([
    prisma.championship.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            members: { where: { status: { not: "LEFT" } }, select: { status: true } },
          },
        },
      },
    }),
    prisma.teamMember.findMany({
      where: { team: { championshipId: id }, status: { not: "LEFT" } },
      include: {
        user: true,
        team: { select: { id: true, name: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    }),
  ]);

  if (!championship) notFound();

  const active = members.filter((m) => m.status === "ACTIVE");
  const reserve = members.filter((m) => m.status === "RESERVE");

  const allTeamsAndBenchesFull =
    championship.teams.length > 0 &&
    championship.teams.every((t) => {
      const activeCount = t.members.filter((m) => m.status === "ACTIVE").length;
      const reserveCount = t.members.filter((m) => m.status === "RESERVE").length;
      return (
        activeCount >= championship.maxPlayersPerTeam &&
        reserveCount >= championship.maxReservesPerTeam
      );
    });

  const assignedUserIds = [...new Set(members.map((m) => m.userId))];
  const unassigned =
    allTeamsAndBenchesFull && championship.teams.length > 0
      ? await prisma.user.findMany({
          where: {
            role: "PLAYER",
            id: {
              notIn: assignedUserIds.length > 0 ? assignedUserIds : [-1],
            },
          },
          select: { id: true, fullName: true, position: true },
          orderBy: { fullName: "asc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ka.player.activePlayers.replace("{n}", String(active.length))}</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-muted-foreground text-sm">{ka.player.noActivePlayers}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.team.player}</TableHead>
                  <TableHead>{ka.player.team}</TableHead>
                  <TableHead>{ka.player.position}</TableHead>
                  <TableHead>{ka.player.role}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/players/${m.userId}`} className="hover:underline">
                        {m.user.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/teams/${m.team.id}`} className="hover:underline">
                        {m.team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getPositionLabel(m.position || m.user.position)}</TableCell>
                    <TableCell>
                      {m.role === "CAPTAIN" ? (
                        <Badge className="bg-yellow-100 text-yellow-800">{ka.team.captain}</Badge>
                      ) : (
                        <span className="text-muted-foreground">{ka.team.player}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {reserve.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{ka.player.reservePlayers.replace("{n}", String(reserve.length))}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.team.player}</TableHead>
                  <TableHead>{ka.player.team}</TableHead>
                  <TableHead>{ka.player.position}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserve.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/players/${m.userId}`} className="hover:underline">
                        {m.user.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/teams/${m.team.id}`} className="hover:underline">
                        {m.team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getPositionLabel(m.position || m.user.position)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {allTeamsAndBenchesFull && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle>
              {ka.player.playersWithoutTeam.replace("{n}", String(unassigned.length))}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {ka.player.playersWithoutTeamDesc}
            </p>
          </CardHeader>
          <CardContent>
            {unassigned.length === 0 ? (
              <p className="text-muted-foreground text-sm">{ka.player.noPlayersWithoutTeam}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ka.team.player}</TableHead>
                    <TableHead>{ka.player.position}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassigned.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <Link href={`/players/${u.id}`} className="hover:underline">
                          {u.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{getPositionLabel(u.position)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

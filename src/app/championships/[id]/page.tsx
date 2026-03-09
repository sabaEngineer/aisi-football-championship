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

  const isAdmin = session?.role === "ADMIN";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Teams ({championship.teams.length} / {championship.maxTeams})
        </CardTitle>
        {isAdmin && championship.teams.length < championship.maxTeams && (
          <Link href={`/teams/new?championshipId=${championship.id}`}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />Add Team
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {championship.teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">No teams yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Active Players</TableHead>
                <TableHead>Reserve</TableHead>
                <TableHead>Captain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {championship.teams.map((team) => {
                const captain = team.members.find((m) => m.role === "CAPTAIN" && m.status === "ACTIVE");
                const activeCount = team.members.filter((m) => m.status === "ACTIVE").length;
                const reserveCount = team.members.filter((m) => m.status === "RESERVE").length;
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
                    <TableCell>{reserveCount}</TableCell>
                    <TableCell>{captain?.user.fullName || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
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

  const members = await prisma.teamMember.findMany({
    where: { team: { championshipId: id }, status: { not: "LEFT" } },
    include: {
      user: true,
      team: { select: { id: true, name: true } },
    },
    orderBy: { user: { fullName: "asc" } },
  });

  const active = members.filter((m) => m.status === "ACTIVE");
  const reserve = members.filter((m) => m.status === "RESERVE");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Players ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active players.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.user.fullName}</TableCell>
                    <TableCell>
                      <Link href={`/teams/${m.team.id}`} className="hover:underline">
                        {m.team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{m.position || m.user.position || "—"}</TableCell>
                    <TableCell>
                      {m.role === "CAPTAIN" ? (
                        <Badge className="bg-yellow-100 text-yellow-800">Captain</Badge>
                      ) : (
                        <span className="text-muted-foreground">Player</span>
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
            <CardTitle>Reserve Players ({reserve.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserve.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.user.fullName}</TableCell>
                    <TableCell>
                      <Link href={`/teams/${m.team.id}`} className="hover:underline">
                        {m.team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{m.position || m.user.position || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

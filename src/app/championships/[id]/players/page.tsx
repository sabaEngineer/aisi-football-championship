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
                    <TableCell className="font-medium">{m.user.fullName}</TableCell>
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
                    <TableCell className="font-medium">{m.user.fullName}</TableCell>
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
    </div>
  );
}

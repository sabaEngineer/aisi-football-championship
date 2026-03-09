import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [teams, session] = await Promise.all([
    prisma.team.findMany({
      include: {
        championship: { select: { id: true, name: true, maxPlayersPerTeam: true } },
        _count: { select: { members: true } },
        members: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    getSession(),
  ]);

  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">All registered teams across championships</p>
        </div>
        {isAdmin && (
          <Link href="/teams/new">
            <Button><Plus className="h-4 w-4 mr-2" />New Team</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No teams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Championship</TableHead>
                  <TableHead>Active Players</TableHead>
                  <TableHead>Total Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t) => (
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
                      {t.members.length} / {t.championship.maxPlayersPerTeam}
                    </TableCell>
                    <TableCell>{t._count.members}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

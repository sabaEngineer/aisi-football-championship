import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { ka } from "@/lib/ka";

export const dynamic = "force-dynamic";

export default async function ChampionshipStaffTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [allStaff, matchStaff, session] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { fullName: "asc" },
    }),
    prisma.matchStaff.findMany({
      where: { match: { championshipId: id } },
      include: {
        user: true,
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: { match: { round: "asc" } },
    }),
    getSession(),
  ]);

  const isAdmin = session?.role === "ADMIN";

  const assignmentsByUser = new Map<number, typeof matchStaff>();
  for (const ms of matchStaff) {
    if (!assignmentsByUser.has(ms.userId)) {
      assignmentsByUser.set(ms.userId, []);
    }
    assignmentsByUser.get(ms.userId)!.push(ms);
  }

  const staffList = allStaff.map((user) => ({
    user,
    assignments: assignmentsByUser.get(user.id) || [],
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{`${ka.staff.staffAssignments.replace("{n}", String(staffList.length))}`}</CardTitle>
          {isAdmin && (
            <Link href="/staff/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />{ka.staff.addStaffUser}
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {staffList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {ka.staff.noStaffAssigned}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.staff.staffMember}</TableHead>
                  <TableHead>{ka.staff.type}</TableHead>
                  <TableHead>{ka.staff.matchesAssigned}</TableHead>
                  <TableHead>{ka.staff.roles}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((s) => (
                  <TableRow key={s.user.id}>
                    <TableCell className="font-medium">{s.user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.user.position || "—"}</TableCell>
                    <TableCell>
                      {s.assignments.map((a, i) => (
                        <span key={a.id}>
                          {i > 0 && ", "}
                          <Link href={`/matches/${a.matchId}`} className="text-primary hover:underline text-sm">
                            {a.match.homeTeam?.name ?? ka.match.tbd} {ka.common.vs} {a.match.awayTeam?.name ?? ka.match.tbd}
                          </Link>
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {[...new Set(s.assignments.map((a) => a.role))].map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
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

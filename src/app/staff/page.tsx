import Link from "next/link";
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

export default async function StaffListPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const staffUsers = await prisma.user.findMany({
    where: { role: "STAFF" },
    include: {
      matchStaff: {
        include: {
          match: { include: { homeTeam: true, awayTeam: true, championship: true } },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-green-700 px-6 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{ka.staff.title}</h1>
          <p className="text-white/80 mt-1">
            {ka.staff.membersCount.replace("{n}", String(staffUsers.length))}
          </p>
        </div>
        {isAdmin && (
          <Link href="/staff/new">
            <Button className="bg-white text-green-800 hover:bg-green-50">
              <Plus className="h-4 w-4 mr-2" />{ka.staff.addStaff}
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ka.staff.allStaff}</CardTitle>
        </CardHeader>
        <CardContent>
          {staffUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {ka.staff.noStaff}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.staff.name}</TableHead>
                  <TableHead>{ka.staff.staffRole}</TableHead>
                  <TableHead>{ka.staff.phoneLabel}</TableHead>
                  <TableHead>{ka.staff.assignments}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffUsers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.fullName}</TableCell>
                    <TableCell>
                      {staff.position ? (
                        <Badge variant="outline">{staff.position}</Badge>
                      ) : (
                        <span className="text-muted-foreground">&#8212;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.phone || "\u2014"}
                    </TableCell>
                    <TableCell>
                      {staff.matchStaff.length === 0 ? (
                        <span className="text-muted-foreground text-sm">{ka.staff.noAssignments}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {staff.matchStaff.slice(0, 3).map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-xs">
                              {a.match.homeTeam?.name ?? ka.match.tbd} {ka.common.vs} {a.match.awayTeam?.name ?? ka.match.tbd}
                            </Badge>
                          ))}
                          {staff.matchStaff.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              {`+${staff.matchStaff.length - 3} \u10E1\u10EE\u10D5\u10D0`}
                            </Badge>
                          )}
                        </div>
                      )}
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

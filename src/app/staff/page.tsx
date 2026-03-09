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
          <h1 className="text-3xl font-bold tracking-tight text-white">Staff Members</h1>
          <p className="text-white/80 mt-1">
            {staffUsers.length} staff member{staffUsers.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {isAdmin && (
          <Link href="/staff/new">
            <Button className="bg-white text-green-800 hover:bg-green-50">
              <Plus className="h-4 w-4 mr-2" />Add Staff
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Staff</CardTitle>
        </CardHeader>
        <CardContent>
          {staffUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No staff members yet.{isAdmin ? " Click \"Add Staff\" to create one." : ""}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assignments</TableHead>
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
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.phone || "—"}
                    </TableCell>
                    <TableCell>
                      {staff.matchStaff.length === 0 ? (
                        <span className="text-muted-foreground text-sm">No assignments</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {staff.matchStaff.slice(0, 3).map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-xs">
                              {a.match.homeTeam?.name ?? "TBD"} vs {a.match.awayTeam?.name ?? "TBD"}
                            </Badge>
                          ))}
                          {staff.matchStaff.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{staff.matchStaff.length - 3} more
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

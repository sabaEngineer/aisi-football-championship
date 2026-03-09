import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REGISTRATION: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function ChampionshipsPage() {
  const [championships, session] = await Promise.all([
    prisma.championship.findMany({
      include: { _count: { select: { teams: true, matches: true, sponsors: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getSession(),
  ]);

  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Green banner at the top */}
      <div className="rounded-xl bg-green-700 px-6 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Championships</h1>
          <p className="text-white/80 mt-1">
            {isAdmin ? "Manage your football championships" : "Browse football championships"}
          </p>
        </div>
        {isAdmin && (
          <Link href="/championships/new">
            <Button className="bg-white text-green-800 hover:bg-green-50"><Plus className="h-4 w-4 mr-2" />New Championship</Button>
          </Link>
        )}
      </div>

      {championships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No championships yet.{isAdmin ? " Create your first one!" : ""}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {championships.map((c) => (
            <Link key={c.id} href={`/championships/${c.id}`}>
              <Card className="hover:bg-muted/50 transition-colors h-full border-l-4 border-l-green-600">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <Badge className={statusColor[c.status] || ""} variant="secondary">
                      {c.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">{c._count.teams}</span>
                      {" / "}{c.maxTeams} teams
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{c._count.matches}</span> matches
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{c._count.sponsors}</span> sponsors
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Max {c.maxPlayersPerTeam} players per team
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

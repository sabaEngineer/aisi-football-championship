import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { ka } from "@/lib/ka";

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
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        maxTeams: true,
        maxPlayersPerTeam: true,
        _count: { select: { teams: true, matches: true, sponsors: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getSession(),
  ]);

  const isAdmin = session?.role === "ADMIN";

  // For logged-in users: which championships they're in (via team membership)
  const registeredChampionshipIds = session
    ? new Set(
        (await prisma.teamMember.findMany({
          where: { userId: session.userId, status: { not: "LEFT" } },
          include: { team: { select: { championshipId: true } } },
        })).map((m) => m.team.championshipId)
      )
    : new Set<number>();

  return (
    <div className="space-y-6">
      {/* Green banner at the top */}
      <div className="rounded-xl bg-green-700 px-6 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{ka.championship.title}</h1>
          <p className="text-white/80 mt-1">
            {isAdmin ? ka.championship.manageDesc : ka.championship.browseDesc}
          </p>
        </div>
        {isAdmin && (
          <Link href="/championships/new">
            <Button className="bg-white text-green-800 hover:bg-green-50"><Plus className="h-4 w-4 mr-2" />{ka.championship.newChampionship}</Button>
          </Link>
        )}
      </div>

      {championships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {`${ka.championship.noChampionships}`}
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
                      {ka.championship.status[c.status as keyof typeof ka.championship.status] || c.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">{c._count.teams}</span>
                      {" / "}{c.maxTeams} {ka.championship.teams}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{c._count.matches}</span> {ka.championship.matches}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{c._count.sponsors}</span> {ka.championship.sponsors}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {`მაქს. ${c.maxPlayersPerTeam} მოთამაშე გუნდში`}
                  </p>
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
                  )}
                  {session && registeredChampionshipIds.has(c.id) && (
                    <p className="text-xs mt-2 font-semibold text-green-600">
                      {ka.championship.yourChampionship}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

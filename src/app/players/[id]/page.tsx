import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareProfileButton } from "./share-profile-button";
import { ka, getPositionLabel } from "@/lib/ka";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      position: true,
      socialMediaLink: true,
      role: true,
    },
  });

  if (!user) notFound();

  // Matches played: count matches where user's team was home or away (both teams assigned)
  const memberships = await prisma.teamMember.findMany({
    where: { userId: id, status: { in: ["ACTIVE", "RESERVE"] } },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  const matchesPlayed = teamIds.length > 0
    ? await prisma.match.count({
        where: {
          AND: [
            { homeTeamId: { not: null } },
            { awayTeamId: { not: null } },
            {
              OR: [
                { homeTeamId: { in: teamIds } },
                { awayTeamId: { in: teamIds } },
              ],
            },
          ],
        },
      })
    : 0;

  // Goals and assists from MatchPlayerStat
  const stats = await prisma.matchPlayerStat.aggregate({
    where: { userId: id },
    _sum: { goals: true, assists: true },
  });
  const goals = stats._sum.goals ?? 0;
  const assists = stats._sum.assists ?? 0;

  // History: team memberships with team + championship
  const history = await prisma.teamMember.findMany({
    where: { userId: id },
    include: {
      team: {
        include: {
          championship: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl bg-green-700 px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{user.fullName}</h1>
            {user.position && (
              <Badge className="mt-2 bg-white/20 text-white border-0">
                {getPositionLabel(user.position)}
              </Badge>
            )}
          </div>
          <ShareProfileButton path={`/players/${user.id}`} />
        </div>
        {user.socialMediaLink && (
          <a
            href={user.socialMediaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-white/80 hover:text-white text-sm"
          >
            {ka.common.website} →
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ka.player.statistics}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold tabular-nums">{matchesPlayed}</p>
              <p className="text-sm text-muted-foreground mt-1">{ka.player.matchesPlayed}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold tabular-nums">{goals}</p>
              <p className="text-sm text-muted-foreground mt-1">{ka.player.goals}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold tabular-nums">{assists}</p>
              <p className="text-sm text-muted-foreground mt-1">{ka.player.assists}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ka.player.history}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">{ka.player.noHistory}</p>
          ) : (
            <ul className="space-y-3">
              {history.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <Link
                      href={`/teams/${m.teamId}`}
                      className="font-medium hover:underline"
                    >
                      {m.team.name}
                    </Link>
                    <span className="text-muted-foreground text-sm ml-2">·</span>
                    <Link
                      href={`/championships/${m.team.championship.id}`}
                      className="text-sm text-muted-foreground hover:underline ml-1"
                    >
                      {m.team.championship.name}
                    </Link>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {new Date(m.joinedAt).toLocaleDateString("ka-GE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

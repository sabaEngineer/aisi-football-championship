import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ka } from "@/lib/ka";
import { NominationsList } from "./nominations-list";
import { AddNominationForm } from "./add-nomination-form";

export const dynamic = "force-dynamic";

export default async function ChampionshipPrizesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [nominations, championshipSponsors, players, staff, teams, session] = await Promise.all([
    prisma.nomination.findMany({
      where: { championshipId: id },
      include: {
        sponsor: true,
        winner: {
          include: {
            user: { select: { id: true, fullName: true } },
            team: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.championshipSponsor.findMany({
      where: { championshipId: id },
      include: { sponsor: true },
    }),
    prisma.teamMember.findMany({
      where: { team: { championshipId: id }, status: { not: "LEFT" } },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
    prisma.user.findMany({
      where: { role: "STAFF" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.team.findMany({
      where: { championshipId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getSession(),
  ]);

  const sponsors = championshipSponsors.map((cs) => cs.sponsor);
  const uniquePlayers = Array.from(
    new Map(players.map((p) => [p.user.id, p.user])).values()
  );

  const isAdmin = session?.role === "ADMIN";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ka.nomination.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{ka.nomination.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {nominations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {ka.nomination.noNominations}
            {isAdmin && " " + ka.nomination.addNominationHint}
          </p>
        ) : (
          <NominationsList
            championshipId={id}
            nominations={nominations}
            players={uniquePlayers}
            staff={staff}
            teams={teams}
            sponsors={sponsors}
            isAdmin={isAdmin}
          />
        )}

        {isAdmin && (
          <AddNominationForm
            championshipId={id}
            sponsors={sponsors}
          />
        )}
      </CardContent>
    </Card>
  );
}

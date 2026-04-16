import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ChampionshipSettings } from "../championship-settings";
import { CharityAmountEditor } from "../charity-amount-editor";

export const dynamic = "force-dynamic";

export default async function ChampionshipSettingsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [championship, session, teamsWithPlayersCount, groupMatches, knockoutMatches] = await Promise.all([
    prisma.championship.findUnique({
      where: { id },
      include: {
        _count: { select: { teams: true, matches: true } },
      },
    }),
    getSession(),
    prisma.team.count({
      where: {
        championshipId: id,
        members: { some: { status: { not: "LEFT" } } },
      },
    }),
    prisma.match.findMany({
      where: { championshipId: id, groupNumber: { not: null } },
      select: { status: true },
    }),
    prisma.match.findFirst({
      where: { championshipId: id, groupNumber: null },
      select: { id: true },
    }),
  ]);

  if (!championship) notFound();
  if (session?.role !== "ADMIN") redirect(`/championships/${id}`);

  return (
    <div className="space-y-6">
      <CharityAmountEditor />
      <ChampionshipSettings
        championshipId={championship.id}
        championshipName={championship.name}
        championshipDescription={championship.description}
        currentMaxTeams={championship.maxTeams}
        currentMaxPlayersPerTeam={championship.maxPlayersPerTeam}
        currentMaxReservesPerTeam={championship.maxReservesPerTeam}
        currentStatus={championship.status}
        teamCount={teamsWithPlayersCount}
        hasMatches={championship._count.matches > 0}
        hasGroupStage={groupMatches.length > 0}
        groupsComplete={groupMatches.length > 0 && groupMatches.every((m) => m.status === "COMPLETED")}
        hasKnockout={knockoutMatches !== null}
      />
    </div>
  );
}

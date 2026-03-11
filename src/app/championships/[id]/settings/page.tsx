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

  const [championship, session] = await Promise.all([
    prisma.championship.findUnique({
      where: { id },
      include: {
        _count: { select: { teams: true, matches: true } },
      },
    }),
    getSession(),
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
        teamCount={championship._count.teams}
        hasMatches={championship._count.matches > 0}
      />
    </div>
  );
}

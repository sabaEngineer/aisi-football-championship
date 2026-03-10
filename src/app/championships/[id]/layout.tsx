import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { ChampionshipTabs } from "./championship-tabs";
import { ka } from "@/lib/ka";

export const dynamic = "force-dynamic";

const statusColor: Record<string, string> = {
  DRAFT: "bg-white/20 text-white",
  REGISTRATION: "bg-blue-400/30 text-blue-100",
  ACTIVE: "bg-emerald-400/30 text-emerald-100",
  COMPLETED: "bg-purple-400/30 text-purple-100",
  CANCELLED: "bg-red-400/30 text-red-100",
};

export default async function ChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [championship, session] = await Promise.all([
    prisma.championship.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, status: true, maxTeams: true, maxPlayersPerTeam: true },
    }),
    getSession(),
  ]);

  if (!championship) notFound();

  const isAdmin = session?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-green-700 px-6 py-6">
        <Link href="/championships" className="text-sm text-white/80 hover:text-white">
          {ka.championship.backToChampionships}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{championship.name}</h1>
            <p className="text-white/80 mt-0.5 text-sm">
              {`${championship.maxTeams} ${ka.championship.teams} · ${championship.maxPlayersPerTeam} მოთამაშე თითოეულში`}
            </p>
            {championship.description && (
              <p className="text-white/70 mt-2 text-sm max-w-2xl">{championship.description}</p>
            )}
          </div>
          <Badge className={statusColor[championship.status] || "bg-white/20 text-white"}>
            {ka.championship.status[championship.status as keyof typeof ka.championship.status] || championship.status}
          </Badge>
        </div>
      </div>

      <ChampionshipTabs championshipId={championship.id} isAdmin={isAdmin} />

      {children}
    </div>
  );
}

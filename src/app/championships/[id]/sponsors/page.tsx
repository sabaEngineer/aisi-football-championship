import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignSponsorForm } from "./assign-sponsor-form";

export const dynamic = "force-dynamic";

export default async function ChampionshipSponsorsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [championshipSponsors, session] = await Promise.all([
    prisma.championshipSponsor.findMany({
      where: { championshipId: id },
      include: { sponsor: true },
    }),
    getSession(),
  ]);

  const isAdmin = session?.role === "ADMIN";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsors ({championshipSponsors.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {championshipSponsors.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sponsors assigned.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {championshipSponsors.map((cs) => (
              <div key={cs.id} className="flex items-center gap-2 border rounded-lg px-4 py-3">
                <span className="font-medium">{cs.sponsor.name}</span>
                {cs.sponsor.website && (
                  <a
                    href={cs.sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    website
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && <AssignSponsorForm championshipId={id} />}
      </CardContent>
    </Card>
  );
}

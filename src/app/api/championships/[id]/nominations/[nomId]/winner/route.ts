import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";
import { z } from "zod";

type Params = { params: Promise<{ id: string; nomId: string }> };

const winnerSchema = z.object({
  winnerType: z.enum(["user", "team"]),
  winnerId: z.number().int().positive(),
});

// PATCH /api/championships/:id/nominations/:nomId/winner — assign winner (user = player/staff, team = whole team)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const { id: rawId, nomId: rawNomId } = await params;
    const championshipId = getIdParam({ id: rawId });
    const nomId = getIdParam({ id: rawNomId });
    if (!championshipId || !nomId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, winnerSchema);
    if (parsed.error) return parsed.error;

    const existing = await prisma.nomination.findUnique({ where: { id: nomId } });
    if (!existing || existing.championshipId !== championshipId)
      return error("Nomination not found", 404);

    const { winnerType, winnerId } = parsed.data;
    const userId = winnerType === "user" ? winnerId : null;
    const teamId = winnerType === "team" ? winnerId : null;

    if (winnerType === "team") {
      const team = await prisma.team.findUnique({ where: { id: winnerId } });
      if (!team || team.championshipId !== championshipId)
        return error("Team not found in this championship", 400);
    }

    await prisma.nominationWinner.upsert({
      where: { nominationId: nomId },
      create: {
        nominationId: nomId,
        userId,
        teamId,
      },
      update: { userId, teamId },
    });

    const nomination = await prisma.nomination.findUnique({
      where: { id: nomId },
      include: {
        sponsor: true,
        winner: {
          include: {
            user: { select: { id: true, fullName: true } },
            team: { select: { id: true, name: true } },
          },
        },
      },
    });
    return success(nomination);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

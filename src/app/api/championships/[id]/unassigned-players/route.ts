import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, error, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/championships/:id/unassigned-players
// Returns PLAYER-role users who are NOT in any team in this championship
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const championshipId = getIdParam({ id: rawId });
    if (!championshipId) return error("Invalid ID", 400);

    const assignedUserIds = await prisma.teamMember.findMany({
      where: {
        team: { championshipId },
        status: { not: "LEFT" },
      },
      select: { userId: true },
    });

    const assignedIds = assignedUserIds.map((m) => m.userId);

    const unassigned = await prisma.user.findMany({
      where: {
        role: "PLAYER",
        id: { notIn: assignedIds.length > 0 ? assignedIds : [-1] },
      },
      select: { id: true, fullName: true, position: true },
      orderBy: { fullName: "asc" },
    });

    return success(unassigned);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

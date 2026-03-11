import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { playerService } from "@/lib/services/player.service";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

const bodySchema = z.object({ memberId: z.number().int().positive() });

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const teamId = getIdParam({ id: rawId });
    if (!teamId) return error("Invalid ID", 400);

    const session = await getSession();
    if (!session) return error("Not authenticated", 401);

    const isAdmin = session.role === "ADMIN";
    let isCaptain = false;
    if (!isAdmin) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId: session.userId, teamId, role: "CAPTAIN", status: "ACTIVE" },
      });
      isCaptain = !!membership;
    }

    if (!isAdmin && !isCaptain) {
      return error("Only the team captain or admin can transfer captaincy", 403);
    }

    const parsed = await parseBody(request, bodySchema);
    if (parsed.error) return parsed.error;

    const member = await playerService.transferCaptaincy(teamId, parsed.data.memberId);
    return success(member);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

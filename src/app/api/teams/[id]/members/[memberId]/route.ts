import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { playerService } from "@/lib/services/player.service";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "RESERVE"]),
  swapWithMemberId: z.number().int().positive().optional(),
});

type Params = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId, memberId: rawMemberId } = await params;
    const teamId = getIdParam({ id: rawId });
    const memberId = getIdParam({ id: rawMemberId });
    if (!teamId || !memberId) return error("Invalid ID", 400);

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
      return error("Only the team captain or admin can move players between active and reserve", 403);
    }

    const parsed = await parseBody(request, updateStatusSchema);
    if (parsed.error) return parsed.error;

    const member = await playerService.updateMemberStatus(
      memberId,
      teamId,
      parsed.data.status,
      parsed.data.swapWithMemberId
    );
    return success(member);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

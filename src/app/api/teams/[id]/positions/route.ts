import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

const updatePositionsSchema = z.object({
  positions: z.array(
    z.object({
      memberId: z.number().int().positive(),
      position: z.string().min(1).max(20).optional(),
      x: z.number().min(0).max(100).optional(),
      y: z.number().min(0).max(100).optional(),
    })
  ),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
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
      return error("Only the team captain or admin can rearrange positions", 403);
    }

    const parsed = await parseBody(request, updatePositionsSchema);
    if (parsed.error) return parsed.error;

    const memberIds = parsed.data.positions.map((p) => p.memberId);
    const members = await prisma.teamMember.findMany({
      where: { id: { in: memberIds }, teamId, status: "ACTIVE" },
    });

    if (members.length !== memberIds.length) {
      return error("Some members do not belong to this team", 400);
    }

    await prisma.$transaction(
      parsed.data.positions.map((p) =>
        prisma.teamMember.update({
          where: { id: p.memberId },
          data: {
            ...(p.position !== undefined && { position: p.position }),
            ...(p.x !== undefined && { positionX: p.x }),
            ...(p.y !== undefined && { positionY: p.y }),
          },
        })
      )
    );

    return success({ updated: parsed.data.positions.length });
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

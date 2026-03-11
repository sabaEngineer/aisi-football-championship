import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string; memberId: string }> };

// PATCH — mark payment modal as shown (only the member themselves can do this)
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return error("Not authenticated", 401);

    const { id: rawTeamId, memberId: rawMemberId } = await params;
    const teamId = getIdParam({ id: rawTeamId });
    const memberId = getIdParam({ id: rawMemberId });
    if (!teamId || !memberId) return error("Invalid ID", 400);

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, teamId, status: { not: "LEFT" } },
    });
    if (!member) return error("Member not found", 404);
    if (member.userId !== session.userId) return error("Forbidden", 403);

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { paymentModalShownAt: new Date() },
    });
    return success({ ok: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

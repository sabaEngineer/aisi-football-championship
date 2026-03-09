import { NextRequest } from "next/server";
import { teamService } from "@/lib/services/team.service";
import { updateTeamSchema } from "@/lib/validations/team";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/teams/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const data = await teamService.findById(id);
    if (!data) return error("Team not found", 404);

    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// PATCH /api/teams/:id — admin or captain can update
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const session = await getSession();
    if (!session) return error("Not authenticated", 401);

    const isAdmin = session.role === "ADMIN";
    if (!isAdmin) {
      const captainRecord = await prisma.teamMember.findFirst({
        where: { teamId: id, userId: session.userId, role: "CAPTAIN", status: "ACTIVE" },
      });
      if (!captainRecord) return error("Only admin or team captain can update the team", 403);
    }

    const parsed = await parseBody(request, updateTeamSchema);
    if (parsed.error) return parsed.error;

    const data = await teamService.update(id, parsed.data);
    return success(data);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// DELETE /api/teams/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    await teamService.delete(id);
    return success({ deleted: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

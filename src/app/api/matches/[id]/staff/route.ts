import { NextRequest } from "next/server";
import { matchService } from "@/lib/services/match.service";
import { assignMatchStaffSchema } from "@/lib/validations/match";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// POST /api/matches/:id/staff — assign staff to a match
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const matchId = getIdParam({ id: rawId });
    if (!matchId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, assignMatchStaffSchema);
    if (parsed.error) return parsed.error;

    const result = await matchService.assignStaff(
      matchId,
      parsed.data.userId,
      parsed.data.role
    );
    return success(result, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

const removeStaffSchema = z.object({ userId: z.number().int().positive() });

// DELETE /api/matches/:id/staff — remove staff from a match
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const matchId = getIdParam({ id: rawId });
    if (!matchId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, removeStaffSchema);
    if (parsed.error) return parsed.error;

    await matchService.removeStaff(matchId, parsed.data.userId);
    return success({ removed: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

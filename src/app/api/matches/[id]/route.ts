import { NextRequest } from "next/server";
import { matchService } from "@/lib/services/match.service";
import { updateMatchSchema } from "@/lib/validations/match";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/matches/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const data = await matchService.findById(id);
    if (!data) return error("Match not found", 404);

    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// PATCH /api/matches/:id — update score / status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const parsed = await parseBody(request, updateMatchSchema);
    if (parsed.error) return parsed.error;

    const data = await matchService.update(id, parsed.data);
    return success(data);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// DELETE /api/matches/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    await matchService.delete(id);
    return success({ deleted: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { matchService } from "@/lib/services/match.service";
import { getSession } from "@/lib/auth";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  groupCount: z.number().int().min(1),
});

// POST /api/championships/:id/fixtures — group stage round-robin (admin chooses number of groups)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const parsed = await parseBody(request, bodySchema);
    if (parsed.error) return parsed.error;

    const result = await matchService.generateFixtures(id, parsed.data.groupCount);
    return success(result, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// DELETE /api/championships/:id/fixtures — remove all matches for this championship (admin)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const result = await matchService.clearChampionshipFixtures(id);
    return success(result);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

import { NextRequest } from "next/server";
import { playerService } from "@/lib/services/player.service";
import { leaveTeamSchema } from "@/lib/validations/player";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// POST /api/players/:id/leave — player leaves a team
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const userId = getIdParam({ id: rawId });
    if (!userId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, leaveTeamSchema);
    if (parsed.error) return parsed.error;

    const result = await playerService.leaveTeam(userId, parsed.data.teamId);
    return success(result);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

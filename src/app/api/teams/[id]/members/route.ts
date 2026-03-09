import { NextRequest } from "next/server";
import { playerService } from "@/lib/services/player.service";
import { registerPlayerSchema } from "@/lib/validations/player";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/teams/:id/members?status=ACTIVE|RESERVE|LEFT
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const teamId = getIdParam({ id: rawId });
    if (!teamId) return error("Invalid ID", 400);

    const status = request.nextUrl.searchParams.get("status") as
      | "ACTIVE"
      | "RESERVE"
      | "LEFT"
      | null;

    const data = await playerService.getTeamMembers(
      teamId,
      status || undefined
    );
    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// POST /api/teams/:id/members — register a player to this team
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const teamId = getIdParam({ id: rawId });
    if (!teamId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, registerPlayerSchema);
    if (parsed.error) return parsed.error;

    if (parsed.data.teamId !== teamId) {
      return error("Team ID in body must match URL parameter", 400);
    }

    const member = await playerService.register(parsed.data);
    return success(member, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

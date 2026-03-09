import { NextRequest } from "next/server";
import { teamService } from "@/lib/services/team.service";
import { createTeamSchema } from "@/lib/validations/team";
import { success, error, parseBody } from "@/lib/api-helpers";

// GET /api/teams?championshipId=1
export async function GET(request: NextRequest) {
  try {
    const championshipId = request.nextUrl.searchParams.get("championshipId");
    const data = await teamService.findAll(
      championshipId ? Number(championshipId) : undefined
    );
    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// POST /api/teams — create a team (admin only)
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createTeamSchema);
    if (parsed.error) return parsed.error;

    const team = await teamService.create(parsed.data);
    return success(team, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

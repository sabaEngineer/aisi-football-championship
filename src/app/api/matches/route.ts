import { NextRequest } from "next/server";
import { matchService } from "@/lib/services/match.service";
import { createMatchSchema } from "@/lib/validations/match";
import { success, error, parseBody } from "@/lib/api-helpers";

// GET /api/matches?championshipId=1
export async function GET(request: NextRequest) {
  try {
    const championshipId = request.nextUrl.searchParams.get("championshipId");
    const data = await matchService.findAll(
      championshipId ? Number(championshipId) : undefined
    );
    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// POST /api/matches — create a single match
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createMatchSchema);
    if (parsed.error) return parsed.error;

    const match = await matchService.create(parsed.data);
    return success(match, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

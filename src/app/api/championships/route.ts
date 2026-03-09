import { NextRequest } from "next/server";
import { championshipService } from "@/lib/services/championship.service";
import { createChampionshipSchema } from "@/lib/validations/championship";
import { success, error, parseBody } from "@/lib/api-helpers";

// GET /api/championships — list all championships
export async function GET() {
  try {
    const data = await championshipService.findAll();
    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// POST /api/championships — create a championship (admin only)
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createChampionshipSchema);
    if (parsed.error) return parsed.error;

    const championship = await championshipService.create(parsed.data);
    return success(championship, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

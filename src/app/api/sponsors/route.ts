import { NextRequest } from "next/server";
import { sponsorService } from "@/lib/services/sponsor.service";
import { createSponsorSchema } from "@/lib/validations/sponsor";
import { success, error, parseBody } from "@/lib/api-helpers";

// GET /api/sponsors
export async function GET() {
  try {
    const data = await sponsorService.findAll();
    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// POST /api/sponsors
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createSponsorSchema);
    if (parsed.error) return parsed.error;

    const sponsor = await sponsorService.create(parsed.data);
    return success(sponsor, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

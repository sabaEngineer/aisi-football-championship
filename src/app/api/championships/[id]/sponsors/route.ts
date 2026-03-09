import { NextRequest } from "next/server";
import { sponsorService } from "@/lib/services/sponsor.service";
import { assignSponsorSchema } from "@/lib/validations/sponsor";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// POST /api/championships/:id/sponsors — assign sponsor to championship
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const championshipId = getIdParam({ id: rawId });
    if (!championshipId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, assignSponsorSchema);
    if (parsed.error) return parsed.error;

    const result = await sponsorService.assignToChampionship(
      championshipId,
      parsed.data.sponsorId
    );
    return success(result, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

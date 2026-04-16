import { NextRequest } from "next/server";
import { matchService } from "@/lib/services/match.service";
import { success, error, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const result = await matchService.generateKnockout(id);
    return success(result, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

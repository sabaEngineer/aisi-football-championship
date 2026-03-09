import { NextRequest } from "next/server";
import { sponsorService } from "@/lib/services/sponsor.service";
import { updateSponsorSchema } from "@/lib/validations/sponsor";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/sponsors/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const data = await sponsorService.findById(id);
    if (!data) return error("Sponsor not found", 404);

    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// PATCH /api/sponsors/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const parsed = await parseBody(request, updateSponsorSchema);
    if (parsed.error) return parsed.error;

    const data = await sponsorService.update(id, parsed.data);
    return success(data);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// DELETE /api/sponsors/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    await sponsorService.delete(id);
    return success({ deleted: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

import { NextRequest } from "next/server";
import { championshipService } from "@/lib/services/championship.service";
import { updateChampionshipSchema } from "@/lib/validations/championship";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/championships/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const data = await championshipService.findById(id);
    if (!data) return error("Championship not found", 404);

    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// PATCH /api/championships/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const parsed = await parseBody(request, updateChampionshipSchema);
    if (parsed.error) return parsed.error;

    const data = await championshipService.update(id, parsed.data);
    return success(data);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// DELETE /api/championships/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    await championshipService.delete(id);
    return success({ deleted: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";
import { z } from "zod";

type Params = { params: Promise<{ id: string; nomId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  prize: z.string().max(500).optional().nullable(),
  sponsorId: z.number().int().positive().optional().nullable(),
});

// PATCH /api/championships/:id/nominations/:nomId
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const { id: rawId, nomId: rawNomId } = await params;
    const championshipId = getIdParam({ id: rawId });
    const nomId = getIdParam({ id: rawNomId });
    if (!championshipId || !nomId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, updateSchema);
    if (parsed.error) return parsed.error;

    const existing = await prisma.nomination.findUnique({ where: { id: nomId } });
    if (!existing || existing.championshipId !== championshipId)
      return error("Nomination not found", 404);

    const nomination = await prisma.nomination.update({
      where: { id: nomId },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.prize !== undefined && { prize: parsed.data.prize }),
        ...(parsed.data.sponsorId !== undefined && { sponsorId: parsed.data.sponsorId }),
      },
      include: { sponsor: true, winner: { include: { user: true } } },
    });
    return success(nomination);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// DELETE /api/championships/:id/nominations/:nomId
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const { id: rawId, nomId: rawNomId } = await params;
    const championshipId = getIdParam({ id: rawId });
    const nomId = getIdParam({ id: rawNomId });
    if (!championshipId || !nomId) return error("Invalid ID", 400);

    const existing = await prisma.nomination.findUnique({ where: { id: nomId } });
    if (!existing || existing.championshipId !== championshipId)
      return error("Nomination not found", 404);

    await prisma.nomination.delete({
      where: { id: nomId },
    });
    return success({ deleted: true });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

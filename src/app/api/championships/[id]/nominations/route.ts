import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(200),
  prize: z.string().max(500).optional(),
  sponsorId: z.number().int().positive().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: rawId } = await params;
    const championshipId = getIdParam({ id: rawId });
    if (!championshipId) return error("Invalid ID", 400);

    const nominations = await prisma.nomination.findMany({
      where: { championshipId },
      include: {
        sponsor: true,
        winner: {
          include: {
            user: { select: { id: true, fullName: true } },
            team: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return success(nominations);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const { id: rawId } = await params;
    const championshipId = getIdParam({ id: rawId });
    if (!championshipId) return error("Invalid ID", 400);

    const parsed = await parseBody(request, createSchema);
    if (parsed.error) return parsed.error;

    const nomination = await prisma.nomination.create({
      data: {
        championshipId,
        name: parsed.data.name,
        prize: parsed.data.prize ?? null,
        sponsorId: parsed.data.sponsorId ?? null,
      },
      include: { sponsor: true },
    });
    return success(nomination, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

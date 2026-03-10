import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody, getIdParam } from "@/lib/api-helpers";
import { z } from "zod";

const replySchema = z.object({ adminReply: z.string().min(1).max(2000) });

// PATCH /api/support/:id — admin replies
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const { id: rawId } = await params;
    const id = getIdParam({ id: rawId });
    if (!id) return error("Invalid ID", 400);

    const parsed = await parseBody(request, replySchema);
    if (parsed.error) return parsed.error;

    const msg = await prisma.supportMessage.update({
      where: { id },
      data: {
        adminReply: parsed.data.adminReply,
        repliedAt: new Date(),
        repliedBy: session.userId,
      },
      include: { user: { select: { fullName: true } } },
    });
    return success(msg);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

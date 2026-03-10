import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody } from "@/lib/api-helpers";
import { z } from "zod";

const sendSchema = z.object({ message: z.string().min(1).max(2000) });

// POST /api/support — user sends message to admin
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return error("Not authenticated", 401);

    const parsed = await parseBody(request, sendSchema);
    if (parsed.error) return parsed.error;

    const msg = await prisma.supportMessage.create({
      data: {
        userId: session.userId,
        message: parsed.data.message,
      },
      include: { user: { select: { fullName: true } } },
    });
    return success(msg);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

// GET /api/support — user gets their messages, admin gets all
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return error("Not authenticated", 401);

    if (session.role === "ADMIN") {
      const messages = await prisma.supportMessage.findMany({
        include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      });
      return success(messages);
    }

    const messages = await prisma.supportMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return success(messages);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

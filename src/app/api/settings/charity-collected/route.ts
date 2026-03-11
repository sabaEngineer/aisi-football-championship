import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { success, error, parseBody } from "@/lib/api-helpers";

const KEY = "charity_collected_amount";

// GET — anyone can read (for payment modal)
export async function GET() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
    const amount = row ? Number(row.value) || 0 : 0;
    return success({ amount });
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

const updateSchema = z.object({ amount: z.number().min(0) });

// PATCH — admin only
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return error("Admin only", 403);

    const parsed = await parseBody(request, updateSchema);
    if (parsed.error) return parsed.error;

    await prisma.appSetting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: String(parsed.data.amount) },
      update: { value: String(parsed.data.amount) },
    });
    return success({ amount: parsed.data.amount });
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

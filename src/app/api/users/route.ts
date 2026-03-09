import { NextRequest } from "next/server";
import { userService } from "@/lib/services/user.service";
import { createUserSchema } from "@/lib/validations/user";
import { success, error, parseBody } from "@/lib/api-helpers";

// GET /api/users?role=ADMIN|PLAYER|STAFF
export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") as
      | "ADMIN"
      | "PLAYER"
      | "STAFF"
      | null;

    const data = await userService.findAll(role || undefined);
    return success(data);
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

// POST /api/users — create a user
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createUserSchema);
    if (parsed.error) return parsed.error;

    const user = await userService.create(parsed.data);
    return success(user, 201);
  } catch (err) {
    return error((err as Error).message, 400);
  }
}

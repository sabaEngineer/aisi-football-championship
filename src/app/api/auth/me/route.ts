import { getSession } from "@/lib/auth";
import { success, error } from "@/lib/api-helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return error("Not authenticated", 401);
  return success(session);
}

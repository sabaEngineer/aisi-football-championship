import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function validationError(err: ZodError) {
  const messages = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
  return error(messages.join("; "), 422);
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const raw = await request.json();
    const data = schema.parse(raw);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      return { error: validationError(err) };
    }
    return { error: error("Invalid JSON body", 400) };
  }
}

export function getIdParam(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isNaN(id) ? null : id;
}

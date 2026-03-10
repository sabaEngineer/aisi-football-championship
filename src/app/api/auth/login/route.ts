import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { createToken, COOKIE_NAME } from "@/lib/auth";
import { parseBody, error } from "@/lib/api-helpers";
import { getPhoneLookupVariants } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, loginSchema);
    if (parsed.error) return parsed.error;

    const { phone, password } = parsed.data;
    const variants = getPhoneLookupVariants(phone);

    const user = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (!user) return error("Invalid phone number or password", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return error("Invalid phone number or password", 401);

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

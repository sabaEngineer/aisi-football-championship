import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { createToken, COOKIE_NAME } from "@/lib/auth";
import { parseBody, error, success } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, registerSchema);
    if (parsed.error) return parsed.error;

    const { fullName, phone, password, socialMediaLink } = parsed.data;

    // Check if phone already exists (try normalized and legacy formats)
    const { getPhoneLookupVariants } = await import("@/lib/phone");
    const variants = getPhoneLookupVariants(phone);
    const existing = await prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (existing) return error("A user with this phone number already exists", 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique email from phone (since email is unique in schema)
    const email = `${phone.replace(/[^0-9]/g, "")}@player.local`;

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email,
        password: hashedPassword,
        role: "PLAYER",
        socialMediaLink: socialMediaLink || null,
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    return error((err as Error).message, 500);
  }
}

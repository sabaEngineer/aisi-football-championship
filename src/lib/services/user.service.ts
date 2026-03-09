import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { CreateUserDto, UpdateUserDto } from "@/lib/validations/user";

export const userService = {
  async findAll(role?: "ADMIN" | "PLAYER" | "STAFF") {
    return prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { fullName: "asc" },
    });
  },

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        teamMemberships: {
          include: { team: { include: { championship: true } } },
          where: { status: { not: "LEFT" } },
        },
        matchStaff: {
          include: { match: { include: { homeTeam: true, awayTeam: true } } },
        },
      },
    });
  },

  async create(data: CreateUserDto) {
    const email = data.email || `staff_${crypto.randomBytes(6).toString("hex")}@staff.local`;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("A user with this email already exists");

    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    return prisma.user.create({
      data: {
        ...data,
        email,
        password: hashedPassword,
      },
    });
  },

  async update(id: number, data: UpdateUserDto) {
    return prisma.user.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.user.delete({ where: { id } });
  },
};

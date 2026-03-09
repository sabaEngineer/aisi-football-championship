import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["ADMIN", "PLAYER", "STAFF"]).default("PLAYER"),
  position: z.string().max(100).optional(),
  socialMediaLink: z.string().url().optional().or(z.literal("")),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional(),
  position: z.string().max(100).optional(),
  socialMediaLink: z.string().url().optional().or(z.literal("")),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

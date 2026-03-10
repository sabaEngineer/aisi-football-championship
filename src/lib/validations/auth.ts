import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(200),
  email: z.string().email("Valid email is required").toLowerCase(),
  phone: z.string().min(1, "Phone is required").transform((v) => v.trim()),
  password: z.string().min(6, "Password must be at least 6 characters"),
  socialMediaLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Phone is required").transform((v) => v.trim()),
  password: z.string().min(1, "Password is required"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

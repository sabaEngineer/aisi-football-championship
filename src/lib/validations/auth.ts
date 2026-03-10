import { z } from "zod";
import { isValidGeorgianPhone, normalizeGeorgianPhone } from "@/lib/phone";

const phoneRefine = (val: string) => isValidGeorgianPhone(val);
const phoneMessage = "შეიყვანე სწორი ქართული ნომერი (მაგ. +995 555 123 456)";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(200),
  phone: z
    .string()
    .min(9, phoneMessage)
    .refine(phoneRefine, phoneMessage)
    .transform(normalizeGeorgianPhone),
  password: z.string().min(6, "Password must be at least 6 characters"),
  socialMediaLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .min(9, phoneMessage)
    .refine(phoneRefine, phoneMessage)
    .transform(normalizeGeorgianPhone),
  password: z.string().min(1, "Password is required"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

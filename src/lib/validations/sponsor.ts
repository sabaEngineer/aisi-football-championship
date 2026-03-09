import { z } from "zod";

export const createSponsorSchema = z.object({
  name: z.string().min(1, "Sponsor name is required").max(200),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

export const updateSponsorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

export const assignSponsorSchema = z.object({
  sponsorId: z.number().int().positive(),
});

export type CreateSponsorDto = z.infer<typeof createSponsorSchema>;
export type UpdateSponsorDto = z.infer<typeof updateSponsorSchema>;
export type AssignSponsorDto = z.infer<typeof assignSponsorSchema>;

import { z } from "zod";

export const createMatchSchema = z.object({
  championshipId: z.number().int().positive(),
  homeTeamId: z.number().int().positive(),
  awayTeamId: z.number().int().positive(),
  round: z.number().int().positive().optional(),
  date: z.string().datetime().optional(),
});

export const updateMatchSchema = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"]).optional(),
  date: z.string().optional(),
  time: z.string().max(20).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  locationUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  description: z.string().max(1000).optional().nullable(),
});

export const generateFixturesSchema = z.object({
  championshipId: z.number().int().positive(),
});

export const assignMatchStaffSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().min(1, "Staff role is required").max(100),
});

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
export type UpdateMatchDto = z.infer<typeof updateMatchSchema>;
export type GenerateFixturesDto = z.infer<typeof generateFixturesSchema>;
export type AssignMatchStaffDto = z.infer<typeof assignMatchStaffSchema>;

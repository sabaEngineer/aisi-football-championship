import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(200),
  championshipId: z.number().int().positive(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export type CreateTeamDto = z.infer<typeof createTeamSchema>;
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;

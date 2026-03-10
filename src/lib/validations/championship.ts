import { z } from "zod";

export const createChampionshipSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(2000).optional()),
  maxTeams: z.number().int().min(2, "At least 2 teams required"),
  maxPlayersPerTeam: z.number().int().min(1, "At least 1 player per team"),
  maxReservesPerTeam: z.number().int().min(0).optional(),
});

export const updateChampionshipSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  maxTeams: z.number().int().min(2).optional(),
  maxPlayersPerTeam: z.number().int().min(1).optional(),
  maxReservesPerTeam: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "REGISTRATION", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreateChampionshipDto = z.infer<typeof createChampionshipSchema>;
export type UpdateChampionshipDto = z.infer<typeof updateChampionshipSchema>;

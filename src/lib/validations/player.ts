import { z } from "zod";

export const registerPlayerSchema = z.object({
  userId: z.number().int().positive(),
  teamId: z.number().int().positive(),
  position: z.string().max(100).optional(),
});

export const leaveTeamSchema = z.object({
  teamId: z.number().int().positive(),
});

export type RegisterPlayerDto = z.infer<typeof registerPlayerSchema>;
export type LeaveTeamDto = z.infer<typeof leaveTeamSchema>;

import { prisma } from "@/lib/db";
import type { CreateTeamDto, UpdateTeamDto } from "@/lib/validations/team";

export const teamService = {
  async findAll(championshipId?: number) {
    return prisma.team.findMany({
      where: championshipId ? { championshipId } : undefined,
      include: {
        championship: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: number) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        championship: true,
        members: {
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
  },

  async create(data: CreateTeamDto) {
    const championship = await prisma.championship.findUnique({
      where: { id: data.championshipId },
      include: { _count: { select: { teams: true } } },
    });

    if (!championship) throw new Error("Championship not found");
    if (championship._count.teams >= championship.maxTeams) {
      throw new Error(
        `Championship already has the maximum number of teams (${championship.maxTeams})`
      );
    }

    return prisma.team.create({
      data,
      include: { championship: { select: { id: true, name: true } } },
    });
  },

  async update(id: number, data: UpdateTeamDto) {
    return prisma.team.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.team.delete({ where: { id } });
  },

  async getActiveCount(teamId: number): Promise<number> {
    return prisma.teamMember.count({
      where: { teamId, status: "ACTIVE" },
    });
  },

  async getReserveCount(teamId: number): Promise<number> {
    return prisma.teamMember.count({
      where: { teamId, status: "RESERVE" },
    });
  },
};

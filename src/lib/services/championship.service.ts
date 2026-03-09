import { prisma } from "@/lib/db";
import type { CreateChampionshipDto, UpdateChampionshipDto } from "@/lib/validations/championship";

export const championshipService = {
  async findAll() {
    return prisma.championship.findMany({
      include: { _count: { select: { teams: true, matches: true, sponsors: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: number) {
    return prisma.championship.findUnique({
      where: { id },
      include: {
        teams: { include: { _count: { select: { members: true } } } },
        matches: { include: { homeTeam: true, awayTeam: true } },
        sponsors: { include: { sponsor: true } },
      },
    });
  },

  async create(data: CreateChampionshipDto) {
    return prisma.championship.create({ data });
  },

  async update(id: number, data: UpdateChampionshipDto) {
    return prisma.championship.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.championship.delete({ where: { id } });
  },
};

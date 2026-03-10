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
    const championship = await prisma.championship.create({ data });
    await prisma.team.createMany({
      data: Array.from({ length: data.maxTeams }, (_, i) => ({
        championshipId: championship.id,
        name: `გუნდი ${i + 1}`,
      })),
    });
    return prisma.championship.findUniqueOrThrow({
      where: { id: championship.id },
      include: { teams: true },
    });
  },

  async update(id: number, data: UpdateChampionshipDto) {
    return prisma.championship.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.championship.delete({ where: { id } });
  },
};

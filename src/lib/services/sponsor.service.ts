import { prisma } from "@/lib/db";
import type { CreateSponsorDto, UpdateSponsorDto } from "@/lib/validations/sponsor";

export const sponsorService = {
  async findAll() {
    return prisma.sponsor.findMany({
      include: { _count: { select: { championships: true } } },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: number) {
    return prisma.sponsor.findUnique({
      where: { id },
      include: { championships: { include: { championship: true } } },
    });
  },

  async create(data: CreateSponsorDto) {
    return prisma.sponsor.create({ data });
  },

  async update(id: number, data: UpdateSponsorDto) {
    return prisma.sponsor.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.sponsor.delete({ where: { id } });
  },

  async assignToChampionship(championshipId: number, sponsorId: number) {
    const existing = await prisma.championshipSponsor.findUnique({
      where: { championshipId_sponsorId: { championshipId, sponsorId } },
    });
    if (existing) throw new Error("Sponsor is already assigned to this championship");

    return prisma.championshipSponsor.create({
      data: { championshipId, sponsorId },
      include: { sponsor: true, championship: true },
    });
  },

  async removeFromChampionship(championshipId: number, sponsorId: number) {
    return prisma.championshipSponsor.delete({
      where: { championshipId_sponsorId: { championshipId, sponsorId } },
    });
  },
};

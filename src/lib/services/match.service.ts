import { prisma } from "@/lib/db";
import type { CreateMatchDto, UpdateMatchDto } from "@/lib/validations/match";

export const matchService = {
  async findAll(championshipId?: number) {
    return prisma.match.findMany({
      where: championshipId ? { championshipId } : undefined,
      include: {
        homeTeam: true,
        awayTeam: true,
        staff: { include: { user: true } },
      },
      orderBy: [{ round: "asc" }, { date: "asc" }],
    });
  },

  async findById(id: number) {
    return prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { include: { members: { where: { status: "ACTIVE" }, include: { user: true } } } },
        awayTeam: { include: { members: { where: { status: "ACTIVE" }, include: { user: true } } } },
        staff: { include: { user: true } },
        championship: true,
      },
    });
  },

  async create(data: CreateMatchDto) {
    if (data.homeTeamId === data.awayTeamId) {
      throw new Error("A team cannot play against itself");
    }

    return prisma.match.create({
      data: {
        championshipId: data.championshipId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        round: data.round,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: { homeTeam: true, awayTeam: true },
    });
  },

  async update(id: number, data: UpdateMatchDto) {
    const { date, ...rest } = data;
    const updated = await prisma.match.update({
      where: { id },
      data: {
        ...rest,
        ...(date !== undefined && { date: date ? new Date(date) : null }),
      },
      include: { homeTeam: true, awayTeam: true },
    });

    if (updated.status === "COMPLETED") {
      await this.resolveMatchResult(id);
    }

    return updated;
  },

  async delete(id: number) {
    return prisma.match.delete({ where: { id } });
  },

  /**
   * Generate knockout tournament bracket for a championship.
   * Randomly seeds teams, creates all rounds up to the final.
   * If team count isn't a power of 2, some teams get first-round byes.
   */
  async generateFixtures(championshipId: number) {
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: { teams: true },
    });
    if (!championship) throw new Error("Championship not found");

    const teams = championship.teams;
    if (teams.length < 2) throw new Error("Need at least 2 teams to generate fixtures");

    await prisma.match.deleteMany({ where: { championshipId } });

    const n = teams.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const totalRounds = Math.log2(bracketSize);

    // Shuffle teams randomly for seeding
    const shuffled = [...teams].sort(() => Math.random() - 0.5);

    // Place teams into bracket slots; remaining slots are byes (null)
    const seeds: (number | null)[] = Array(bracketSize).fill(null);
    for (let i = 0; i < shuffled.length; i++) {
      seeds[i] = shuffled[i].id;
    }

    // Create all matches for all rounds
    const matchMap: { round: number; position: number; matchId?: number }[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let pos = 1; pos <= matchesInRound; pos++) {
        matchMap.push({ round, position: pos });
      }
    }

    // Create match records in DB
    const createdMatches = [];
    for (const m of matchMap) {
      const created = await prisma.match.create({
        data: {
          championshipId,
          round: m.round,
          bracketPosition: m.position,
          homeTeamId: null,
          awayTeamId: null,
          status: "SCHEDULED",
        },
      });
      createdMatches.push({ ...m, matchId: created.id });
    }

    // Fill round 1 matches with seeded teams and resolve byes
    const round1 = createdMatches.filter((m) => m.round === 1);
    for (const match of round1) {
      const idx = (match.position - 1) * 2;
      const homeTeamId = seeds[idx] ?? null;
      const awayTeamId = seeds[idx + 1] ?? null;

      const isBye = homeTeamId === null || awayTeamId === null;
      const byeWinner = homeTeamId ?? awayTeamId;

      await prisma.match.update({
        where: { id: match.matchId },
        data: {
          homeTeamId,
          awayTeamId,
          winnerId: isBye ? byeWinner : null,
          status: isBye ? "COMPLETED" : "SCHEDULED",
        },
      });

      // If bye, advance winner to next round
      if (isBye && byeWinner !== null) {
        await this.advanceWinner(createdMatches, match.round, match.position, byeWinner);
      }
    }

    return { count: createdMatches.length, rounds: totalRounds };
  },

  /**
   * Advance a winning team to the next round's match slot.
   */
  async advanceWinner(
    allMatches: { round: number; position: number; matchId: number }[],
    currentRound: number,
    currentPosition: number,
    winnerId: number,
  ) {
    const nextRound = currentRound + 1;
    const nextPosition = Math.ceil(currentPosition / 2);
    const nextMatch = allMatches.find(
      (m) => m.round === nextRound && m.position === nextPosition,
    );
    if (!nextMatch) return;

    const isTopSlot = currentPosition % 2 === 1;
    await prisma.match.update({
      where: { id: nextMatch.matchId },
      data: isTopSlot ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
    });
  },

  /**
   * After updating a match score/status, check if it's completed
   * and advance the winner to the next bracket match.
   */
  async resolveMatchResult(matchId: number) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== "COMPLETED" || match.winnerId) return;
    if (match.homeTeamId === null || match.awayTeamId === null) return;

    const winnerId =
      match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;

    await prisma.match.update({
      where: { id: matchId },
      data: { winnerId },
    });

    // Find all matches in this championship to locate the next bracket slot
    const allMatches = await prisma.match.findMany({
      where: { championshipId: match.championshipId },
      select: { id: true, round: true, bracketPosition: true },
    });

    const mapped = allMatches.map((m) => ({
      round: m.round!,
      position: m.bracketPosition!,
      matchId: m.id,
    }));

    await this.advanceWinner(mapped, match.round!, match.bracketPosition!, winnerId);
  },

  async assignStaff(matchId: number, userId: number, role: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.role !== "STAFF") throw new Error("Only users with STAFF role can be assigned");

    const existing = await prisma.matchStaff.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (existing) throw new Error("Staff member is already assigned to this match");

    return prisma.matchStaff.create({
      data: { matchId, userId, role },
      include: { user: true },
    });
  },

  async removeStaff(matchId: number, userId: number) {
    return prisma.matchStaff.delete({
      where: { matchId_userId: { matchId, userId } },
    });
  },
};

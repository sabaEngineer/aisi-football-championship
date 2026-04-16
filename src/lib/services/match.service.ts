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

  /** Remove all matches (ბადე) for a championship. Does not touch teams or users. */
  async clearChampionshipFixtures(championshipId: number) {
    const deleted = await prisma.match.deleteMany({ where: { championshipId } });
    return { deleted: deleted.count };
  },

  /**
   * Group stage: admin picks number of groups. Teams are split randomly into equal groups.
   * Within each group, round-robin (every pair plays once). Points decide standings; no auto knockout from this step.
   */
  async generateFixtures(championshipId: number, groupCount: number) {
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        teams: {
          where: { members: { some: { status: { not: "LEFT" } } } },
        },
      },
    });
    if (!championship) throw new Error("Championship not found");

    const teams = championship.teams;
    if (teams.length < 2) {
      throw new Error("Need at least 2 teams with players to generate fixtures");
    }
    if (groupCount < 1) throw new Error("Need at least 1 group");
    if (teams.length % groupCount !== 0) {
      throw new Error(
        `Team count (${teams.length}) must be divisible by number of groups (${groupCount})`
      );
    }

    const teamsPerGroup = teams.length / groupCount;
    if (teamsPerGroup < 2) throw new Error("Each group needs at least 2 teams");

    await prisma.match.deleteMany({ where: { championshipId } });

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    let position = 1;
    let totalCreated = 0;

    for (let g = 1; g <= groupCount; g++) {
      const start = (g - 1) * teamsPerGroup;
      const groupTeams = shuffled.slice(start, start + teamsPerGroup);

      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const homeFirst = Math.random() < 0.5;
          const homeTeamId = homeFirst ? groupTeams[i].id : groupTeams[j].id;
          const awayTeamId = homeFirst ? groupTeams[j].id : groupTeams[i].id;

          await prisma.match.create({
            data: {
              championshipId,
              round: 1,
              bracketPosition: position++,
              groupNumber: g,
              homeTeamId,
              awayTeamId,
              status: "SCHEDULED",
            },
          });
          totalCreated++;
        }
      }
    }

    return {
      count: totalCreated,
      rounds: 1,
      groupCount,
      teamsPerGroup,
    };
  },

  /**
   * After group stage is complete, generate a single-elimination knockout bracket
   * from the top team of each group (by points → goal diff → goals scored).
   * If group winners are not a power of 2, higher-seeded teams get BYEs.
   */
  async generateKnockout(championshipId: number) {
    const groupMatches = await prisma.match.findMany({
      where: { championshipId, groupNumber: { not: null } },
    });
    if (groupMatches.length === 0) {
      throw new Error("No group stage matches found");
    }
    const incomplete = groupMatches.filter((m) => m.status !== "COMPLETED");
    if (incomplete.length > 0) {
      throw new Error(
        `${incomplete.length} group match(es) not completed yet`
      );
    }

    const existingKnockout = await prisma.match.findFirst({
      where: { championshipId, groupNumber: null },
    });
    if (existingKnockout) {
      await prisma.match.deleteMany({
        where: { championshipId, groupNumber: null },
      });
    }

    type Standing = {
      teamId: number;
      group: number;
      points: number;
      goalDiff: number;
      goalsFor: number;
    };
    const map = new Map<number, Standing>();

    for (const m of groupMatches) {
      if (!m.homeTeamId || !m.awayTeamId) continue;
      for (const tid of [m.homeTeamId, m.awayTeamId]) {
        if (!map.has(tid)) {
          map.set(tid, { teamId: tid, group: m.groupNumber!, points: 0, goalDiff: 0, goalsFor: 0 });
        }
      }
      const home = map.get(m.homeTeamId)!;
      const away = map.get(m.awayTeamId)!;
      home.goalsFor += m.homeScore;
      home.goalDiff += m.homeScore - m.awayScore;
      away.goalsFor += m.awayScore;
      away.goalDiff += m.awayScore - m.homeScore;
      if (m.homeScore > m.awayScore) {
        home.points += 3;
      } else if (m.homeScore < m.awayScore) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    }

    const groups = new Map<number, Standing[]>();
    for (const s of map.values()) {
      if (!groups.has(s.group)) groups.set(s.group, []);
      groups.get(s.group)!.push(s);
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
    }

    const groupWinners = [...groups.keys()]
      .sort((a, b) => a - b)
      .map((g) => groups.get(g)![0]);

    const n = groupWinners.length;
    if (n < 2) throw new Error("Need at least 2 group winners for knockout");

    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    const seeds: (number | null)[] = Array(bracketSize).fill(null);
    for (let i = 0; i < n; i++) {
      seeds[i] = groupWinners[i].teamId;
    }

    let totalCreated = 0;

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        const homeTeamId =
          round === 1 ? seeds[i * 2] ?? null : null;
        const awayTeamId =
          round === 1 ? seeds[i * 2 + 1] ?? null : null;

        const isBye =
          round === 1 &&
          ((homeTeamId !== null && awayTeamId === null) ||
            (homeTeamId === null && awayTeamId !== null));

        await prisma.match.create({
          data: {
            championshipId,
            round,
            bracketPosition: i + 1,
            groupNumber: null,
            homeTeamId,
            awayTeamId,
            status: isBye ? "COMPLETED" : "SCHEDULED",
            winnerId: isBye ? (homeTeamId ?? awayTeamId) : null,
          },
        });
        totalCreated++;
      }
    }

    const allKnockout = await prisma.match.findMany({
      where: { championshipId, groupNumber: null },
      select: { id: true, round: true, bracketPosition: true, winnerId: true },
    });
    const mapped = allKnockout.map((m) => ({
      round: m.round!,
      position: m.bracketPosition!,
      matchId: m.id,
    }));
    for (const m of allKnockout) {
      if (m.winnerId) {
        await this.advanceWinner(mapped, m.round!, m.bracketPosition!, m.winnerId);
      }
    }

    return { count: totalCreated, rounds: totalRounds, bracketSize };
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
    if (!match || match.status !== "COMPLETED") return;
    if (match.homeTeamId === null || match.awayTeamId === null) return;

    // Group stage: record winner for standings; draws allowed; no bracket advance
    if (match.groupNumber !== null) {
      const draw = match.homeScore === match.awayScore;
      await prisma.match.update({
        where: { id: matchId },
        data: {
          winnerId: draw
            ? null
            : match.homeScore > match.awayScore
              ? match.homeTeamId
              : match.awayTeamId,
        },
      });
      return;
    }

    if (match.winnerId) return;

    const winnerId =
      match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;

    await prisma.match.update({
      where: { id: matchId },
      data: { winnerId },
    });

    const allMatches = await prisma.match.findMany({
      where: { championshipId: match.championshipId, groupNumber: null },
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

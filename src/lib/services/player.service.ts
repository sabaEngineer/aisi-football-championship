import { prisma } from "@/lib/db";
import type { RegisterPlayerDto } from "@/lib/validations/player";

export const playerService = {
  /**
   * Register a player to a team.
   *
   * Business rules:
   * - Player cannot join multiple teams in the same championship.
   * - If team active slots < maxPlayersPerTeam → status = ACTIVE.
   * - If team is full → status = RESERVE.
   * - First active player in a team automatically becomes CAPTAIN.
   */
  async register(dto: RegisterPlayerDto) {
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new Error("User not found");
    if (user.role !== "PLAYER") throw new Error("Only users with PLAYER role can register");

    const team = await prisma.team.findUnique({
      where: { id: dto.teamId },
      include: { championship: true },
    });
    if (!team) throw new Error("Team not found");

    // Check if player already has a membership for this team
    const existingMembership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: dto.userId, teamId: dto.teamId } },
    });

    if (existingMembership && existingMembership.status !== "LEFT") {
      throw new Error("Player is already a member of this team");
    }

    // Check if player is already in another team in the same championship
    const otherTeamMembership = await prisma.teamMember.findFirst({
      where: {
        userId: dto.userId,
        status: { not: "LEFT" },
        team: { championshipId: team.championshipId },
      },
    });
    if (otherTeamMembership) {
      throw new Error("Player is already registered in another team in this championship");
    }

    const [activeCount, reserveCount] = await Promise.all([
      prisma.teamMember.count({ where: { teamId: dto.teamId, status: "ACTIVE" } }),
      prisma.teamMember.count({ where: { teamId: dto.teamId, status: "RESERVE" } }),
    ]);
    const isFull = activeCount >= team.championship.maxPlayersPerTeam;
    const isFirstActive = activeCount === 0 && !isFull;

    if (isFull && reserveCount >= team.championship.maxReservesPerTeam) {
      throw new Error(`Reserve list is full (max ${team.championship.maxReservesPerTeam} reserves per team)`);
    }

    const newData = {
      position: dto.position,
      status: isFull ? "RESERVE" as const : "ACTIVE" as const,
      role: isFirstActive ? "CAPTAIN" as const : "PLAYER" as const,
      joinedAt: new Date(),
      leftAt: null,
      positionX: null,
      positionY: null,
    };

    // If a stale LEFT record exists, delete it first to avoid unique constraint issues
    if (existingMembership) {
      await prisma.teamMember.delete({ where: { id: existingMembership.id } });
    }

    return prisma.teamMember.create({
      data: {
        userId: dto.userId,
        teamId: dto.teamId,
        ...newData,
      },
      include: { user: true, team: true },
    });
  },

  /**
   * Player leaves a team.
   *
   * Business rules:
   * - Mark member as LEFT, set leftAt timestamp.
   * - If the leaving player was CAPTAIN, assign captaincy to the
   *   longest-serving active member.
   * - If an active player leaves and reserves exist, promote one
   *   reserve player at random.
   */
  async leaveTeam(userId: number, teamId: number) {
    const member = await prisma.teamMember.findFirst({
      where: { userId, teamId, status: { not: "LEFT" } },
    });
    if (!member) throw new Error("Player is not an active/reserve member of this team");

    const wasCaptain = member.role === "CAPTAIN";
    const wasActive = member.status === "ACTIVE";

    // Delete the membership entirely so the player becomes fully unassigned
    await prisma.teamMember.delete({ where: { id: member.id } });

    // If the player was active, try to promote a reserve
    let promotedMember = null;
    if (wasActive) {
      promotedMember = await this.promoteRandomReserve(teamId);
    }

    // If the leaving player was captain, assign new captain
    if (wasCaptain) {
      await this.assignNewCaptain(teamId);
    }

    return { removedUserId: userId, promotedMember };
  },

  /**
   * Randomly select one reserve player from the team and promote
   * them to ACTIVE status.
   */
  async promoteRandomReserve(teamId: number) {
    const reserves = await prisma.teamMember.findMany({
      where: { teamId, status: "RESERVE" },
    });
    if (reserves.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * reserves.length);
    const chosen = reserves[randomIndex];

    return prisma.teamMember.update({
      where: { id: chosen.id },
      data: { status: "ACTIVE" },
      include: { user: true },
    });
  },

  /**
   * Assign captaincy to the longest-serving active member.
   * If no active members exist, no captain is assigned.
   */
  async assignNewCaptain(teamId: number) {
    // First clear any existing captain flag
    await prisma.teamMember.updateMany({
      where: { teamId, role: "CAPTAIN", status: "ACTIVE" },
      data: { role: "PLAYER" },
    });

    // Find the longest-serving active member
    const eldest = await prisma.teamMember.findFirst({
      where: { teamId, status: "ACTIVE" },
      orderBy: { joinedAt: "asc" },
    });

    if (eldest) {
      await prisma.teamMember.update({
        where: { id: eldest.id },
        data: { role: "CAPTAIN" },
      });
    }

    return eldest;
  },

  async getTeamMembers(teamId: number, status?: "ACTIVE" | "RESERVE" | "LEFT") {
    return prisma.teamMember.findMany({
      where: { teamId, ...(status ? { status } : {}) },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });
  },
};

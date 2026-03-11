import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FootballPitch, type PitchPlayer } from "@/components/football-pitch";
import { AddReserveButton } from "./add-reserve-button";
import { LeaveTeamButton } from "./leave-team-button";
import { MoveStatusButton } from "./move-status-button";
import { EditTeamName } from "./edit-team-name";
import { PositionSelect } from "@/components/position-select";
import { Crown } from "lucide-react";
import { ka } from "@/lib/ka";
import { PaymentModalTrigger } from "@/components/payment-modal-trigger";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (isNaN(id)) notFound();

  const [team, session] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      include: {
        championship: true,
        members: {
          include: { user: true },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    getSession(),
  ]);

  if (!team) notFound();

  const isAdmin = session?.role === "ADMIN";
  const active = team.members.filter((m) => m.status === "ACTIVE");
  const reserve = team.members.filter((m) => m.status === "RESERVE");

  // Check if the current user is captain of this team
  const isCaptain = session
    ? active.some((m) => m.userId === session.userId && m.role === "CAPTAIN")
    : false;

  // Check if the current user already has a team in this championship
  let currentUserHasTeam = false;
  if (session) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: session.userId,
        status: { not: "LEFT" },
        team: { championshipId: team.championshipId },
      },
    });
    currentUserHasTeam = !!membership;
  }

  const pitchPlayers: PitchPlayer[] = team.members
    .filter((m) => m.status === "ACTIVE" || m.status === "RESERVE")
    .map((m) => ({
      id: m.id,
      userId: m.userId,
      fullName: m.user.fullName,
      position: m.position || m.user.position,
      positionX: m.positionX,
      positionY: m.positionY,
      role: m.role,
      status: m.status as "ACTIVE" | "RESERVE",
    }));

  const teamNeedsPlayers = active.length < team.championship.maxPlayersPerTeam ||
    (active.length >= team.championship.maxPlayersPerTeam && reserve.length < team.championship.maxReservesPerTeam);
  const showJoinHint = session?.role === "PLAYER" && !currentUserHasTeam && teamNeedsPlayers;

  return (
    <div className="space-y-8">
      <PaymentModalTrigger />
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/championships/${team.championshipId}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {team.championship.name}
          </Link>
          {(isAdmin || isCaptain) ? (
            <EditTeamName teamId={team.id} currentName={team.name} />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          )}
          <p className="text-muted-foreground mt-1">
            {active.length} / {team.championship.maxPlayersPerTeam} {ka.team.playersLabel}
            {reserve.length > 0 && ` · ${reserve.length} / ${team.championship.maxReservesPerTeam} ${ka.team.reservesLabel}`}
          </p>
        </div>
      </div>

      {showJoinHint && (
        <div className="text-sm text-foreground">
          {ka.team.joinHint}
        </div>
      )}

      {/* Reserve Bench + Football Pitch — bench above stadium */}
      <div className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-xl">
        {reserve.length > 0 && (
          <div className="bg-slate-800/95 border-b border-slate-600/50 px-4 py-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">
              {ka.team.reserveBench.replace("{n}", String(reserve.length)).replace("{max}", String(team.championship.maxReservesPerTeam))}
            </span>
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              {reserve.map((m) => (
                <Link
                  key={m.id}
                  href={`/players/${m.userId}`}
                  className="flex items-center gap-1.5 rounded-full bg-slate-700/80 hover:bg-slate-600 px-2.5 py-1 text-sm text-white transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {m.user.fullName.charAt(0)}
                  </span>
                  <span className="font-medium">{m.user.fullName}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <FootballPitch
        teamId={team.id}
        teamName={team.name}
        championshipId={team.championshipId}
        maxPlayers={team.championship.maxPlayersPerTeam}
        players={pitchPlayers}
        isAdmin={isAdmin}
        isCaptain={isCaptain}
        currentUserId={session?.userId ?? null}
        currentUserRole={session?.role ?? null}
        currentUserHasTeam={currentUserHasTeam}
        hasBenchAbove={reserve.length > 0}
      />
      </div>

      {/* Add Reserve button — when team active is full and reserves have room (so new joiners go to reserve) */}
      {(isAdmin || (session?.role === "PLAYER" && !currentUserHasTeam)) &&
        active.length >= team.championship.maxPlayersPerTeam &&
        reserve.length < team.championship.maxReservesPerTeam && (
        <AddReserveButton
          teamId={team.id}
          championshipId={team.championshipId}
          isAdmin={isAdmin}
          canPlayerJoin={session?.role === "PLAYER" && !currentUserHasTeam}
          currentUserId={session?.userId ?? null}
          reserveCount={reserve.length}
          maxReserves={team.championship.maxReservesPerTeam}
        />
      )}

      {/* Squad List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {`${ka.team.squadList.replace("{n}", String(active.length)).replace("{max}", String(team.championship.maxPlayersPerTeam))}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-muted-foreground text-sm">{ka.team.noPlayersYet}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.team.player}</TableHead>
                  <TableHead>{ka.team.position}</TableHead>
                  <TableHead>{ka.team.role}</TableHead>
                  <TableHead>{ka.team.joined}</TableHead>
                  {(isAdmin || isCaptain) && <TableHead></TableHead>}
                  {isAdmin && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/players/${m.userId}`} className="hover:underline">
                        {m.user.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PositionSelect
                        memberId={m.id}
                        teamId={team.id}
                        currentPosition={m.position}
                        disabled={!isAdmin && !isCaptain}
                      />
                    </TableCell>
                    <TableCell>
                      {m.role === "CAPTAIN" ? (
                        <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                          <Crown className="h-3 w-3" />
                          {ka.team.captain}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{ka.team.player}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {(isAdmin || isCaptain) && (
                      <TableCell>
                        <MoveStatusButton
                          memberId={m.id}
                          teamId={team.id}
                          currentStatus="ACTIVE"
                          canMoveToReserve={m.role !== "CAPTAIN" && reserve.length < team.championship.maxReservesPerTeam}
                          canMoveToActive={false}
                          swapPartnersForReserve={
                            m.role !== "CAPTAIN" && reserve.length >= team.championship.maxReservesPerTeam
                              ? reserve.map((r) => ({ id: r.id, fullName: r.user.fullName }))
                              : []
                          }
                        />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <LeaveTeamButton userId={m.userId} teamId={team.id} playerName={m.user.fullName} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reserve Bench */}
      {reserve.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{`${ka.team.reserveBench.replace("{n}", String(reserve.length)).replace("{max}", String(team.championship.maxReservesPerTeam))}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ka.team.player}</TableHead>
                  <TableHead>{ka.team.position}</TableHead>
                  <TableHead>{ka.team.joined}</TableHead>
                  {(isAdmin || isCaptain) && <TableHead></TableHead>}
                  {isAdmin && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reserve.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/players/${m.userId}`} className="hover:underline">
                        {m.user.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PositionSelect
                        memberId={m.id}
                        teamId={team.id}
                        currentPosition={m.position}
                        disabled={!isAdmin && !isCaptain}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {(isAdmin || isCaptain) && (
                      <TableCell>
                        <MoveStatusButton
                          memberId={m.id}
                          teamId={team.id}
                          currentStatus="RESERVE"
                          canMoveToReserve={false}
                          canMoveToActive={active.length < team.championship.maxPlayersPerTeam}
                          swapPartnersForActive={
                            active.length >= team.championship.maxPlayersPerTeam
                              ? active.filter((a) => a.role !== "CAPTAIN").map((a) => ({ id: a.id, fullName: a.user.fullName }))
                              : []
                          }
                        />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <LeaveTeamButton userId={m.userId} teamId={team.id} playerName={m.user.fullName} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

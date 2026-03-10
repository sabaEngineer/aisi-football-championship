"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus, User, Crown, GripVertical } from "lucide-react";
import { AddToSlotDialog } from "./add-to-slot-dialog";
import { ka, getPositionLabel } from "@/lib/ka";

// Landscape pitch: our goal on LEFT, opponent's goal on RIGHT.
// SVG viewBox 105×68, container aspect-ratio matches exactly.
// Coordinates are percentages of the container (0–100).
const FORMATION_SLOTS: { position: string; x: number; y: number }[] = [
  { position: "GK", x: 6,  y: 50 },
  { position: "LB", x: 22, y: 10 },
  { position: "CB", x: 20, y: 36 },
  { position: "CB", x: 20, y: 64 },
  { position: "RB", x: 22, y: 90 },
  { position: "CDM", x: 42, y: 50 },
  { position: "CM", x: 56, y: 28 },
  { position: "CM", x: 56, y: 72 },
  { position: "LW", x: 78, y: 10 },
  { position: "ST", x: 88, y: 50 },
  { position: "RW", x: 78, y: 90 },
];

function getSlotsForTeamSize(maxPlayers: number) {
  if (maxPlayers >= 11) return FORMATION_SLOTS.slice(0, maxPlayers);

  const smallFormations: Record<number, string[]> = {
    1: ["GK"],
    2: ["GK", "ST"],
    3: ["GK", "CB", "ST"],
    4: ["GK", "CB", "CM", "ST"],
    5: ["GK", "CB", "CB", "CM", "ST"],
    6: ["GK", "LB", "CB", "RB", "CM", "ST"],
    7: ["GK", "LB", "CB", "RB", "CM", "LW", "ST"],
    8: ["GK", "LB", "CB", "RB", "CDM", "CM", "LW", "ST"],
    9: ["GK", "LB", "CB", "RB", "CDM", "CM", "LW", "RW", "ST"],
    10: ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "LW", "RW", "ST"],
  };

  const positions = smallFormations[maxPlayers] || FORMATION_SLOTS.slice(0, maxPlayers).map((s) => s.position);
  const usedCounts: Record<string, number> = {};

  return positions.map((pos) => {
    usedCounts[pos] = usedCounts[pos] || 0;
    const matching = FORMATION_SLOTS.filter((s) => s.position === pos);
    const slot = matching[usedCounts[pos]] || matching[0];
    usedCounts[pos]++;
    return { ...slot };
  });
}

export interface PitchPlayer {
  id: number;
  userId: number;
  fullName: string;
  position: string | null;
  positionX: number | null;
  positionY: number | null;
  role: "CAPTAIN" | "PLAYER";
  status: "ACTIVE" | "RESERVE";
}

interface Props {
  teamId: number;
  teamName: string;
  championshipId: number;
  maxPlayers: number;
  players: PitchPlayer[];
  isAdmin: boolean;
  isCaptain: boolean;
  currentUserId: number | null;
  currentUserRole: string | null;
  currentUserHasTeam: boolean;
  hasBenchAbove?: boolean;
}

export function FootballPitch({
  teamId,
  teamName,
  championshipId,
  maxPlayers,
  players,
  isAdmin,
  isCaptain,
  currentUserId,
  currentUserRole,
  currentUserHasTeam,
  hasBenchAbove = false,
}: Props) {
  const router = useRouter();
  const pitchRef = useRef<HTMLDivElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ position: string; index: number } | null>(null);
  const [dragPlayerId, setDragPlayerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canRearrange = isAdmin || isCaptain;
  const slots = getSlotsForTeamSize(maxPlayers);

  // Build the list of rendered player positions
  const activePlayers = players.filter((p) => p.status === "ACTIVE");

  // For players WITH custom coordinates, render at those coordinates.
  // For players WITHOUT custom coordinates, assign to formation slots.
  const playersWithCoords = activePlayers.filter((p) => p.positionX != null && p.positionY != null);
  const playersWithoutCoords = activePlayers.filter((p) => p.positionX == null || p.positionY == null);

  // Assign slot positions to players that don't have custom coords
  const slotAssignments: (PitchPlayer | null)[] = slots.map(() => null);
  const assignedPlayerIds = new Set<number>(playersWithCoords.map((p) => p.id));

  function positionMatchesSlot(playerPos: string | null, slotPos: string): boolean {
    if (!playerPos) return false;
    const playerCat = ka.player.positionToCategory[playerPos] ?? playerPos;
    const slotCat = ka.player.positionToCategory[slotPos] ?? slotPos;
    return playerCat === slotCat || playerPos === slotPos;
  }

  for (let i = 0; i < slots.length; i++) {
    const match = playersWithoutCoords.find(
      (p) => positionMatchesSlot(p.position, slots[i].position) && !assignedPlayerIds.has(p.id)
    );
    if (match) {
      slotAssignments[i] = match;
      assignedPlayerIds.add(match.id);
    }
  }
  for (let i = 0; i < slots.length; i++) {
    if (!slotAssignments[i]) {
      const unmatched = playersWithoutCoords.find((p) => !assignedPlayerIds.has(p.id));
      if (unmatched) {
        slotAssignments[i] = unmatched;
        assignedPlayerIds.add(unmatched.id);
      }
    }
  }

  const canPlayerJoin = currentUserRole === "PLAYER" && !currentUserHasTeam;

  function handleSlotClick(slotIndex: number) {
    if (slotAssignments[slotIndex]) return;
    if (!isAdmin && !canPlayerJoin) return;
    setSelectedSlot({ position: slots[slotIndex].position, index: slotIndex });
  }

  // Drag start — store which player is being dragged
  const handleDragStart = useCallback((e: React.DragEvent, playerId: number) => {
    if (!canRearrange) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(playerId));
    setDragPlayerId(playerId);
  }, [canRearrange]);

  const handleDragEnd = useCallback(() => {
    setDragPlayerId(null);
  }, []);

  // Drop on the pitch background — free placement
  const handlePitchDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!canRearrange || !pitchRef.current) return;

    const playerId = Number(e.dataTransfer.getData("text/plain"));
    setDragPlayerId(null);
    if (!playerId) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const xPct = Math.max(3, Math.min(97, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(3, Math.min(97, ((e.clientY - rect.top) / rect.height) * 100));

    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/positions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ memberId: playerId, x: Math.round(xPct * 10) / 10, y: Math.round(yPct * 10) / 10 }],
        }),
      });
      const data = await res.json();
      if (!data.success) alert(data.error);
      router.refresh();
    } catch {
      alert(ka.pitch.failedSave);
    } finally {
      setSaving(false);
    }
  }, [canRearrange, teamId, router]);

  const handlePitchDragOver = useCallback((e: React.DragEvent) => {
    if (!canRearrange) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, [canRearrange]);

  // Render a player circle (reused for both slot-based and free-placed players)
  function renderPlayer(player: PitchPlayer, posLabel: string, x: number, y: number) {
    const isDragging = dragPlayerId === player.id;

    return (
      <div
        key={player.id}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-0.5 group",
            canRearrange && "cursor-grab active:cursor-grabbing",
            isDragging && "opacity-30 scale-90",
          )}
          draggable={canRearrange}
          onDragStart={(e) => handleDragStart(e, player.id)}
          onDragEnd={handleDragEnd}
        >
          <div className={cn(
            "relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 transition-all",
            player.role === "CAPTAIN"
              ? "bg-yellow-500 border-yellow-300"
              : "bg-blue-600 border-blue-400",
            canRearrange && "group-hover:shadow-xl group-hover:scale-105",
          )}>
            {player.role === "CAPTAIN" ? (
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            {canRearrange && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-2 w-2 text-white" />
              </div>
            )}
          </div>
          <span className="text-[9px] sm:text-[11px] font-semibold text-white text-center leading-tight max-w-[120px] sm:max-w-[160px] truncate bg-black/50 px-1.5 py-0.5 rounded">
            {player.fullName}
          </span>
          <span className="text-[8px] sm:text-[9px] text-white/80 font-medium bg-black/40 px-1 rounded">{getPositionLabel(posLabel)}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={pitchRef}
        className="relative w-full max-w-4xl mx-auto select-none"
        style={{ aspectRatio: "105 / 68" }}
        onDragOver={handlePitchDragOver}
        onDrop={handlePitchDrop}
      >
        {saving && (
          <div className={cn("absolute inset-0 z-30 bg-black/30 flex items-center justify-center", hasBenchAbove ? "rounded-b-xl" : "rounded-xl")}>
            <span className="text-white font-semibold text-sm bg-black/50 px-4 py-2 rounded-lg">
              {ka.pitch.saving}
            </span>
          </div>
        )}

        {/* Pitch background */}
        <div className={cn("absolute inset-0 overflow-hidden bg-green-700 shadow-xl pointer-events-none", hasBenchAbove ? "rounded-b-xl" : "rounded-xl")}>
          <div className="absolute inset-0" style={{
            background: "repeating-linear-gradient(to right, #2d8a4e 0px, #2d8a4e 9.09%, #278544 9.09%, #278544 18.18%)"
          }} />

          <svg viewBox="0 0 105 68" className="absolute inset-0 w-full h-full" fill="none" stroke="white" strokeWidth="0.3" strokeOpacity="0.7">
            <rect x="2" y="2" width="101" height="64" rx="0.5" />
            <line x1="52.5" y1="2" x2="52.5" y2="66" />
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.5" fill="white" fillOpacity="0.6" />
            <rect x="2" y="13.84" width="16.5" height="40.32" />
            <rect x="2" y="22.16" width="5.5" height="23.68" />
            <path d="M 18.5 25.5 A 9.15 9.15 0 0 1 18.5 42.5" />
            <rect x="86.5" y="13.84" width="16.5" height="40.32" />
            <rect x="97.5" y="22.16" width="5.5" height="23.68" />
            <path d="M 86.5 25.5 A 9.15 9.15 0 0 0 86.5 42.5" />
            <path d="M 3.5 2 A 1.5 1.5 0 0 0 2 3.5" />
            <path d="M 103 3.5 A 1.5 1.5 0 0 0 101.5 2" />
            <path d="M 2 64.5 A 1.5 1.5 0 0 0 3.5 66" />
            <path d="M 101.5 66 A 1.5 1.5 0 0 0 103 64.5" />
          </svg>
        </div>

        {/* Team name */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="text-white/70 text-xs font-semibold tracking-wider uppercase drop-shadow">{teamName}</span>
        </div>

        {canRearrange && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className="text-white/50 text-[10px] font-medium bg-black/20 px-2 py-0.5 rounded">
              {ka.pitch.dragHint}
            </span>
          </div>
        )}

        {/* Players with saved custom coordinates — rendered at their exact position */}
        {playersWithCoords.map((player) =>
          renderPlayer(player, player.position || "?", player.positionX!, player.positionY!)
        )}

        {/* Players assigned to formation slots + empty slots for truly missing players */}
        {(() => {
          const emptySlotCount = slots.length - activePlayers.length;
          let emptyRendered = 0;

          return slots.map((slot, i) => {
            const player = slotAssignments[i];
            if (player) {
              return renderPlayer(player, slot.position, slot.x, slot.y);
            }

            // Only show empty circles for genuinely unfilled spots
            if (emptyRendered >= emptySlotCount || emptySlotCount <= 0) return null;
            emptyRendered++;

            const isClickable = isAdmin || canPlayerJoin;
            return (
              <div
                key={`empty-${slot.position}-${i}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              >
                <button
                  onClick={() => handleSlotClick(i)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center gap-0.5 group",
                    isClickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 border-dashed transition-all",
                    isClickable
                      ? "border-white/60 bg-white/10 hover:bg-white/25 hover:border-white hover:scale-110"
                      : "border-white/20 bg-white/5",
                  )}>
                    {isClickable && <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/70 group-hover:text-white" />}
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-white/50 font-medium">{getPositionLabel(slot.position)}</span>
                </button>
              </div>
            );
          });
        })()}
      </div>

      {selectedSlot && (
        <AddToSlotDialog
          open={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          teamId={teamId}
          championshipId={championshipId}
          position={selectedSlot.position}
          isAdmin={isAdmin}
          canPlayerJoin={canPlayerJoin}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

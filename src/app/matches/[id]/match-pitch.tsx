"use client";

import { cn } from "@/lib/utils";
import { Crown, User } from "lucide-react";

const FORMATION_SLOTS: { position: string; x: number; y: number }[] = [
  { position: "GK", x: 6, y: 50 },
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

interface PitchMember {
  id: number;
  fullName: string;
  position: string;
  positionX: number | null;
  positionY: number | null;
  role: "CAPTAIN" | "PLAYER";
}

interface Props {
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: PitchMember[];
  awayPlayers: PitchMember[];
  maxPlayers: number;
}

function getSlotsForSize(maxPlayers: number) {
  return FORMATION_SLOTS.slice(0, Math.min(maxPlayers, 11));
}

function mirrorX(x: number): number {
  return 100 - x;
}

export function MatchPitch({ homeTeamName, awayTeamName, homePlayers, awayPlayers, maxPlayers }: Props) {
  const slots = getSlotsForSize(maxPlayers);

  function assignToSlots(players: PitchMember[]) {
    const withCoords = players.filter((p) => p.positionX != null && p.positionY != null);
    const withoutCoords = players.filter((p) => p.positionX == null || p.positionY == null);
    const assignments: (PitchMember | null)[] = slots.map(() => null);
    const used = new Set<number>(withCoords.map((p) => p.id));

    for (let i = 0; i < slots.length; i++) {
      const match = withoutCoords.find((p) => p.position === slots[i].position && !used.has(p.id));
      if (match) { assignments[i] = match; used.add(match.id); }
    }
    for (let i = 0; i < slots.length; i++) {
      if (!assignments[i]) {
        const unmatched = withoutCoords.find((p) => !used.has(p.id));
        if (unmatched) { assignments[i] = unmatched; used.add(unmatched.id); }
      }
    }
    return { withCoords, assignments };
  }

  const home = assignToSlots(homePlayers);
  const away = assignToSlots(awayPlayers);

  function renderPlayer(player: PitchMember, x: number, y: number, color: "blue" | "red") {
    return (
      <div
        key={player.id}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <div className={cn(
            "relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2",
            color === "blue"
              ? player.role === "CAPTAIN" ? "bg-yellow-500 border-yellow-300" : "bg-blue-600 border-blue-400"
              : player.role === "CAPTAIN" ? "bg-yellow-500 border-yellow-300" : "bg-red-600 border-red-400",
          )}>
            {player.role === "CAPTAIN" ? (
              <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </div>
          <span className="text-[8px] sm:text-[10px] font-semibold text-white text-center leading-tight max-w-[100px] sm:max-w-[130px] truncate bg-black/50 px-1 py-0.5 rounded">
            {player.fullName}
          </span>
          <span className="text-[7px] sm:text-[8px] text-white/80 font-medium bg-black/40 px-1 rounded">
            {player.position}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto select-none" style={{ aspectRatio: "105 / 68" }}>
      {/* Pitch background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-green-700 shadow-xl pointer-events-none">
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

      {/* Team labels */}
      <div className="absolute top-2 left-[25%] -translate-x-1/2 z-10 pointer-events-none">
        <span className="text-white/80 text-xs sm:text-sm font-bold tracking-wider uppercase drop-shadow bg-blue-600/60 px-3 py-1 rounded">
          {homeTeamName}
        </span>
      </div>
      <div className="absolute top-2 left-[75%] -translate-x-1/2 z-10 pointer-events-none">
        <span className="text-white/80 text-xs sm:text-sm font-bold tracking-wider uppercase drop-shadow bg-red-600/60 px-3 py-1 rounded">
          {awayTeamName}
        </span>
      </div>

      {/* Home team (left half) — uses slots directly */}
      {home.withCoords.map((p) => {
        const x = Math.min(p.positionX!, 48);
        return renderPlayer(p, x, p.positionY!, "blue");
      })}
      {home.assignments.map((p, i) => {
        if (!p) return null;
        const x = Math.min(slots[i].x, 48);
        return renderPlayer(p, x, slots[i].y, "blue");
      })}

      {/* Away team (right half) — mirror X so their GK is on the right */}
      {away.withCoords.map((p) => {
        const x = Math.max(mirrorX(p.positionX!), 52);
        return renderPlayer(p, x, p.positionY!, "red");
      })}
      {away.assignments.map((p, i) => {
        if (!p) return null;
        const x = Math.max(mirrorX(slots[i].x), 52);
        return renderPlayer(p, x, slots[i].y, "red");
      })}
    </div>
  );
}

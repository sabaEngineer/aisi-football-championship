"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ka, getPositionLabel } from "@/lib/ka";

const POSITION_OPTIONS = ["GK", "DEF", "MID", "ATT"] as const;

function getPositionCategory(position: string | null | undefined): string {
  if (!position) return "DEF";
  return ka.player.positionToCategory[position] ?? position;
}

interface Props {
  memberId: number;
  teamId: number;
  currentPosition: string | null;
  disabled?: boolean;
}

export function PositionSelect({
  memberId,
  teamId,
  currentPosition,
  disabled,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const value = getPositionCategory(currentPosition);

  async function handleChange(newPosition: string) {
    if (newPosition === value || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/positions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ memberId, position: newPosition }],
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || ka.pitch.failedSave);
        return;
      }
      router.refresh();
    } catch {
      alert(ka.pitch.failedSave);
    } finally {
      setSaving(false);
    }
  }

  if (disabled) {
    return <span>{getPositionLabel(currentPosition)}</span>;
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="rounded border border-input bg-background px-2 py-1 text-sm min-w-[100px] disabled:opacity-60"
    >
      {POSITION_OPTIONS.map((pos) => (
        <option key={pos} value={pos}>
          {ka.player.positionMap[pos]}
        </option>
      ))}
    </select>
  );
}

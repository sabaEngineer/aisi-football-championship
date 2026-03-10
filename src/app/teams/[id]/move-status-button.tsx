"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ka } from "@/lib/ka";

interface Props {
  memberId: number;
  teamId: number;
  currentStatus: "ACTIVE" | "RESERVE";
  canMoveToReserve: boolean;
  canMoveToActive: boolean;
}

export function MoveStatusButton({
  memberId,
  teamId,
  currentStatus,
  canMoveToReserve,
  canMoveToActive,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMove(newStatus: "ACTIVE" | "RESERVE") {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
      } else {
        router.refresh();
      }
    } catch {
      alert(ka.match.failedToSave);
    }
    setLoading(false);
  }

  if (currentStatus === "ACTIVE" && canMoveToReserve) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-amber-600 hover:text-amber-700"
        disabled={loading}
        onClick={() => handleMove("RESERVE")}
      >
        <ArrowDown className="h-3.5 w-3.5 mr-1" />
        {ka.team.moveToReserve}
      </Button>
    );
  }

  if (currentStatus === "RESERVE" && canMoveToActive) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-green-600 hover:text-green-700"
        disabled={loading}
        onClick={() => handleMove("ACTIVE")}
      >
        <ArrowUp className="h-3.5 w-3.5 mr-1" />
        {ka.team.moveToActive}
      </Button>
    );
  }

  return null;
}

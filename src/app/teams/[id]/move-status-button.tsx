"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import { ka } from "@/lib/ka";

interface SwapPartner {
  id: number;
  fullName: string;
}

interface Props {
  memberId: number;
  teamId: number;
  currentStatus: "ACTIVE" | "RESERVE";
  canMoveToReserve: boolean;
  canMoveToActive: boolean;
  /** When moving to reserve but reserve is full, list of reserve players to swap with */
  swapPartnersForReserve?: SwapPartner[];
  /** When moving to active but active is full, list of active players to swap with (non-captain) */
  swapPartnersForActive?: SwapPartner[];
}

export function MoveStatusButton({
  memberId,
  teamId,
  currentStatus,
  canMoveToReserve,
  canMoveToActive,
  swapPartnersForReserve = [],
  swapPartnersForActive = [],
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedSwapId, setSelectedSwapId] = useState("");

  async function handleMove(newStatus: "ACTIVE" | "RESERVE", swapWithMemberId?: number) {
    setLoading(true);
    try {
      const body: { status: "ACTIVE" | "RESERVE"; swapWithMemberId?: number } = { status: newStatus };
      if (swapWithMemberId) body.swapWithMemberId = swapWithMemberId;

      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
      } else {
        setSwapDialogOpen(false);
        setSelectedSwapId("");
        router.refresh();
      }
    } catch {
      alert(ka.match.failedToSave);
    }
    setLoading(false);
  }

  const needSwapToReserve = swapPartnersForReserve.length > 0;
  const needSwapToActive = swapPartnersForActive.length > 0;

  // ACTIVE -> RESERVE: direct move when reserve has room, else swap
  if (currentStatus === "ACTIVE" && (canMoveToReserve || needSwapToReserve)) {
    const isDirectMove = canMoveToReserve && swapPartnersForReserve.length === 0;
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-700"
          disabled={loading}
          onClick={() =>
            isDirectMove ? handleMove("RESERVE") : setSwapDialogOpen(true)
          }
        >
          {isDirectMove ? (
            <>
              <ArrowDown className="h-3.5 w-3.5 mr-1" />
              {ka.team.moveToReserve}
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
              {ka.team.swapWithReserve}
            </>
          )}
        </Button>
        <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ka.team.selectPlayerToSwap}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <select
                value={selectedSwapId}
                onChange={(e) => setSelectedSwapId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{ka.player.selectPlayer}</option>
                {swapPartnersForReserve.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => handleMove("RESERVE", Number(selectedSwapId))}
                disabled={loading || !selectedSwapId}
                className="w-full"
              >
                {loading ? ka.common.saving : ka.team.swapWithReserve}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // RESERVE -> ACTIVE: direct move when active has room, else swap
  if (currentStatus === "RESERVE" && (canMoveToActive || needSwapToActive)) {
    const isDirectMove = canMoveToActive && swapPartnersForActive.length === 0;
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="text-green-600 hover:text-green-700"
          disabled={loading}
          onClick={() =>
            isDirectMove ? handleMove("ACTIVE") : setSwapDialogOpen(true)
          }
        >
          {isDirectMove ? (
            <>
              <ArrowUp className="h-3.5 w-3.5 mr-1" />
              {ka.team.moveToActive}
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
              {ka.team.swapWithActive}
            </>
          )}
        </Button>
        <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ka.team.selectPlayerToSwap}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <select
                value={selectedSwapId}
                onChange={(e) => setSelectedSwapId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{ka.player.selectPlayer}</option>
                {swapPartnersForActive.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => handleMove("ACTIVE", Number(selectedSwapId))}
                disabled={loading || !selectedSwapId}
                className="w-full"
              >
                {loading ? ka.common.saving : ka.team.swapWithActive}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

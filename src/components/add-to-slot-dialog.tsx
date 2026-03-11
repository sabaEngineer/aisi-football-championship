"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, LogIn } from "lucide-react";
import { ka, getPositionLabel } from "@/lib/ka";
import { STORAGE_KEY, PAYMENT_MODAL_PENDING_EVENT } from "@/components/payment-modal-trigger";

interface UnassignedPlayer {
  id: number;
  fullName: string;
  position: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: number;
  championshipId: number;
  position: string;
  isAdmin: boolean;
  canPlayerJoin: boolean;
  currentUserId: number | null;
}

export function AddToSlotDialog({
  open,
  onClose,
  teamId,
  championshipId,
  position,
  isAdmin,
  canPlayerJoin,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [players, setPlayers] = useState<UnassignedPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && isAdmin) {
      fetch(`/api/championships/${championshipId}/unassigned-players`)
        .then((r) => r.json())
        .then((d) => d.success && setPlayers(d.data));
    }
  }, [open, isAdmin, championshipId]);

  async function handleJoinTeam() {
    if (!currentUserId) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, teamId, position }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    // Store for payment modal (30s delay) — only when current user joins
    if (data.data?.id && data.data?.team?.name) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ memberId: data.data.id, teamName: data.data.team.name, teamId })
        );
        window.dispatchEvent(new Event(PAYMENT_MODAL_PENDING_EVENT));
      } catch (_) {}
    }

    onClose();
    router.refresh();
  }

  async function handleAddPlayer() {
    if (!selectedPlayer) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: Number(selectedPlayer),
        teamId,
        position,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    onClose();
    setSelectedPlayer("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {ka.slot.addPlayerTitle.replace("{position}", getPositionLabel(position))}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Player can join this slot */}
          {canPlayerJoin && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {ka.slot.joinAsPosition.replace("{position}", getPositionLabel(position))}
              </p>
              <Button onClick={handleJoinTeam} disabled={loading} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? ka.slot.joining : ka.slot.joinTeam}
              </Button>
            </div>
          )}

          {/* Admin can pick any unassigned player */}
          {isAdmin && (
            <div className="space-y-3">
              {canPlayerJoin && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{ka.common.or}</span>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {ka.slot.selectForPosition.replace("{position}", getPositionLabel(position))}
              </p>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{ka.slot.choosePlayer}</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} {p.position ? `(${getPositionLabel(p.position)})` : ""}
                  </option>
                ))}
              </select>
              {players.length === 0 && (
                <p className="text-xs text-muted-foreground">{ka.slot.noUnassigned}</p>
              )}
              <Button
                onClick={handleAddPlayer}
                disabled={loading || !selectedPlayer}
                variant="outline"
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? ka.slot.adding : ka.slot.addPlayer}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

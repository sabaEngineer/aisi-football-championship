"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, LogIn } from "lucide-react";

interface UnassignedPlayer {
  id: number;
  fullName: string;
  position: string | null;
}

interface Props {
  teamId: number;
  championshipId: number;
  isAdmin: boolean;
  canPlayerJoin: boolean;
  currentUserId: number | null;
  reserveCount: number;
  maxReserves: number;
}

export function AddReserveButton({
  teamId,
  championshipId,
  isAdmin,
  canPlayerJoin,
  currentUserId,
  reserveCount,
  maxReserves,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  async function handleJoin() {
    if (!currentUserId) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, teamId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleAdd() {
    if (!selectedPlayer) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(selectedPlayer), teamId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    setOpen(false);
    setSelectedPlayer("");
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Reserve Player ({reserveCount}/{maxReserves})
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Reserve Player
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {canPlayerJoin && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Join this team as a <strong>reserve</strong> player
                </p>
                <Button onClick={handleJoin} disabled={loading} className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  {loading ? "Joining..." : "Join as Reserve"}
                </Button>
              </div>
            )}

            {isAdmin && (
              <div className="space-y-3">
                {canPlayerJoin && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Select an unassigned player to add as reserve
                </p>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose a player...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} {p.position ? `(${p.position})` : ""}
                    </option>
                  ))}
                </select>
                {players.length === 0 && (
                  <p className="text-xs text-muted-foreground">No unassigned players available.</p>
                )}
                <Button
                  onClick={handleAdd}
                  disabled={loading || !selectedPlayer}
                  variant="outline"
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? "Adding..." : "Add as Reserve"}
                </Button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

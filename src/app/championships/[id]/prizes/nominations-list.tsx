"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ka } from "@/lib/ka";

type UserItem = { id: number; fullName: string };
type Sponsor = { id: number; name: string; logo?: string | null; website?: string | null };
type Nomination = {
  id: number;
  name: string;
  prize: string | null;
  sponsor: Sponsor | null;
  winner: {
    user: { id: number; fullName: string } | null;
    team: { id: number; name: string } | null;
  } | null;
};

interface NominationsListProps {
  championshipId: number;
  nominations: Nomination[];
  players: UserItem[];
  staff: UserItem[];
  teams: { id: number; name: string }[];
  sponsors: Sponsor[];
  isAdmin: boolean;
}

function getWinnerDisplay(winner: Nomination["winner"]): string {
  if (!winner) return ka.nomination.noWinner;
  if (winner.user) return winner.user.fullName;
  if (winner.team) return winner.team.name;
  return ka.nomination.noWinner;
}

export function NominationsList({
  championshipId,
  nominations,
  players,
  staff,
  teams,
  sponsors,
  isAdmin,
}: NominationsListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrize, setEditPrize] = useState("");
  const [editSponsorId, setEditSponsorId] = useState<string>("");
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit(n: Nomination) {
    setEditingId(n.id);
    setEditName(n.name);
    setEditPrize(n.prize ?? "");
    setEditSponsorId(n.sponsor ? String(n.sponsor.id) : "");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPrize("");
    setEditSponsorId("");
    setError("");
  }

  async function handleSave() {
    if (!editingId) return;
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/championships/${championshipId}/nominations/${editingId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          prize: editPrize || null,
          sponsorId: editSponsorId ? Number(editSponsorId) : null,
        }),
      }
    );
    const data = await res.json();
    setLoading(false);
    if (!data.success) {
      setError(data.error);
      return;
    }
    cancelEdit();
    router.refresh();
  }

  async function handleDelete(nomId: number) {
    if (!confirm(ka.nomination.deleteConfirm)) return;
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/championships/${championshipId}/nominations/${nomId}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    setLoading(false);
    if (!data.success) {
      setError(data.error);
      return;
    }
    router.refresh();
  }

  function startAssign(n: Nomination) {
    setAssigningId(n.id);
    if (n.winner?.user) {
      setSelectedValue(`user:${n.winner.user.id}`);
    } else if (n.winner?.team) {
      setSelectedValue(`team:${n.winner.team.id}`);
    } else {
      setSelectedValue("");
    }
    setError("");
  }

  function cancelAssign() {
    setAssigningId(null);
    setSelectedValue("");
    setError("");
  }

  async function handleAssignWinner() {
    if (!assigningId || !selectedValue) return;
    const [winnerType, idStr] = selectedValue.split(":");
    const winnerId = Number(idStr);
    if (!winnerType || !winnerId) return;
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/championships/${championshipId}/nominations/${assigningId}/winner`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerType, winnerId }),
      }
    );
    const data = await res.json();
    setLoading(false);
    if (!data.success) {
      setError(data.error);
      return;
    }
    cancelAssign();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {nominations.map((n) => (
        <div
          key={n.id}
          className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
        >
          {editingId === n.id ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{ka.nomination.name}</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={ka.nomination.namePlaceholder}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{ka.nomination.prize}</label>
                <Input
                  value={editPrize}
                  onChange={(e) => setEditPrize(e.target.value)}
                  placeholder={ka.nomination.prizePlaceholder}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{ka.nomination.sponsorOptional}</label>
                <select
                  value={editSponsorId}
                  onChange={(e) => setEditSponsorId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{ka.nomination.selectSponsor}</option>
                  {sponsors.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  {loading ? ka.common.saving : ka.common.save}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={loading}>
                  {ka.common.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{n.name}</p>
                  {n.prize && (
                    <p className="text-sm text-muted-foreground mt-0.5">{n.prize}</p>
                  )}
                  {n.sponsor && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {ka.nomination.sponsor}: {n.sponsor.name}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(n)}>
                      {ka.common.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(n.id)}
                      disabled={loading}
                    >
                      {ka.common.delete}
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border/50 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{ka.nomination.winner}:</span>
                  <span className="text-sm text-muted-foreground">
                    {getWinnerDisplay(n.winner)}
                  </span>
                </div>
                {isAdmin && (
                  assigningId === n.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedValue}
                        onChange={(e) => setSelectedValue(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
                      >
                        <option value="">{ka.nomination.selectWinner}</option>
                        {players.length > 0 && (
                          <optgroup label={ka.nomination.winnerTypePlayer}>
                            {players.map((p) => (
                              <option key={`user:${p.id}`} value={`user:${p.id}`}>
                                {p.fullName}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {staff.length > 0 && (
                          <optgroup label={ka.nomination.winnerTypeStaff}>
                            {staff.map((s) => (
                              <option key={`user:${s.id}`} value={`user:${s.id}`}>
                                {s.fullName}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {teams.length > 0 && (
                          <optgroup label={ka.nomination.winnerTypeTeam}>
                            {teams.map((t) => (
                              <option key={`team:${t.id}`} value={`team:${t.id}`}>
                                {t.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <Button size="sm" onClick={handleAssignWinner} disabled={loading || !selectedValue}>
                        {loading ? ka.common.saving : ka.common.save}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelAssign} disabled={loading}>
                        {ka.common.cancel}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startAssign(n)}>
                      <Trophy className="h-4 w-4 mr-1.5" />
                      {ka.nomination.assignWinner}
                    </Button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

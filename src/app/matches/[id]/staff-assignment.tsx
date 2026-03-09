"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X } from "lucide-react";
import { ka } from "@/lib/ka";

interface AssignedStaff {
  id: number;
  userId: number;
  fullName: string;
  role: string;
  position: string | null;
}

interface AvailableStaff {
  id: number;
  fullName: string;
  position: string | null;
}

interface Props {
  matchId: number;
  assignedStaff: AssignedStaff[];
  availableStaff: AvailableStaff[];
  isAdmin: boolean;
}

export function StaffAssignment({ matchId, assignedStaff, availableStaff, isAdmin }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState("Referee");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [error, setError] = useState("");

  const assignedIds = new Set(assignedStaff.map((s) => s.userId));
  const unassigned = availableStaff.filter((s) => !assignedIds.has(s.id));

  async function handleAssign() {
    if (!selectedUserId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        setAdding(false);
        setSelectedUserId(null);
        router.refresh();
      }
    } catch {
      setError(ka.staff.failedAssign);
    }
    setSaving(false);
  }

  async function handleRemove(userId: number) {
    setRemoving(userId);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}/staff`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error);
      else router.refresh();
    } catch {
      setError(ka.staff.failedRemove);
    }
    setRemoving(null);
  }

  if (assignedStaff.length === 0 && !isAdmin) {
    return <p className="text-muted-foreground text-sm">{ka.staff.noStaffOnMatch}</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {assignedStaff.length > 0 && (
        <div className="space-y-2">
          {assignedStaff.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{s.fullName}</span>
                {s.position && (
                  <Badge variant="outline" className="text-xs">{s.position}</Badge>
                )}
                <Badge variant="secondary" className="text-xs">{s.role}</Badge>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={removing === s.userId}
                  onClick={() => handleRemove(s.userId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && !adding && unassigned.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {ka.staff.assignStaff}
        </Button>
      )}

      {isAdmin && adding && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4 bg-muted/30">
          <div>
            <label className="text-sm font-medium block mb-1">{ka.staff.staffMember}</label>
            <select
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm h-9 min-w-[180px]"
            >
              <option value="">{ka.staff.selectStaff}</option>
              {unassigned.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}{s.position ? ` (${s.position})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{ka.staff.matchRole}</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm h-9 min-w-[140px]"
            >
              <option value="Referee">{ka.staff.roles_list.referee}</option>
              <option value="Assistant Referee">{ka.staff.roles_list.assistantReferee}</option>
              <option value="Doctor">{ka.staff.roles_list.doctor}</option>
              <option value="Photographer">{ka.staff.roles_list.photographer}</option>
              <option value="Fourth Official">{ka.staff.roles_list.fourthOfficial}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAssign} disabled={saving || !selectedUserId}>
              {saving ? ka.staff.assigning : ka.staff.assign}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setError(""); }}>
              {ka.common.cancel}
            </Button>
          </div>
        </div>
      )}

      {isAdmin && unassigned.length === 0 && assignedStaff.length > 0 && (
        <p className="text-xs text-muted-foreground">{ka.staff.allAssigned}</p>
      )}
    </div>
  );
}

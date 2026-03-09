"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StaffUser {
  id: number;
  fullName: string;
}

export function AssignStaffForm({ matchId }: { matchId: number }) {
  const router = useRouter();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users?role=STAFF")
      .then((r) => r.json())
      .then((d) => d.success && setStaffUsers(d.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff || !role) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/matches/${matchId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(selectedStaff), role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    setSelectedStaff("");
    setRole("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-sm font-medium">Staff Member</label>
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">Select staff...</option>
          {staffUsers.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Role</label>
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Referee, Observer"
          required
        />
      </div>
      <Button type="submit" variant="outline" disabled={loading}>
        {loading ? "Assigning..." : "Assign Staff"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

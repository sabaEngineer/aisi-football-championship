"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  matchId: number;
  currentStatus: string;
}

export function UpdateScoreForm({ matchId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};

    const homeScore = form.get("homeScore");
    const awayScore = form.get("awayScore");
    const status = form.get("status");

    if (homeScore !== null && homeScore !== "") body.homeScore = Number(homeScore);
    if (awayScore !== null && awayScore !== "") body.awayScore = Number(awayScore);
    if (status) body.status = status;

    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Match</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium">Home Score</label>
            <Input name="homeScore" type="number" min={0} className="w-24" />
          </div>
          <div>
            <label className="text-sm font-medium">Away Score</label>
            <Input name="awayScore" type="number" min={0} className="w-24" />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              name="status"
              defaultValue={currentStatus}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}

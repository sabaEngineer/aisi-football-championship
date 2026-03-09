"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewChampionshipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      maxTeams: Number(form.get("maxTeams")),
      maxPlayersPerTeam: Number(form.get("maxPlayersPerTeam")),
    };

    const res = await fetch("/api/championships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    router.push(`/championships/${data.data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Championship</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Championship Name</label>
              <Input name="name" placeholder="e.g. Spring League 2026" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Max Teams</label>
                <Input name="maxTeams" type="number" min={2} defaultValue={8} required />
              </div>
              <div>
                <label className="text-sm font-medium">Max Players / Team</label>
                <Input name="maxPlayersPerTeam" type="number" min={1} defaultValue={11} required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Championship"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

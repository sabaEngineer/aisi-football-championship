"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ka } from "@/lib/ka";

export default function NewChampionshipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const desc = (form.get("description") as string)?.trim();
    const body = {
      name: form.get("name") as string,
      description: desc || undefined,
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
          <CardTitle>{ka.championship.createTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{ka.championship.championshipName}</label>
              <Input name="name" placeholder={ka.championship.championshipNamePlaceholder} required />
            </div>
            <div>
              <label className="text-sm font-medium">{ka.championship.description} <span className="text-muted-foreground font-normal">({ka.common.optional})</span></label>
              <textarea
                name="description"
                placeholder={ka.championship.descriptionPlaceholder}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{ka.championship.maxTeams}</label>
                <Input name="maxTeams" type="number" min={2} defaultValue={8} required />
              </div>
              <div>
                <label className="text-sm font-medium">{ka.championship.maxPlayersTeam}</label>
                <Input name="maxPlayersPerTeam" type="number" min={1} defaultValue={11} required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? ka.championship.creating : ka.championship.createTitle}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

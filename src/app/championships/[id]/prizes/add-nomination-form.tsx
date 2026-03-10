"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ka } from "@/lib/ka";

type Sponsor = { id: number; name: string; logo?: string | null; website?: string | null };

interface AddNominationFormProps {
  championshipId: number;
  sponsors: Sponsor[];
}

export function AddNominationForm({ championshipId, sponsors }: AddNominationFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prize, setPrize] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/championships/${championshipId}/nominations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        prize: prize.trim() || undefined,
        sponsorId: sponsorId ? Number(sponsorId) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) {
      setError(data.error);
      return;
    }
    setName("");
    setPrize("");
    setSponsorId("");
    router.refresh();
  }

  return (
    <div className="space-y-4 pt-2">
      <Separator />
      <p className="text-sm font-medium">{ka.nomination.addNomination}</p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm font-medium">{ka.nomination.name}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ka.nomination.namePlaceholder}
            required
            className="mt-1 min-w-[180px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{ka.nomination.prize}</label>
          <Input
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder={ka.nomination.prizePlaceholder}
            className="mt-1 min-w-[140px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{ka.nomination.sponsorOptional}</label>
          <select
            value={sponsorId}
            onChange={(e) => setSponsorId(e.target.value)}
            className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">{ka.nomination.selectSponsor}</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={loading}>
          {loading ? ka.nomination.creating : ka.nomination.create}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

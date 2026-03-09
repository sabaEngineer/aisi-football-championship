"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ka } from "@/lib/ka";

interface Sponsor {
  id: number;
  name: string;
}

export function AssignSponsorForm({ championshipId }: { championshipId: number }) {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New sponsor form
  const [newName, setNewName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    fetch("/api/sponsors")
      .then((r) => r.json())
      .then((d) => d.success && setSponsors(d.data));
  }, []);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSponsor) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/championships/${championshipId}/sponsors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsorId: Number(selectedSponsor) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error); return; }
    setSelectedSponsor("");
    router.refresh();
  }

  async function handleCreateAndAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!newName) return;
    setCreatingNew(true);
    setError("");

    const createRes = await fetch("/api/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, website: newWebsite || undefined }),
    });
    const createData = await createRes.json();
    if (!createData.success) { setError(createData.error); setCreatingNew(false); return; }

    const assignRes = await fetch(`/api/championships/${championshipId}/sponsors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsorId: createData.data.id }),
    });
    const assignData = await assignRes.json();
    setCreatingNew(false);
    if (!assignData.success) { setError(assignData.error); return; }
    setNewName("");
    setNewWebsite("");
    router.refresh();
  }

  return (
    <div className="space-y-4 pt-2">
      <Separator />
      <p className="text-sm font-medium">{ka.sponsor.assignExisting}</p>
      <form onSubmit={handleAssign} className="flex items-end gap-3">
        <select
          value={selectedSponsor}
          onChange={(e) => setSelectedSponsor(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{ka.sponsor.selectSponsor}</option>
          {sponsors.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm" disabled={loading}>
          {loading ? ka.sponsor.assigning : ka.staff.assign}
        </Button>
      </form>

      <p className="text-sm font-medium">{ka.sponsor.orCreateNew}</p>
      <form onSubmit={handleCreateAndAssign} className="flex flex-wrap items-end gap-3">
        <div>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={ka.sponsor.sponsorName}
            required
          />
        </div>
        <div>
          <Input
            value={newWebsite}
            onChange={(e) => setNewWebsite(e.target.value)}
            placeholder={ka.sponsor.websitePlaceholder}
            type="url"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={creatingNew}>
          {creatingNew ? ka.sponsor.creatingAssigning : ka.sponsor.createAndAssign}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";

export function EditTeamName({ teamId, currentName }: { teamId: number; currentName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      setEditing(false);
      setName(currentName);
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{currentName}</h1>
        <button
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Edit team name"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-xl font-bold h-10 w-64"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") { setEditing(false); setName(currentName); }
        }}
      />
      <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving}>
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => { setEditing(false); setName(currentName); }}>
        <X className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

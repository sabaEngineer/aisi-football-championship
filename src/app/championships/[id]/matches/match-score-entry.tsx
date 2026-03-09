"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { ka } from "@/lib/ka";

interface MatchEntry {
  id: number;
  round: number;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  homeScore: number;
  awayScore: number;
  status: string;
}

function getRoundLabel(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return ka.match.round.final;
  if (fromFinal === 1) return ka.match.round.semiFinal;
  if (fromFinal === 2) return ka.match.round.quarterFinal;
  return ka.match.round.roundN.replace("{n}", String(round));
}

export function MatchScoreEntry({
  matches,
  totalRounds,
}: {
  matches: MatchEntry[];
  totalRounds: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleSave(matchId: number, homeScore: number, awayScore: number) {
    if (homeScore === awayScore) {
      setError(ka.match.noDrawAllowed);
      return;
    }
    setSaving(matchId);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore,
          awayScore,
          status: "COMPLETED",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        router.refresh();
      }
    } catch {
      setError(ka.match.failedToSave);
    }
    setSaving(null);
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {matches.map((match) => (
        <MatchRow
          key={match.id}
          match={match}
          totalRounds={totalRounds}
          saving={saving === match.id}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}

function MatchRow({
  match,
  totalRounds,
  saving,
  onSave,
}: {
  match: MatchEntry;
  totalRounds: number;
  saving: boolean;
  onSave: (matchId: number, homeScore: number, awayScore: number) => void;
}) {
  const [homeScore, setHomeScore] = useState(match.homeScore);
  const [awayScore, setAwayScore] = useState(match.awayScore);

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="text-xs text-muted-foreground font-medium w-24 shrink-0">
        {getRoundLabel(match.round, totalRounds)}
      </span>
      <span className="font-medium text-sm truncate flex-1 text-right">
        {match.homeTeam?.name ?? ka.match.tbd}
      </span>
      <Input
        type="number"
        min={0}
        value={homeScore}
        onChange={(e) => setHomeScore(Number(e.target.value))}
        className="w-14 text-center"
      />
      <span className="text-muted-foreground text-xs">{ka.common.vs}</span>
      <Input
        type="number"
        min={0}
        value={awayScore}
        onChange={(e) => setAwayScore(Number(e.target.value))}
        className="w-14 text-center"
      />
      <span className="font-medium text-sm truncate flex-1">
        {match.awayTeam?.name ?? ka.match.tbd}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        disabled={saving}
        onClick={() => onSave(match.id, homeScore, awayScore)}
      >
        <Check className="h-4 w-4 mr-1" />
        {saving ? "..." : ka.common.save}
      </Button>
    </div>
  );
}

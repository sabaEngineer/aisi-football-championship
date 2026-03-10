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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3 sm:p-4">
      <span className="text-xs text-muted-foreground font-medium shrink-0">
        {getRoundLabel(match.round, totalRounds)}
      </span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 sm:flex-1 sm:justify-end">
          <span className="font-medium text-sm truncate min-w-0">
            {match.homeTeam?.name ?? ka.match.tbd}
          </span>
          <Input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            className="w-14 shrink-0 text-center h-10"
          />
        </div>
        <span className="text-muted-foreground text-xs text-center sm:shrink-0">{ka.common.vs}</span>
        <div className="flex items-center justify-between gap-2 sm:flex-1">
          <Input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="w-14 shrink-0 text-center h-10"
          />
          <span className="font-medium text-sm truncate min-w-0 text-right">
            {match.awayTeam?.name ?? ka.match.tbd}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 w-full sm:w-auto h-10"
        disabled={saving}
        onClick={() => onSave(match.id, homeScore, awayScore)}
      >
        <Check className="h-4 w-4 sm:mr-1" />
        {saving ? "..." : ka.common.save}
      </Button>
    </div>
  );
}

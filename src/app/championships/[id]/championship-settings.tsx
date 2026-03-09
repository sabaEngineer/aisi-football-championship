"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shuffle } from "lucide-react";
import { ka } from "@/lib/ka";

interface Props {
  championshipId: number;
  currentMaxTeams: number;
  currentMaxPlayersPerTeam: number;
  currentMaxReservesPerTeam: number;
  currentStatus: string;
  teamCount: number;
  hasMatches: boolean;
}

export function ChampionshipSettings({
  championshipId,
  currentMaxTeams,
  currentMaxPlayersPerTeam,
  currentMaxReservesPerTeam,
  currentStatus,
  teamCount,
  hasMatches,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};

    const maxTeams = Number(form.get("maxTeams"));
    const maxPlayersPerTeam = Number(form.get("maxPlayersPerTeam"));
    const maxReservesPerTeam = Number(form.get("maxReservesPerTeam"));
    const status = form.get("status") as string;

    if (maxTeams !== currentMaxTeams) body.maxTeams = maxTeams;
    if (maxPlayersPerTeam !== currentMaxPlayersPerTeam) body.maxPlayersPerTeam = maxPlayersPerTeam;
    if (maxReservesPerTeam !== currentMaxReservesPerTeam) body.maxReservesPerTeam = maxReservesPerTeam;
    if (status !== currentStatus) body.status = status;

    if (Object.keys(body).length === 0) {
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/championships/${championshipId}`, {
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

    setSuccess(ka.settings.settingsUpdated);
    router.refresh();
  }

  return (
    <>
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {ka.settings.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium">{ka.settings.numberOfTeams}</label>
            <Input
              name="maxTeams"
              type="number"
              min={2}
              defaultValue={currentMaxTeams}
              className="w-28"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{ka.settings.playersPerTeam}</label>
            <Input
              name="maxPlayersPerTeam"
              type="number"
              min={1}
              defaultValue={currentMaxPlayersPerTeam}
              className="w-28"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{ka.settings.maxReservesPerTeam}</label>
            <Input
              name="maxReservesPerTeam"
              type="number"
              min={0}
              defaultValue={currentMaxReservesPerTeam}
              className="w-28"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{ka.settings.status}</label>
            <select
              name="status"
              defaultValue={currentStatus}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm h-9"
            >
              <option value="DRAFT">{ka.championship.status.DRAFT}</option>
              <option value="REGISTRATION">{ka.championship.status.REGISTRATION}</option>
              <option value="ACTIVE">{ka.championship.status.ACTIVE}</option>
              <option value="COMPLETED">{ka.championship.status.COMPLETED}</option>
              <option value="CANCELLED">{ka.championship.status.CANCELLED}</option>
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? ka.common.saving : ka.common.save}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </CardContent>
    </Card>

    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          {ka.settings.tournamentBracket}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {ka.settings.bracketDesc}
          {hasMatches && ` ${ka.settings.bracketWillReplace}`}
        </p>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">{teamCount}</span> {ka.settings.teamsRegistered}
            {teamCount < 2 && (
              <span className="text-destructive ml-2">{ka.settings.needAtLeast2}</span>
            )}
          </div>
          <Button
            variant="default"
            className="bg-green-700 hover:bg-green-800"
            disabled={generating || teamCount < 2}
            onClick={async () => {
              if (hasMatches && !confirm(ka.settings.confirmRedraw)) return;
              setGenerating(true);
              setError("");
              setSuccess("");
              try {
                const res = await fetch(`/api/championships/${championshipId}/fixtures`, {
                  method: "POST",
                });
                const data = await res.json();
                if (!data.success) {
                  setError(data.error);
                } else {
                  setSuccess(ka.settings.bracketGenerated.replace("{matches}", data.data.count).replace("{rounds}", data.data.rounds));
                  router.refresh();
                }
              } catch {
                setError(ka.settings.failedGenerate);
              }
              setGenerating(false);
            }}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            {generating ? ka.settings.generating : hasMatches ? ka.settings.redrawBracket : ka.settings.drawBracket}
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

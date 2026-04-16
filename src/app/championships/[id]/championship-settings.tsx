"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shuffle, Trash2, Trophy } from "lucide-react";
import { ka } from "@/lib/ka";

interface Props {
  championshipId: number;
  championshipName: string;
  championshipDescription: string | null;
  currentMaxTeams: number;
  currentMaxPlayersPerTeam: number;
  currentMaxReservesPerTeam: number;
  currentStatus: string;
  teamCount: number;
  hasMatches: boolean;
  hasGroupStage: boolean;
  groupsComplete: boolean;
  hasKnockout: boolean;
}

export function ChampionshipSettings({
  championshipId,
  championshipName,
  championshipDescription,
  currentMaxTeams,
  currentMaxPlayersPerTeam,
  currentMaxReservesPerTeam,
  currentStatus,
  teamCount,
  hasMatches,
  hasGroupStage,
  groupsComplete,
  hasKnockout,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generating, setGenerating] = useState(false);
  const [clearingBracket, setClearingBracket] = useState(false);
  const [groupCount, setGroupCount] = useState("");
  const [generatingKnockout, setGeneratingKnockout] = useState(false);

  async function handleDelete() {
    if (!confirm(ka.settings.confirmDeleteChampionship)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/championships/${championshipId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        router.push("/championships");
        router.refresh();
      }
    } catch {
      setError(ka.match.failedToSave);
    }
    setDeleting(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};

    const name = (form.get("name") as string)?.trim();
    const description = (form.get("description") as string)?.trim() || null;
    const maxTeams = Number(form.get("maxTeams"));
    const maxPlayersPerTeam = Number(form.get("maxPlayersPerTeam"));
    const maxReservesPerTeam = Number(form.get("maxReservesPerTeam"));
    const status = form.get("status") as string;

    if (name && name !== championshipName) body.name = name;
    if (description !== (championshipDescription ?? "")) body.description = description || null;
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
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">{ka.championship.championshipName}</label>
            <Input
              name="name"
              defaultValue={championshipName}
              placeholder={ka.championship.championshipNamePlaceholder}
              className="max-w-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{ka.championship.description} <span className="text-muted-foreground font-normal">({ka.common.optional})</span></label>
            <textarea
              name="description"
              defaultValue={championshipDescription ?? ""}
              placeholder={ka.championship.descriptionPlaceholder}
              rows={3}
              className="flex w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
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
          </div>
        </form>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </CardContent>
    </Card>

    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          {ka.settings.deleteChampionship}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {ka.settings.confirmDeleteChampionship}
        </p>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4 mr-2" />
          {deleting ? ka.common.saving : ka.common.delete}
        </Button>
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
        <p className="text-xs text-muted-foreground">{ka.settings.groupCountHint}</p>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
          <div className="text-sm">
            <span className="font-medium">{teamCount}</span> {ka.settings.teamsRegistered}
            {teamCount < 2 && (
              <span className="text-destructive ml-2">{ka.settings.needAtLeast2}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{ka.settings.groupCountLabel}</label>
            <Input
              type="number"
              min={1}
              max={teamCount}
              placeholder="4"
              value={groupCount}
              onChange={(e) => setGroupCount(e.target.value)}
              className="w-24"
            />
          </div>
          <Button
            variant="default"
            className="bg-green-700 hover:bg-green-800"
            disabled={generating || teamCount < 2}
            onClick={async () => {
              const gc = Number(groupCount);
              if (!groupCount.trim() || !Number.isInteger(gc) || gc < 1) {
                setError(ka.settings.groupCountInvalid);
                return;
              }
              if (teamCount % gc !== 0) {
                setError(ka.settings.groupCountNotDivisor.replace("{n}", String(teamCount)));
                return;
              }
              if (hasMatches && !confirm(ka.settings.confirmRedraw)) return;
              setGenerating(true);
              setError("");
              setSuccess("");
              try {
                const res = await fetch(`/api/championships/${championshipId}/fixtures`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ groupCount: gc }),
                });
                const data = await res.json();
                if (!data.success) {
                  setError(data.error);
                } else {
                  setSuccess(
                    ka.settings.bracketGeneratedGroups
                      .replace("{matches}", String(data.data.count))
                      .replace("{groups}", String(data.data.groupCount))
                      .replace("{perGroup}", String(data.data.teamsPerGroup))
                  );
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
          {hasMatches && (
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              disabled={clearingBracket || generating}
              onClick={async () => {
                if (!confirm(ka.settings.confirmDeleteBracket)) return;
                setClearingBracket(true);
                setError("");
                setSuccess("");
                try {
                  const res = await fetch(`/api/championships/${championshipId}/fixtures`, {
                    method: "DELETE",
                  });
                  const data = await res.json();
                  if (!data.success) {
                    setError(data.error);
                  } else {
                    setSuccess(ka.settings.bracketDeleted);
                    router.refresh();
                  }
                } catch {
                  setError(ka.settings.failedGenerate);
                }
                setClearingBracket(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearingBracket ? ka.common.saving : ka.settings.deleteBracket}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {hasGroupStage && (
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            {ka.settings.knockoutTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {ka.settings.knockoutDesc}
          </p>
          {!groupsComplete && (
            <p className="text-sm text-amber-600 font-medium">
              {ka.settings.groupsNotComplete}
            </p>
          )}
          <Button
            variant="default"
            className="bg-yellow-600 hover:bg-yellow-700"
            disabled={!groupsComplete || generatingKnockout}
            onClick={async () => {
              if (hasKnockout && !confirm(ka.settings.confirmRedraw)) return;
              setGeneratingKnockout(true);
              setError("");
              setSuccess("");
              try {
                const res = await fetch(`/api/championships/${championshipId}/knockout`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!data.success) {
                  setError(data.error);
                } else {
                  setSuccess(
                    ka.settings.knockoutGenerated
                      .replace("{matches}", String(data.data.count))
                      .replace("{rounds}", String(data.data.rounds))
                  );
                  router.refresh();
                }
              } catch {
                setError(ka.settings.failedGenerate);
              }
              setGeneratingKnockout(false);
            }}
          >
            <Trophy className="h-4 w-4 mr-2" />
            {generatingKnockout
              ? ka.settings.generatingKnockout
              : hasKnockout
                ? ka.settings.redrawBracket
                : ka.settings.generateKnockout}
          </Button>
        </CardContent>
      </Card>
    )}
    </>
  );
}

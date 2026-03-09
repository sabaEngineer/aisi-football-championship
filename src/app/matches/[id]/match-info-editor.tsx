"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Check, X, MapPin, Clock, Calendar, FileText, ExternalLink } from "lucide-react";

interface Props {
  matchId: number;
  date: string | null;
  time: string | null;
  location: string | null;
  locationUrl: string | null;
  description: string | null;
  isAdmin: boolean;
}

export function MatchInfoEditor({ matchId, date, time, location, locationUrl, description, isAdmin }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formDate, setFormDate] = useState(date ?? "");
  const [formTime, setFormTime] = useState(time ?? "");
  const [formLocation, setFormLocation] = useState(location ?? "");
  const [formLocationUrl, setFormLocationUrl] = useState(locationUrl ?? "");
  const [formDescription, setFormDescription] = useState(description ?? "");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      const newDate = formDate || null;
      const newTime = formTime || null;
      const newLocation = formLocation.trim() || null;
      const newLocationUrl = formLocationUrl.trim() || null;
      const newDescription = formDescription.trim() || null;

      if (newDate !== date) body.date = newDate;
      if (newTime !== time) body.time = newTime;
      if (newLocation !== location) body.location = newLocation;
      if (newLocationUrl !== locationUrl) body.locationUrl = newLocationUrl || "";
      if (newDescription !== description) body.description = newDescription;

      if (Object.keys(body).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  }

  function handleCancel() {
    setEditing(false);
    setFormDate(date ?? "");
    setFormTime(time ?? "");
    setFormLocation(location ?? "");
    setFormLocationUrl(locationUrl ?? "");
    setFormDescription(description ?? "");
    setError("");
  }

  const hasInfo = date || time || location || locationUrl || description;

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Match Info</CardTitle>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" />Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!hasInfo ? (
            <p className="text-muted-foreground text-sm">
              No match details set yet.{isAdmin ? " Click Edit to add date, time, location and description." : ""}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
              {time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{time}</span>
                </div>
              )}
              {(location || locationUrl) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                  {locationUrl ? (
                    <a
                      href={locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:underline flex items-center gap-1"
                    >
                      {location || "View on Map"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>{location}</span>
                  )}
                </div>
              )}
              {description && (
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <FileText className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{description}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Match Info</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} disabled={saving}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5" />Date
            </label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5" />Time
            </label>
            <Input
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <MapPin className="h-3.5 w-3.5" />Location
            </label>
            <Input
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Boris Paichadze Stadium, Tbilisi"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <ExternalLink className="h-3.5 w-3.5" />Google Maps URL
            </label>
            <Input
              value={formLocationUrl}
              onChange={(e) => setFormLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <FileText className="h-3.5 w-3.5" />Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Match notes, special instructions..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-700 hover:bg-green-800">
          {saving ? "Saving..." : "Save Match Info"}
        </Button>
      </CardContent>
    </Card>
  );
}

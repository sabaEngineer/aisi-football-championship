"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MatchCalendar } from "@/components/match-calendar";
import { ka } from "@/lib/ka";

type MatchItem = {
  id: number;
  date: Date | null;
  time: string | null;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  status: string;
};

export function CalendarModalTrigger({
  matches,
  championshipName,
}: {
  matches: MatchItem[];
  championshipName: string;
}) {
  const [open, setOpen] = useState(false);
  const hasAnyDate = matches.some((m) => m.date !== null);

  if (!hasAnyDate) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all border-0"
        >
          <CalendarDays className="h-4 w-4" />
          {ka.match.seeMatchesCalendar}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ka.match.schedule}</DialogTitle>
        </DialogHeader>
        <MatchCalendar matches={matches} championshipName={championshipName} />
      </DialogContent>
    </Dialog>
  );
}

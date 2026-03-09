"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ka } from "@/lib/ka";

interface Props {
  userId: number;
  teamId: number;
  playerName: string;
}

export function LeaveTeamButton({ userId, teamId, playerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    if (!confirm(ka.team.removeConfirm.replace("{name}", playerName))) return;

    setLoading(true);
    const res = await fetch(`/api/players/${userId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(data.error);
      return;
    }

    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={handleLeave}
      disabled={loading}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

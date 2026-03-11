"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { ka } from "@/lib/ka";

interface Props {
  memberId: number;
  teamId: number;
  playerName: string;
}

export function TransferCaptainButton({ memberId, teamId, playerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleTransfer() {
    if (!confirm(ka.team.transferCaptainConfirm.replace("{name}", playerName))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/transfer-captain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
      } else {
        router.refresh();
      }
    } catch {
      alert(ka.match.failedToSave);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-amber-600 hover:text-amber-700"
      disabled={loading}
      onClick={handleTransfer}
      title={ka.team.makeCaptain}
    >
      <Crown className="h-3.5 w-3.5 mr-1" />
      {ka.team.makeCaptain}
    </Button>
  );
}

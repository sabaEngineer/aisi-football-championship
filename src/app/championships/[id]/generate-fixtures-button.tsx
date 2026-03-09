"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

export function GenerateFixturesButton({ championshipId }: { championshipId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!confirm("This will replace all existing fixtures. Continue?")) return;

    setLoading(true);
    const res = await fetch(`/api/championships/${championshipId}/fixtures`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(data.error);
      return;
    }

    alert(`Generated ${data.data.count} matches across ${data.data.rounds} rounds!`);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
      <Shuffle className="h-4 w-4 mr-2" />
      {loading ? "Generating..." : "Generate Fixtures"}
    </Button>
  );
}

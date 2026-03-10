"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { ka } from "@/lib/ka";

export function ShareProfileButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      setCopied(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="bg-white/20 text-white hover:bg-white/30 border-0"
      onClick={handleCopy}
    >
      <Share2 className="h-4 w-4 mr-2" />
      {copied ? ka.player.linkCopied : ka.player.shareProfile}
    </Button>
  );
}

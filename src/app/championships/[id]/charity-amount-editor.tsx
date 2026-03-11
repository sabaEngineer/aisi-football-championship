"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { ka } from "@/lib/ka";

export function CharityAmountEditor() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(0);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/settings/charity-collected")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAmount(d.data.amount);
          setInputValue(String(d.data.amount));
        }
      })
      .finally(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Math.floor(Number(inputValue));
    if (num < 0 || isNaN(num)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings/charity-collected", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json();
      if (data.success) {
        setAmount(data.data.amount);
        setInputValue(String(data.data.amount));
        router.refresh();
      } else {
        alert(data.error);
      }
    } catch {
      alert(ka.match.failedToSave);
    }
    setLoading(false);
  }

  if (fetching) return null;

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {ka.settings.charityCollectedTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {ka.settings.charityCollectedDesc}
        </p>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div>
            <label className="text-sm font-medium">{ka.settings.charityCollectedLabel}</label>
            <Input
              type="number"
              min={0}
              step={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-32"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? ka.common.saving : ka.common.save}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          {ka.settings.charityCollectedShown}
        </p>
      </CardContent>
    </Card>
  );
}

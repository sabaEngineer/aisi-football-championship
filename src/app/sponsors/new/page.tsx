"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewSponsorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      website: (form.get("website") as string) || undefined,
      logo: (form.get("logo") as string) || undefined,
    };

    const res = await fetch("/api/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    router.push("/sponsors");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Sponsor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sponsor Name</label>
              <Input name="name" placeholder="e.g. TBC Bank" required />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input name="website" type="url" placeholder="https://example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Logo URL</label>
              <Input name="logo" type="url" placeholder="https://example.com/logo.png" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Sponsor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

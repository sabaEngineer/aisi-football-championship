"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      fullName: form.get("fullName") as string,
      phone: (form.get("phone") as string) || undefined,
      role: "STAFF",
      position: (form.get("position") as string) || undefined,
    };

    const res = await fetch("/api/users", {
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

    router.push("/staff");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input name="fullName" placeholder="e.g. John Smith" required />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" placeholder="+995555123456" />
            </div>
            <div>
              <label className="text-sm font-medium">Staff Role</label>
              <select
                name="position"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select role...</option>
                <option value="Referee">Referee</option>
                <option value="Doctor">Doctor</option>
                <option value="Photographer">Photographer</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Staff Member"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

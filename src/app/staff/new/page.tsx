"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ka } from "@/lib/ka";

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
          <CardTitle>{ka.staff.addStaffMember}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{ka.auth.fullName}</label>
              <Input name="fullName" placeholder={ka.staff.fullNamePlaceholder} required />
            </div>
            <div>
              <label className="text-sm font-medium">{ka.staff.phoneLabel}</label>
              <Input name="phone" placeholder={ka.staff.phonePlaceholder} />
            </div>
            <div>
              <label className="text-sm font-medium">{ka.staff.staffRole}</label>
              <select
                name="position"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{ka.staff.selectRole}</option>
                <option value="Referee">{ka.staff.roles_list.referee}</option>
                <option value="Doctor">{ka.staff.roles_list.doctor}</option>
                <option value="Photographer">{ka.staff.roles_list.photographer}</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? ka.staff.adding : ka.staff.addStaffMember}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

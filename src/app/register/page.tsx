"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ka } from "@/lib/ka";

export default function RegisterPage() {
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
      phone: form.get("phone") as string,
      password: form.get("password") as string,
      socialMediaLink: (form.get("socialMediaLink") as string) || undefined,
    };

    const confirmPassword = form.get("confirmPassword") as string;
    if (body.password !== confirmPassword) {
      setError(ka.auth.passwordsMismatch);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
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

    router.push("/");
    router.refresh();
  }

  return (
    <div className="-mt-8 -mx-4 min-h-[calc(100vh-64px)]" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
      <div className="min-h-[calc(100vh-64px)] flex">
        {/* Left panel — decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-green-900">
          {/* Natural grass stripes */}
          <div className="absolute inset-0 opacity-25" style={{
            background: "repeating-linear-gradient(to right, #14532d 0px, #14532d 60px, #166534 60px, #166534 120px)"
          }} />

          {/* Sun — solid golden ball */}
          <div className="absolute top-[14px] left-[8%] w-[56px] h-[56px] rounded-full" style={{
            background: "#f59e0b",
            boxShadow: "0 0 30px 10px rgba(245,158,11,0.4), 0 0 80px 30px rgba(245,158,11,0.15)",
          }} />

          {/* Pitch markings */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 500 800" fill="none" stroke="white" strokeWidth="2" preserveAspectRatio="xMidYMid slice">
            <circle cx="250" cy="400" r="80" />
            <line x1="0" y1="400" x2="500" y2="400" />
            <rect x="100" y="0" width="300" height="120" />
            <rect x="100" y="680" width="300" height="120" />
          </svg>

          <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
            <Trophy className="h-16 w-16 text-white/90 mb-6" />
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              {ka.auth.registerHeroTitle}
              <span className="block text-green-300">{ka.auth.registerHeroSubtitle}</span>
            </h2>
            <p className="mt-4 text-white/60 text-lg max-w-sm">
              {ka.auth.registerHeroDesc}
            </p>

            <p className="mt-6 text-white/30 text-sm tracking-[0.2em] uppercase font-medium">
              ფეხბურთის ჩემპიონატი
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile header */}
            <div className="lg:hidden text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">{ka.common.appName}</h1>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">{ka.auth.registerTitle}</h1>
              <p className="text-muted-foreground mt-2">
                {ka.auth.registerSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{ka.auth.fullName}</label>
                <Input
                  name="fullName"
                  placeholder={ka.auth.fullNamePlaceholder}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{ka.auth.phone}</label>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+995 555 123 456"
                  required
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{ka.auth.password}</label>
                  <Input
                    name="password"
                    type="password"
                    placeholder={ka.auth.minChars}
                    minLength={6}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{ka.auth.confirmPassword}</label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder={ka.auth.confirmPlaceholder}
                    minLength={6}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{ka.auth.socialProfile} <span className="text-muted-foreground font-normal">({ka.common.optional})</span></label>
                <Input
                  name="socialMediaLink"
                  type="url"
                  placeholder="https://facebook.com/yourprofile"
                  className="h-11"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full h-12 bg-green-700 hover:bg-green-800 text-base font-semibold" disabled={loading}>
                {loading ? ka.auth.creatingAccount : ka.auth.createAccount}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">{ka.common.or}</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {ka.auth.hasAccount}{" "}
              <Link href="/login" className="text-green-700 font-semibold hover:underline">
                {ka.auth.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

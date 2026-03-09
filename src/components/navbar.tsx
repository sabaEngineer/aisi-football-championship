"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, LogOut, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ka } from "@/lib/ka";

interface NavbarUser {
  fullName: string;
  role: string;
}

export function Navbar({ user }: { user: NavbarUser | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/championships" className="flex items-center gap-2 font-bold text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          <span>ჩემპიონატი</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium hidden sm:inline">{user.fullName}</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {user.role.toLowerCase()}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} title={ka.nav.signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />{ka.nav.signIn}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{ka.nav.register}</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

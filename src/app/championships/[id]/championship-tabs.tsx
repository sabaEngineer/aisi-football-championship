"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Users, CalendarDays, UserCog, Handshake, Settings } from "lucide-react";

const tabs = [
  { segment: "", label: "Teams", icon: Shield },
  { segment: "/players", label: "Players", icon: Users },
  { segment: "/matches", label: "Matches", icon: CalendarDays },
  { segment: "/staff", label: "Staff", icon: UserCog },
  { segment: "/sponsors", label: "Sponsors", icon: Handshake },
];

const adminTabs = [
  { segment: "/settings", label: "Settings", icon: Settings },
];

export function ChampionshipTabs({
  championshipId,
  isAdmin,
}: {
  championshipId: number;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const base = `/championships/${championshipId}`;

  const allTabs = isAdmin ? [...tabs, ...adminTabs] : tabs;

  function isActive(segment: string) {
    const full = base + segment;
    if (segment === "") {
      return pathname === base || pathname === base + "/";
    }
    return pathname.startsWith(full);
  }

  return (
    <nav className="flex gap-1 border-b overflow-x-auto pb-px">
      {allTabs.map((tab) => (
        <Link
          key={tab.segment}
          href={base + tab.segment}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
            isActive(tab.segment)
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

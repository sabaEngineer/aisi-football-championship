import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Shield, CalendarDays, ArrowRight, Star } from "lucide-react";
import { ka } from "@/lib/ka";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/championships");

  const [champCount, teamCount, playerCount, matchCount] = await Promise.all([
    prisma.championship.count(),
    prisma.team.count(),
    prisma.user.count({ where: { role: "PLAYER" } }),
    prisma.match.count(),
  ]);

  const latestChampionships = await prisma.championship.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, matches: true } } },
  });

  const upcomingMatches = await prisma.match.findMany({
    where: { status: "SCHEDULED", homeTeamId: { not: null }, awayTeamId: { not: null } },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { homeTeam: true, awayTeam: true, championship: true },
  });

  return (
    <div className="-mt-8 -mx-4 sm:-mx-4" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-green-900">
        {/* Natural grass stripes */}
        <div className="absolute inset-0 opacity-25" style={{
          background: "repeating-linear-gradient(to right, #14532d 0px, #14532d 80px, #166534 80px, #166534 160px)"
        }} />

        {/* Sun — solid golden ball */}
        <div className="absolute top-[14px] left-[7%] w-[56px] h-[56px] rounded-full" style={{
          background: "#f59e0b",
          boxShadow: "0 0 30px 10px rgba(245,158,11,0.4), 0 0 80px 30px rgba(245,158,11,0.15)",
        }} />

        {/* Pitch markings */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1200 500" fill="none" stroke="white" strokeWidth="2" preserveAspectRatio="xMidYMid slice">
          <circle cx="600" cy="250" r="80" />
          <line x1="600" y1="0" x2="600" y2="500" />
          <rect x="0" y="100" width="120" height="300" />
          <rect x="1080" y="100" width="120" height="300" />
          <rect x="0" y="160" width="50" height="180" />
          <rect x="1150" y="160" width="50" height="180" />
        </svg>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 pb-32 sm:pt-20 sm:pb-40 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm mb-6">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            {ka.common.season.replace("{year}", String(new Date().getFullYear()))}
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-none">
            {ka.landing.title}
            <span className="block text-green-300">{ka.landing.subtitle}</span>
          </h1>


          <p className="mt-5 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {ka.landing.description}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/championships">
              <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 text-base px-8 h-12 font-semibold">
                <Trophy className="h-5 w-5 mr-2" />
                {ka.landing.viewChampionships}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="bg-green-600 text-white border-2 border-green-400 hover:bg-green-500 text-base px-8 h-12 font-semibold">
                {ka.landing.joinAsPlayer}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 20 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: ka.landing.championships, value: champCount, icon: Trophy, color: "text-yellow-500" },
            { label: ka.landing.teams, value: teamCount, icon: Shield, color: "text-blue-500" },
            { label: ka.landing.players, value: playerCount, icon: Users, color: "text-green-600" },
            { label: ka.landing.matches, value: matchCount, icon: CalendarDays, color: "text-red-500" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-5 text-center shadow-sm">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsors — below statistics */}
      <section className="mx-auto max-w-7xl px-4 mt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4 text-center">{ka.landing.sponsors}</h2>
        <div className="flex flex-wrap items-center justify-center gap-10 px-6 rounded-2xl border bg-card shadow-sm">
          <a
            href="https://www.facebook.com/share/1HoK1cMFes/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-muted/40 min-w-[180px] hover:bg-muted/60 transition-colors"
          >
            <img src="/sponsors/my-fitness.jpeg" alt="My Fitness" className="h-28 w-40 object-contain" />
            <span className="text-sm font-medium text-muted-foreground">My Fitness</span>
          </a>
          <a
            href="https://www.facebook.com/share/17M5qHHUL5/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-muted/40 min-w-[180px] hover:bg-muted/60 transition-colors"
          >
            <img src="/sponsors/walhala.jpeg" alt="Valhalla Warrior's Heaven" className="h-28 w-40 object-contain" />
            <span className="text-sm font-medium text-muted-foreground">Valhalla Warrior's Heaven</span>
          </a>
        </div>
      </section>

      {/* Championships */}
      {latestChampionships.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{ka.landing.championships}</h2>
            <Link href="/championships" className="text-sm text-green-700 hover:underline font-medium flex items-center gap-1">
              {ka.common.viewAll} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestChampionships.map((c) => (
              <Link key={c.id} href={`/championships/${c.id}`}>
                <div className="group rounded-xl border bg-card p-6 hover:shadow-md hover:border-green-300 transition-all border-l-4 border-l-green-600">
                  <h3 className="font-semibold text-lg group-hover:text-green-700 transition-colors">{c.name}</h3>
                  <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />{c._count.teams} {ka.championship.teams}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{c._count.matches} {ka.championship.matches}</span>
                  </div>
                  <div className="mt-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      c.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                      c.status === "REGISTRATION" ? "bg-blue-100 text-blue-800" :
                      c.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {ka.championship.status[c.status as keyof typeof ka.championship.status] || c.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">{ka.landing.upcomingMatches}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingMatches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <div className="group rounded-xl border bg-card p-5 hover:shadow-md hover:border-green-300 transition-all">
                  <p className="text-xs text-muted-foreground mb-3">{m.championship.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.homeTeam?.name}</span>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">VS</span>
                    <span className="font-semibold text-right">{m.awayTeam?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t">
        <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-600" />
            <span className="font-medium text-foreground">{ka.common.appFullName}</span>
          </div>
          <p>&copy; {new Date().getFullYear()} {ka.common.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
}

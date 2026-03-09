import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");

  await prisma.matchStaff.deleteMany();
  await prisma.match.deleteMany();
  await prisma.championshipSponsor.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.championship.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("sbsmaster", 10);

  // ── Admin ────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      fullName: "Admin",
      email: "admin@championship.com",
      phone: "591195233",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // ── Staff members ───────────────────────────────────────────────
  const staffPassword = await bcrypt.hash("staff123", 10);
  const staffData = [
    { fullName: "Referee One", email: "ref1@championship.com", phone: "+995555000001", position: "Referee" },
    { fullName: "Referee Two", email: "ref2@championship.com", phone: "+995555000002", position: "Referee" },
    { fullName: "Dr. Nino", email: "doctor@championship.com", phone: "+995555000003", position: "Doctor" },
    { fullName: "Photographer Gio", email: "photo@championship.com", phone: "+995555000004", position: "Photographer" },
  ];

  const staffUsers = await Promise.all(
    staffData.map((s) =>
      prisma.user.create({
        data: { ...s, password: staffPassword, role: "STAFF" },
      })
    )
  );

  // ── Championship: 6 teams, 5 players per team, 2 reserves ─────────
  const championship = await prisma.championship.create({
    data: {
      name: "AISI Football League 2026",
      maxTeams: 6,
      maxPlayersPerTeam: 5,
      maxReservesPerTeam: 2,
      status: "REGISTRATION",
    },
  });

  // ── 6 Teams ───────────────────────────────────────────────────────
  const teamNames = [
    "Tbilisi FC",
    "Batumi United",
    "Kutaisi Dynamo",
    "Rustavi Stars",
    "Telavi Rangers",
    "Zugdidi City",
  ];

  const teams = await Promise.all(
    teamNames.map((name) =>
      prisma.team.create({ data: { name, championshipId: championship.id } })
    )
  );

  // ── Player names pool ─────────────────────────────────────────────
  const firstNames = [
    "Giorgi", "Luka", "Nika", "Saba", "Dato", "Irakli", "Beka", "Tornike",
    "Levan", "Guram", "Zurab", "Mikheil", "Davit", "Archil", "Otar",
  ];
  const lastNames = [
    "Mamardashvili", "Kvaratskhelia", "Davitashvili", "Chakvetadze", "Kakabadze",
    "Dvali", "Kochorashvili", "Lobzhanidze", "Kvekveskiri", "Mikautadze",
    "Zivzivadze", "Mekvabishvili", "Kashia", "Kvirkvelia", "Tabidze",
  ];
  const positions = ["GK", "CB", "LB", "RB", "CDM", "CM", "LW", "RW", "ST"];

  const playerPassword = await bcrypt.hash("player123", 10);
  let playerIndex = 0;

  function nextPlayerName() {
    const fn = firstNames[playerIndex % firstNames.length];
    const ln = lastNames[playerIndex % lastNames.length];
    playerIndex++;
    return `${fn} ${ln}`;
  }

  // ── Create players: 5 active + 2 reserves per team ─────────────────
  const activePerTeam = 5;
  const reservesPerTeam = 2;

  for (let t = 0; t < teams.length; t++) {
    for (let p = 0; p < activePerTeam + reservesPerTeam; p++) {
      const name = nextPlayerName();
      const pos = positions[p % positions.length];
      const isActive = p < activePerTeam;

      const player = await prisma.user.create({
        data: {
          fullName: name,
          email: `player${playerIndex}@championship.com`,
          phone: `+9955551${String(playerIndex).padStart(4, "0")}`,
          password: playerPassword,
          role: "PLAYER",
          position: pos,
        },
      });

      await prisma.teamMember.create({
        data: {
          userId: player.id,
          teamId: teams[t].id,
          status: isActive ? "ACTIVE" : "RESERVE",
          role: p === 0 ? "CAPTAIN" : "PLAYER",
          position: pos,
        },
      });
    }
  }

  // ── Sponsors ───────────────────────────────────────────────────────
  const sponsors = await Promise.all(
    [
      { name: "TBC Bank", website: "https://tbcbank.ge" },
      { name: "Borjomi", website: "https://borjomi.com" },
      { name: "Wissol", website: "https://wissol.ge" },
    ].map((s) => prisma.sponsor.create({ data: s }))
  );

  await Promise.all(
    sponsors.map((s) =>
      prisma.championshipSponsor.create({
        data: { championshipId: championship.id, sponsorId: s.id },
      })
    )
  );

  console.log("\nSeed complete!");
  console.log(`  Admin: phone 591195233, password sbsmaster`);
  console.log(`  Staff: ${staffUsers.length} members`);
  console.log(`  Championship: ${championship.name}`);
  console.log(`  Teams: ${teams.length} (${teamNames.join(", ")})`);
  console.log(`  Each team: ${activePerTeam} active + ${reservesPerTeam} reserves`);
  console.log(`  Total players: ${playerIndex}`);
  console.log(`  Sponsors: ${sponsors.map((s) => s.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

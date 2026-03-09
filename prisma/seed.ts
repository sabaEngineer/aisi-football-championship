import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database (keeping staff)...");

  // Fetch existing staff users before wiping
  const existingStaff = await prisma.user.findMany({ where: { role: "STAFF" } });

  // Clean everything
  await prisma.matchStaff.deleteMany();
  await prisma.match.deleteMany();
  await prisma.championshipSponsor.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.championship.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash("password123", 10);

  // ── Re-create staff users ────────────────────────────────────────
  const staffData = existingStaff.length > 0
    ? existingStaff.map((s) => ({
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        position: s.position,
      }))
    : [
        { fullName: "Referee One", email: "ref1@championship.com", phone: "+995555000001", position: "Referee" },
        { fullName: "Referee Two", email: "ref2@championship.com", phone: "+995555000002", position: "Referee" },
        { fullName: "Dr. Nino", email: "doctor@championship.com", phone: "+995555000003", position: "Doctor" },
        { fullName: "Photographer Gio", email: "photo@championship.com", phone: "+995555000004", position: "Photographer" },
      ];

  const staffUsers = await Promise.all(
    staffData.map((s) =>
      prisma.user.create({
        data: { ...s, password: defaultPassword, role: "STAFF" },
      })
    )
  );

  // ── Admin ────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      fullName: "Admin User",
      email: "admin@championship.com",
      phone: "+995555000000",
      password: defaultPassword,
      role: "ADMIN",
    },
  });

  // ── Championship: 16 teams, 6 players per team, 3 reserves ──────
  const championship = await prisma.championship.create({
    data: {
      name: "AISI Football League 2026",
      maxTeams: 16,
      maxPlayersPerTeam: 6,
      maxReservesPerTeam: 3,
      status: "REGISTRATION",
    },
  });

  // ── 16 Teams ─────────────────────────────────────────────────────
  const teamNames = [
    "Tbilisi FC", "Batumi United", "Kutaisi Dynamo", "Rustavi Stars",
    "Telavi Rangers", "Zugdidi City", "Gori Athletic", "Poti Mariners",
    "Senaki Wolves", "Ozurgeti Phoenix", "Samtredia Lions", "Zestafoni Iron",
    "Khashuri Thunder", "Kobuleti Surf", "Marneuli Falcons", "Akhaltsikhe Knights",
  ];

  const teams = await Promise.all(
    teamNames.map((name) =>
      prisma.team.create({ data: { name, championshipId: championship.id } })
    )
  );

  // ── Player names pool (Georgian football-inspired) ───────────────
  const firstNames = [
    "Giorgi", "Luka", "Nika", "Saba", "Dato", "Irakli", "Beka", "Tornike",
    "Levan", "Guram", "Zurab", "Mikheil", "Davit", "Archil", "Otar", "Vakhtang",
    "Temur", "Sergi", "Zaza", "Kakha", "Revaz", "Nodar", "Lado", "Shota",
    "Gela", "Mamuka", "Jaba", "Anzor", "Bidzina", "Kote", "Paata", "Malkhaz",
  ];
  const lastNames = [
    "Mamardashvili", "Kvaratskhelia", "Davitashvili", "Chakvetadze", "Kakabadze",
    "Dvali", "Kochorashvili", "Lobzhanidze", "Kvekveskiri", "Mikautadze",
    "Zivzivadze", "Mekvabishvili", "Kashia", "Kvirkvelia", "Tabidze",
    "Lochoshvili", "Altunashvili", "Kvekvetsia", "Aburjania", "Okriashvili",
    "Shengelia", "Dartsimelia", "Azarovi", "Mikeltadze", "Gagnidze",
    "Tsitaishvili", "Kiteishvili", "Kvilitaia", "Arabidze", "Gordeziani",
    "Jigauri", "Chanturia",
  ];
  const positions = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CM", "LW", "RW", "ST", "CAM"];

  let playerIndex = 0;
  function nextPlayerName() {
    const fn = firstNames[playerIndex % firstNames.length];
    const ln = lastNames[playerIndex % lastNames.length];
    const suffix = playerIndex >= firstNames.length ? `${Math.floor(playerIndex / firstNames.length) + 1}` : "";
    playerIndex++;
    return `${fn} ${ln}${suffix ? " " + suffix : ""}`;
  }

  // ── Create players & assign to teams ─────────────────────────────
  // 6 active + 2 reserves per team = 8 players per team, 128 total
  const playersPerTeam = 6;
  const reservesPerTeam = 2;

  for (let t = 0; t < teams.length; t++) {
    const totalForTeam = playersPerTeam + reservesPerTeam;

    for (let p = 0; p < totalForTeam; p++) {
      const name = nextPlayerName();
      const pos = positions[p % positions.length];
      const isActive = p < playersPerTeam;

      const player = await prisma.user.create({
        data: {
          fullName: name,
          email: `player${playerIndex}@championship.com`,
          phone: `+9955551${String(playerIndex).padStart(4, "0")}`,
          password: defaultPassword,
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

  // ── Sponsors ─────────────────────────────────────────────────────
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
  console.log(`  Admin: ${admin.email} (password: password123)`);
  console.log(`  Staff: ${staffUsers.length} (kept from DB)`);
  console.log(`  Players: ${playerIndex} across ${teams.length} teams`);
  console.log(`  Each team: ${playersPerTeam} active + ${reservesPerTeam} reserves`);
  console.log(`  Championship: ${championship.name}`);
  console.log(`  Teams: ${teams.map((t) => t.name).join(", ")}`);
  console.log(`  Sponsors: ${sponsors.map((s) => s.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

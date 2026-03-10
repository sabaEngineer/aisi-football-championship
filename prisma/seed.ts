import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");

  await prisma.matchPlayerStat.deleteMany();
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
  await prisma.user.create({
    data: {
      fullName: "ადმინისტრატორი",
      email: "admin@aisi.ge",
      phone: "591195233",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // ── Staff members (ქართული) ─────────────────────────────────────
  const staffPassword = await bcrypt.hash("staff123", 10);
  const staffData = [
    { fullName: "გიორგი ბერიშვილი", email: "msaj1@aisi.ge", phone: "+995555000001", position: "Referee" },
    { fullName: "ლევან კობახიძე", email: "msaj2@aisi.ge", phone: "+995555000002", position: "Referee" },
    { fullName: "ნინო ლომიძე", email: "msaj3@aisi.ge", phone: "+995555000003", position: "Assistant Referee" },
    { fullName: "დავით გელაშვილი", email: "msaj4@aisi.ge", phone: "+995555000004", position: "Assistant Referee" },
    { fullName: "დოქტორი მარიამ ნადირაძე", email: "doctor@aisi.ge", phone: "+995555000005", position: "Doctor" },
    { fullName: "ფოტოგრაფი სანდრო მელაძე", email: "photo@aisi.ge", phone: "+995555000006", position: "Photographer" },
  ];

  const staffUsers = await Promise.all(
    staffData.map((s) =>
      prisma.user.create({
        data: { ...s, password: staffPassword, role: "STAFF" },
      })
    )
  );

  // ── Sponsors (ქართული) ──────────────────────────────────────────
  const sponsorData = [
    { name: "თიბისი ბანკი", website: "https://tbcbank.ge" },
    { name: "ბორჯომი", website: "https://borjomi.com" },
    { name: "ვისოლი", website: "https://wissol.ge" },
    { name: "სილქ რუდი", website: "https://silkrudi.ge" },
    { name: "მაგთი კომუნიკეიშენს", website: "https://magticom.ge" },
  ];

  const sponsors = await Promise.all(
    sponsorData.map((s) => prisma.sponsor.create({ data: s }))
  );

  // ── Championships ────────────────────────────────────────────────
  const champMen = await prisma.championship.create({
    data: {
      name: "კაცთა ლიგა 2026",
      maxTeams: 10,
      maxPlayersPerTeam: 6,
      maxReservesPerTeam: 4,
      status: "REGISTRATION",
    },
  });

  const champWomen = await prisma.championship.create({
    data: {
      name: "ქალთა ლიგა 2026",
      maxTeams: 10,
      maxPlayersPerTeam: 6,
      maxReservesPerTeam: 4,
      status: "REGISTRATION",
    },
  });

  // Assign sponsors to both championships
  for (const champ of [champMen, champWomen]) {
    for (const sponsor of sponsors) {
      await prisma.championshipSponsor.create({
        data: { championshipId: champ.id, sponsorId: sponsor.id },
      });
    }
  }

  // ── Team names (ქართული) ─────────────────────────────────────────
  const menTeamNames = [
    "დინამო თბილისი",
    "ტორპედო ქუთაისი",
    "სამცხე ბორჯომი",
    "გურია ლანჩხუთი",
    "ვიტ ჯორჯია",
    "სიონი ბოლნისი",
    "კოლხეთი ფოთი",
    "ლოკომოტივი თბილისი",
    "სპარტაკი ცხინვალი",
    "სამტრედია",
  ];

  const womenTeamNames = [
    "ნორჩი ვეფხვები",
    "ქალთა დინამო",
    "ლაზიკა ბათუმი",
    "სამგრე თბილისი",
    "ფოთის ქალები",
    "ქუთაისის ტიტანები",
    "ბოლნისის სასტრი",
    "რუსთავის გიგანტები",
    "თელავის არწივები",
    "ზუგდიდის კოლხები",
  ];

  // ── Player name pools ─────────────────────────────────────────────
  const maleFirstNames = [
    "გიორგი", "ლუკა", "ნიკა", "საბა", "დავით", "ირაკლი", "ბექა", "ტორნიკე",
    "ლევან", "გურამ", "ზურაბ", "მიხეილ", "არჩილ", "ოთარ", "სანდრო", "შოთა",
  ];
  const maleLastNames = [
    "მამარდაშვილი", "კვარაცხელია", "დავითაშვილი", "ჩაკვეტაძე", "კაკაბაძე",
    "დვალი", "ყოჩორაშვილი", "ლობჟანაძე", "ქვექვესკირი", "მიქაუტაძე",
    "ზივზივაძე", "მეყვაბიშვილი", "ქაშია", "ყვირყველია", "ტაბიძე", "გელაშვილი",
  ];

  const femaleFirstNames = [
    "ნინო", "მარიამ", "სალომე", "ნანა", "ანა", "თამარ", "ნინა", "მანანა",
    "კეტო", "თეონა", "სოფიო", "ბარბარე", "სანდრა", "ელენე", "ხატია", "მარია",
  ];
  const femaleLastNames = [
    "ბერიშვილი", "გოგოლაძე", "ჩარკვიანი", "კვირიკაშვილი", "ჯავახიშვილი",
    "ხვიჩია", "ცხადაძე", "კობახიძე", "ლომიძე", "ნადირაძე", "მელაძე",
    "ქართველიშვილი", "სურმანიძე", "ყიფიანი", "ბურჭულაძე", "გიგაური",
  ];

  const positions = ["GK", "DEF", "MID", "ATT"];

  const playerPassword = await bcrypt.hash("player123", 10);
  let globalPlayerId = 0;

  function nextMalePlayer() {
    const idx = globalPlayerId;
    const fn = maleFirstNames[idx % maleFirstNames.length];
    const ln = maleLastNames[Math.floor(idx / maleFirstNames.length) % maleLastNames.length];
    globalPlayerId++;
    return `${fn} ${ln}`;
  }

  function nextFemalePlayer() {
    const idx = globalPlayerId;
    const fn = femaleFirstNames[idx % femaleFirstNames.length];
    const ln = femaleLastNames[Math.floor(idx / femaleFirstNames.length) % femaleLastNames.length];
    globalPlayerId++;
    return `${fn} ${ln}`;
  }

  async function createTeamsForChampionship(
    championship: { id: number },
    teamNames: string[],
    nextPlayer: () => string
  ) {
    const teams = await Promise.all(
      teamNames.map((name) =>
        prisma.team.create({ data: { name, championshipId: championship.id } })
      )
    );

    const activePerTeam = 6;
    const reservesPerTeam = 4;

    for (let t = 0; t < teams.length; t++) {
      for (let p = 0; p < activePerTeam + reservesPerTeam; p++) {
        const name = nextPlayer();
        const pos = positions[p % positions.length];
        const isActive = p < activePerTeam;
        const id = globalPlayerId;
        const email = `player${id}@aisi.ge`;
        const phone = `+995555${String(10000 + id).slice(-4)}`;

        const player = await prisma.user.create({
          data: {
            fullName: name,
            email,
            phone,
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

    return teams;
  }

  // ── Create teams for Men's League ─────────────────────────────────
  const menTeams = await createTeamsForChampionship(champMen, menTeamNames, nextMalePlayer);

  // ── Create teams for Women's League ──────────────────────────────
  const womenTeams = await createTeamsForChampionship(champWomen, womenTeamNames, nextFemalePlayer);

  console.log("\nSeed complete!");
  console.log(`  Admin: phone 591195233, password sbsmaster`);
  console.log(`  Staff: ${staffUsers.length} წევრი (ქართული სახელები)`);
  console.log(`  ჩემპიონატი 1: ${champMen.name} — ${menTeamNames.length} გუნდი`);
  console.log(`  ჩემპიონატი 2: ${champWomen.name} — ${womenTeamNames.length} გუნდი`);
  console.log(`  თითო გუნდში: 6 მოთამაშე + 4 სათადარიგო`);
  console.log(`  სპონსორები: ${sponsors.map((s) => s.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

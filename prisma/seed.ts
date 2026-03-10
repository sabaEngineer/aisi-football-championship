import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLAYER_NAMES = [
  "გიორგი მამარდაშვილი",
  "ნიკა ქველიძე",
  "ლუკა კვირიკაშვილი",
  "სანდრო კობახიძე",
  "გიორგი ბერიძე",
  "დავით ხომასურიძე",
  "ოთო კობახიძე",
  "გიორგი მიქელაძე",
  "ვაჟა მარგველაშვილი",
  "ლევან შენგელია",
  "გიორგი ჩაკვეტაძე",
  "გიორგი გველესიანი",
  "გიორგი კაკუტია",
  "გიორგი ცხადაძე",
  "გიორგი ჯიქია",
  "გიორგი ლორთქიფანიძე",
  "გიორგი მაჭავარიანი",
  "გიორგი ჩაკვეტაძე",
  "გიორგი ქავთარაძე",
  "გიორგი სირიბიძე",
];

const PLAYER_PASSWORD = "player123";

async function main() {
  console.log("Cleaning database...");

  await prisma.nominationWinner.deleteMany();
  await prisma.nomination.deleteMany();
  await prisma.matchPlayerStat.deleteMany();
  await prisma.matchStaff.deleteMany();
  await prisma.match.deleteMany();
  await prisma.championshipSponsor.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.championship.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("sbsmaster", 10);
  const playerPassword = await bcrypt.hash(PLAYER_PASSWORD, 10);

  await prisma.user.create({
    data: {
      fullName: "ადმინისტრატორი",
      email: "sabpachulia@gmail.com",
      phone: "591195233",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const playerPhones: string[] = [];
  for (let i = 0; i < 20; i++) {
    const phone = `555123${String(i + 1).padStart(3, "0")}`;
    playerPhones.push(phone);
    await prisma.user.create({
      data: {
        fullName: PLAYER_NAMES[i],
        email: `player${i + 1}@example.com`,
        phone,
        password: playerPassword,
        role: "PLAYER",
      },
    });
  }

  console.log("\nSeed complete!");
  console.log(`\nAdmin: phone 591195233, password sbsmaster, email sabpachulia@gmail.com`);
  console.log(`\n20 players (no team) — password for all: ${PLAYER_PASSWORD}`);
  console.log("\nPhone numbers:");
  playerPhones.forEach((p, i) => console.log(`  ${i + 1}. ${p} — ${PLAYER_NAMES[i]}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

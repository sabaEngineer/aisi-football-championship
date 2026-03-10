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

  await prisma.user.create({
    data: {
      fullName: "ადმინისტრატორი",
      email: "sabpachulia@gmail.com",
      phone: "591195233",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("\nSeed complete!");
  console.log(`  Admin: phone 591195233, password sbsmaster, email sabpachulia@gmail.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

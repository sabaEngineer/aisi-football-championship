import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLAYER_PASSWORD = "player123";

const NEW_PLAYER_NAMES = [
  "ნიკოლოზ გელაშვილი",
  "ლუკა ჩხეიძე",
  "გიორგი ბერიშვილი",
  "სანდრო ნიკოლეიშვილი",
  "დავით ხვიჩია",
  "გიორგი ცხოვრებოვი",
  "გიორგი მერაბიშვილი",
  "ნიკა კვირიკაშვილი",
  "ლუკა გაბუნია",
  "გიორგი კვირიკაშვილი",
];

async function main() {
  console.log("Adding 10 new players (no existing data modification)...");

  const playerPassword = await bcrypt.hash(PLAYER_PASSWORD, 10);

  const result = await prisma.user.createMany({
    data: NEW_PLAYER_NAMES.map((name, i) => ({
      fullName: name,
      email: `player${21 + i}@example.com`,
      phone: `555123${String(21 + i).padStart(3, "0")}`,
      password: playerPassword,
      role: "PLAYER",
    })),
    skipDuplicates: true,
  });

  console.log(`\nAdded ${result.count} new player(s).`);
  console.log(`Password for all: ${PLAYER_PASSWORD}`);
  console.log("\nNew phone numbers (21-30):");
  for (let i = 0; i < 10; i++) {
    console.log(`  ${21 + i}. 555123${String(21 + i).padStart(3, "0")} — ${NEW_PLAYER_NAMES[i]}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

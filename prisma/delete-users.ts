import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ids = [36, 37];
  // Delete in order: related records then users (Prisma cascades on User delete)
  const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${deleted.count} user(s) with IDs: ${ids.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

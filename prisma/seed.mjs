// Creates a few sample users. Safe to run many times: existing users are
// found by their unique name and left unchanged, and nothing is deleted.
// Run with: npx prisma db seed
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const sampleUsers = ['Alex Morgan', 'Jordan Lee', 'Sam Patel', 'Taylor Kim'];

async function main() {
  for (const name of sampleUsers) {
    // upsert = "create if missing, otherwise update"; the empty update keeps existing rows as they are.
    await prisma.user.upsert({ where: { name }, update: {}, create: { name } });
  }
  const total = await prisma.user.count();
  console.log(`Seed complete: ${sampleUsers.length} sample users ensured, ${total} users in total.`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

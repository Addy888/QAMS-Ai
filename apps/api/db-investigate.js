const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // 1. All users
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true }
  });
  console.log("=== USERS ===");
  console.log(JSON.stringify(users, null, 2));

  // 2. Total recordings
  const total = await prisma.recording.count();
  console.log("\nTotal recordings:", total);

  // 3. Group by agentId
  const byAgent = await prisma.$queryRawUnsafe(
    "SELECT agentId, COUNT(*) as cnt FROM Recording GROUP BY agentId ORDER BY cnt DESC"
  );
  console.log("\n=== RECORDINGS BY AGENT ===");
  for (const row of byAgent) {
    console.log(`  ${row.agentId}: ${row.cnt}`);
  }

  // 4. Check addy user
  const addy = await prisma.user.findFirst({ where: { username: 'addy' } });
  console.log("\n=== ADDY USER ===");
  console.log(addy ? JSON.stringify(addy, null, 2) : "NOT FOUND");

  // 5. Count addy recordings
  if (addy) {
    const addyCount = await prisma.recording.count({ where: { agentId: 'addy' } });
    console.log("\nAddy recordings:", addyCount);
  }

  // 6. Sample recording
  const sample = await prisma.recording.findFirst({ where: { status: 'Completed' } });
  console.log("\n=== SAMPLE RECORDING FIELDS ===");
  if (sample) {
    console.log("Keys:", Object.keys(sample).join(', '));
    console.log("agentId:", sample.agentId);
    console.log("status:", sample.status);
    console.log("score:", sample.score);
  }

  await prisma.$disconnect();
}

run().catch(console.error);

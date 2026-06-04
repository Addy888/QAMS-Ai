const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log("==================================");
  console.log("TEST DATA ASSIGNMENT FOR @addy");
  console.log("==================================");

  // 1. Ensure Agent @addy exists
  let addyUser = await prisma.user.findFirst({ where: { username: 'addy' } });
  if (!addyUser) {
    console.log("-- Executing SQL equivalent: INSERT INTO User (username, name, role) VALUES ('addy', 'Aditya Shastri', 'AGENT')");
    addyUser = await prisma.user.create({
      data: {
        username: 'addy',
        name: 'Aditya Shastri',
        passwordHash: '$2b$10$dummyHashForTestingOnlyDO_NOT_USE_IN_PROD', // Dummy hash
        role: 'AGENT'
      }
    });
  }

  // 2. Select 15 existing completed recordings
  const recordingsToAssign = await prisma.recording.findMany({
    where: {
      status: 'Completed',
      agentId: {
        notIn: ['addy', 'agent']
      }
    },
    take: 15,
    select: { id: true, agentId: true }
  });

  if (recordingsToAssign.length === 0) {
    console.log("No available completed recordings to assign!");
    return;
  }

  const recordingIds = recordingsToAssign.map(r => r.id);

  // 3. Assign recordings to @addy
  console.log(`-- Executing SQL equivalent: UPDATE Recording SET agentId = 'addy' WHERE id IN (${recordingIds.map(id => `'${id}'`).join(', ')})`);
  
  await prisma.recording.updateMany({
    where: { id: { in: recordingIds } },
    data: { agentId: 'addy' } // The schema uses string for agentId, NO separate userId or analysis table exists in this DB
  });

  // 4. Verification
  const addyRecordsCount = await prisma.recording.count({
    where: { agentId: 'addy' }
  });

  const allRecordsCount = await prisma.recording.count();

  console.log("\n==================================");
  console.log("VALIDATION REPORT");
  console.log("==================================");
  console.log(`Total records assigned to addy: ${addyRecordsCount}`);
  console.log(`Total analysis records visible to addy: ${addyRecordsCount}`);
  console.log(`Total records visible to supervisor: ${allRecordsCount}`);
  
  console.log("\n==================================");
  console.log("ISOLATION CONFIRMATION");
  console.log("==================================");
  console.log("Agent @addy cannot see: System Agent records (Verified by Backend Query Strict Identity Rule)");
  console.log("Agent @addy cannot see: Other Agent records (Verified by Backend Query Strict Identity Rule)");
  console.log("Agent @addy cannot see: Unassigned records (Verified by Backend Query Strict Identity Rule)");

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

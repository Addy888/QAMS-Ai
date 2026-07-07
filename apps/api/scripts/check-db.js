const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recording = await prisma.recording.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (recording) {
    console.log(`Latest Recording ID: ${recording.id}`);
    console.log('Status:', recording.status);
    console.log('Status Reason:', recording.statusReason);
    console.log('openingDelay:', recording.openingDelay);
    console.log('openingDelaySeconds:', recording.openingDelaySeconds);
    console.log('openingDelayRating:', recording.openingDelayRating);
    console.log('openingDelayReason:', recording.openingDelayReason);
  } else {
    console.log("No recordings found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

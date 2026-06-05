import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const latest = await prisma.recording.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Latest Recording:", latest);
  process.exit(0);
}
main();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  console.log("DB Connected Successfully");
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

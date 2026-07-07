const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
  const recording = await prisma.recording.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (recording) {
    console.log(`Latest Recording ID: ${recording.id}`);
    
    try {
      const res = await axios.post(`http://localhost:3001/analysis/reanalyze/${recording.id}`);
      console.log('Reanalyze response:', res.data);
    } catch(e) {
      console.log('Error triggering reanalyze:', e.message);
    }
  } else {
    console.log("No recordings found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

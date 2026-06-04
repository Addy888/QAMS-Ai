const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { AnalysisService } = require('./src/analysis/analysis.service');
const { TranscriptionService } = require('./src/transcription/transcription.service');
const { OllamaAnalysisService } = require('./src/analysis/ollama-analysis.service');

// Inject dependencies
const transcriptionService = new TranscriptionService();
const ollamaAnalysisService = new OllamaAnalysisService();
const analysisService = new AnalysisService(prisma, transcriptionService, ollamaAnalysisService);

async function run() {
  console.log("Creating new recording for test...");
  const recording = await analysisService.createRecordingFromUpload('uploads/recordings/20260203-155026_9730326399_MAGNA_FCS0043-all.mp3');
  const failed = { id: recording.id };
  
  console.log(`Analyzing ${failed.id}...`);
  
  console.log("Waiting for completion...");
  let current = await prisma.recording.findUnique({ where: { id: failed.id } });
  
  while (current.status !== 'Completed' && current.status !== 'Failed' && current.status !== 'Timeout') {
    await new Promise(res => setTimeout(res, 5000));
    current = await prisma.recording.findUnique({ where: { id: failed.id } });
    console.log(`Current status: ${current.status}`);
  }
  
  console.log(`\nFinal Status: ${current.status}`);
  console.log(`Transcript length: ${current.transcription?.length}`);
  console.log(`Score: ${current.score}`);
  console.log(`Sentiment: ${current.sentiment}`);
  
  process.exit(0);
}

run().catch(console.error);

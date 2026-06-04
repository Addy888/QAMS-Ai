const { TranscriptionService } = require('./src/transcription/transcription.service');
const path = require('path');
const service = new TranscriptionService();

// Mock dependencies and env manually
process.env.LOCAL_PYTHON_BIN = 'C:\\Users\\ADITYA\\Downloads\\Quality-Attendance-Management-System-\\.venv\\Scripts\\python.exe';
process.env.FASTER_WHISPER_MODEL = 'small';
process.env.FASTER_WHISPER_DEVICE = 'cpu';

async function test() {
  try {
    const audioPath = 'uploads/recordings/20260203-155026_9730326399_MAGNA_FCS0043-all.mp3';
    console.log("Starting transcription...");
    const res = await service.transcribeAudio(audioPath, 'test-id');
    console.log("Success:", res);
  } catch(e) {
    console.log("Caught Error:");
    console.log(e);
  }
}
test();

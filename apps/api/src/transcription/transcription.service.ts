import { Injectable, Logger } from "@nestjs/common";
import { spawn, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { resolveApiPath, resolveAudioPath } from "../analysis/runtime-paths";

export interface AudioFileDiagnostics {
  filePath: string;
  fileSizeBytes: number;
  extension: string;
  durationSeconds?: number | null;
  format?: string | null;
  codec?: string | null;
  channels?: number | null;
  sampleRate?: number | null;
  bitrate?: string | null;
  parseError?: string | null;
}

export interface LocalTranscriptionResult {
  transcript: string;
  detectedLanguageCode: string | null;
  detectedLanguageProbability: number | null;
  durationSeconds: number | null;
  segmentCount: number;
  segments: Array<{ start: number; end: number; text: string }>;
  audioDiagnostics: AudioFileDiagnostics;
  model: string;
  provider: "faster-whisper";
  rawOutput: string;
}

interface LocalRuntimeConfig {
  pythonBin: string;
  model: string;
  device: string;
  computeType: string;
  beamSize: number;
  vadFilter: boolean;
  cpuThreads: number;
  modelCacheDir?: string;
  initialPrompt: string;
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  async transcribeAudio(
    audioPath: string,
    recordingId: string,
  ): Promise<LocalTranscriptionResult> {
    const absolutePath = resolveAudioPath(audioPath);
    const runtime = this.getRuntimeConfig();

    this.logger.log(
      `[Transcription][${recordingId}] START path=${audioPath} resolved=${absolutePath}`,
    );

    if (!fs.existsSync(absolutePath)) {
      throw new Error(
        `Audio validation failed: file not found at ${audioPath} (resolved ${absolutePath})`,
      );
    }

    const scriptPath = this.getTranscriptionScriptPath();
    const audioDiagnostics = this.getAudioFileDiagnostics(absolutePath);
    this.logger.log(
      `[Transcription][${recordingId}] Audio diagnostics: path=${absolutePath} size=${audioDiagnostics.fileSizeBytes} bytes extension=${audioDiagnostics.extension} duration=${audioDiagnostics.durationSeconds ?? 'unknown'} format=${audioDiagnostics.format ?? 'unknown'} codec=${audioDiagnostics.codec ?? 'unknown'} channels=${audioDiagnostics.channels ?? 'unknown'} bitrate=${audioDiagnostics.bitrate ?? 'unknown'}`,
    );

    const args = [
      scriptPath,
      "--audio-path",
      absolutePath,
      "--model",
      runtime.model,
      "--device",
      runtime.device,
      "--compute-type",
      runtime.computeType,
      "--beam-size",
      String(runtime.beamSize),
      "--cpu-threads",
      String(runtime.cpuThreads),
      "--initial-prompt",
      runtime.initialPrompt,
    ];

    if (runtime.vadFilter) {
      args.push("--vad-filter");
    }

    if (runtime.modelCacheDir) {
      args.push("--model-cache-dir", runtime.modelCacheDir);
    }

    // Log system memory info before starting the transcription process
    try {
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = (usedMem / totalMem) * 100;
      this.logger.log(`[Transcription][${recordingId}] System memory state before spawning: ${memUsagePercent.toFixed(1)}% used (${Math.round(usedMem / 1024 / 1024)}MB / ${Math.round(totalMem / 1024 / 1024)}MB)`);
      if (memUsagePercent > 85) {
        this.logger.warn(`[Transcription][${recordingId}] High memory usage warning: ${memUsagePercent.toFixed(1)}% used. This might slow down Whisper execution.`);
      }
    } catch (err: any) {
      this.logger.warn(`Unable to check system memory info before transcription: ${err.message}`);
    }

    const startedAt = Date.now();
    const timeoutMs = Number(process.env.TRANSCRIPTION_TIMEOUT_MS) || 300000;
    const { stdout, stderr, exitCode } = await this.runPythonProcess(
      runtime.pythonBin,
      args,
      timeoutMs,
    );
    const durationMs = Date.now() - startedAt;

    if (exitCode !== 0) {
      const errorMessage = stderr.trim() || stdout.trim() || "Unknown failure";
      throw new Error(
        `Local transcription failed: ${errorMessage}. Ensure faster-whisper is installed and the configured model can run on this machine.`,
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(stdout);
    } catch (error: any) {
      throw new Error(
        `Local transcription returned invalid JSON: ${error.message}. Raw output: ${stdout.slice(0, 500)}`,
      );
    }

    // Log raw whisper output fields for debugging/validation (segments, language, probability, transcript)
    try {
      const segs = parsed.segments ?? null;
      const lang = parsed.detectedLanguageCode ?? parsed.language ?? null;
      const langProb = parsed.detectedLanguageProbability ?? parsed.language_probability ?? null;
      const rawTranscriptField = parsed.transcript ?? null;
      this.logger.log(
        `[Transcription][${recordingId}] Raw Whisper output preview: segments=${Array.isArray(segs) ? segs.length : 'null'} language=${String(lang)} language_probability=${String(langProb)} transcript_preview="${String(rawTranscriptField).slice(0,200)}"`,
      );
      if (Array.isArray(segs)) {
        // Log first 3 segments for quick inspection
        for (let i = 0; i < Math.min(3, segs.length); i++) {
          const s = segs[i] as any;
          this.logger.log(`[Transcription][${recordingId}] segment[${i}] start=${s?.start} end=${s?.end} text="${String(s?.text ?? '').slice(0,120)}"`);
        }
      }
    } catch (e: any) {
      this.logger.warn(`[Transcription][${recordingId}] Failed to log raw Whisper preview: ${e?.message ?? e}`);
    }

    const transcript = String(parsed.transcript ?? "").trim();
    const parsedSegments = Array.isArray(parsed.segments)
      ? parsed.segments.map((segment: any) => ({
          start: Number(segment.start ?? 0),
          end: Number(segment.end ?? 0),
          text: String(segment.text ?? "").trim(),
        }))
      : [];

    const reconstructedTranscript = parsedSegments
      .map((segment) => segment.text)
      .filter((text) => text)
      .join(" ")
      .trim();

    const finalTranscript = transcript || reconstructedTranscript;
    if (!finalTranscript) {
      this.logger.warn(
        `[Transcription][${recordingId}] Empty transcript returned by faster-whisper. segmentCount=${parsedSegments.length} file=${absolutePath}`,
      );
    }

    const result: LocalTranscriptionResult = {
      transcript: finalTranscript,
      detectedLanguageCode: this.asOptionalString(parsed.detectedLanguageCode),
      detectedLanguageProbability: this.asOptionalNumber(
        parsed.detectedLanguageProbability,
      ),
      durationSeconds: this.asOptionalNumber(parsed.durationSeconds),
      segmentCount: parsedSegments.length,
      segments: parsedSegments,
      audioDiagnostics,
      model: this.asOptionalString(parsed.model) || runtime.model,
      provider: "faster-whisper",
      rawOutput: stdout,
    };

    this.logger.log(
      `[Transcription][${recordingId}] Completed in ${durationMs}ms model=${result.model} language=${result.detectedLanguageCode ?? "unknown"} segments=${result.segmentCount} chars=${result.transcript.length}`,
    );

    return result;
  }

  getDiagnostics() {
    const runtime = this.getRuntimeConfig();
    const scriptPath = this.getTranscriptionScriptPath();

    return {
      pythonBin: runtime.pythonBin,
      model: runtime.model,
      device: runtime.device,
      computeType: runtime.computeType,
      beamSize: runtime.beamSize,
      vadFilter: runtime.vadFilter,
      cpuThreads: runtime.cpuThreads,
      scriptPath,
      scriptExists: fs.existsSync(scriptPath),
    };
  }

  private getAudioFileDiagnostics(absolutePath: string): AudioFileDiagnostics {
    const stats = fs.statSync(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const defaultDiagnostics: AudioFileDiagnostics = {
      filePath: absolutePath,
      fileSizeBytes: stats.size,
      extension,
      durationSeconds: null,
      format: null,
      codec: null,
      channels: null,
      sampleRate: null,
      bitrate: null,
      parseError: null,
    };

    try {
      const ffmpegPath = require("ffmpeg-static");
      const probeResult = spawnSync(ffmpegPath, ["-i", absolutePath], {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8",
      });

      const stderr = String(probeResult.stderr || "");
      const durationMatch = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (durationMatch) {
        const hours = Number(durationMatch[1]);
        const minutes = Number(durationMatch[2]);
        const seconds = Number(durationMatch[3]);
        const hundredths = Number(durationMatch[4]);
        defaultDiagnostics.durationSeconds =
          hours * 3600 + minutes * 60 + seconds + hundredths / 100;
      }

      const bitrateMatch = stderr.match(/bitrate:\s*([\d\.]+\s*kb\/s)/i);
      if (bitrateMatch) {
        defaultDiagnostics.bitrate = bitrateMatch[1].trim();
      }

      const streamMatch = stderr.match(/Audio:\s*([^,]+),\s*(\d+)\s*Hz,\s*([^,]+),/i);
      if (streamMatch) {
        defaultDiagnostics.codec = streamMatch[1].trim();
        defaultDiagnostics.sampleRate = Number(streamMatch[2]);
        defaultDiagnostics.channels = streamMatch[3].toLowerCase().includes("stereo") ? 2 : 1;
      }

      const formatMatch = stderr.match(/Input #0,\s*([^,]+),\s*from/);
      if (formatMatch) {
        defaultDiagnostics.format = formatMatch[1].trim();
      }
    } catch (err: any) {
      defaultDiagnostics.parseError = `Failed to parse audio metadata: ${err.message}`;
      this.logger.warn(
        `[Transcription][getAudioFileDiagnostics] Could not inspect file ${absolutePath}: ${err.message}`,
      );
    }

    return defaultDiagnostics;
  }

  private getRuntimeConfig(): LocalRuntimeConfig {
    return {
      pythonBin: process.env.LOCAL_PYTHON_BIN?.trim() || "python",
      model:
        process.env.FASTER_WHISPER_MODEL?.trim() ||
        process.env.WHISPER_MODEL?.trim() ||
        "base",
      device:
        process.env.FASTER_WHISPER_DEVICE?.trim() ||
        process.env.WHISPER_DEVICE?.trim() ||
        "cpu",
      computeType:
        process.env.FASTER_WHISPER_COMPUTE_TYPE?.trim() ||
        process.env.WHISPER_COMPUTE_TYPE?.trim() ||
        "int8",
      beamSize: this.parseInteger(process.env.FASTER_WHISPER_BEAM_SIZE, 1),
      // Default VAD filter to false to avoid over-aggressive pre-filtering on mixed-language audio
      vadFilter: this.parseBoolean(process.env.FASTER_WHISPER_VAD_FILTER, false),
      cpuThreads: this.parseInteger(process.env.FASTER_WHISPER_CPU_THREADS, 4),
      modelCacheDir: process.env.FASTER_WHISPER_MODEL_CACHE_DIR?.trim(),
      initialPrompt:
        process.env.FASTER_WHISPER_INITIAL_PROMPT?.trim() ||
        "This is a real Indian customer support call. The conversation may contain Hindi, Marathi, Hinglish, or mixed-language speech. Preserve names, numbers, and code-switched phrases naturally.",
    };
  }

  private getTranscriptionScriptPath() {
    const candidates = [
      resolveApiPath("scripts", "transcribe_audio.py"),
      path.resolve(process.cwd(), "apps", "api", "scripts", "transcribe_audio.py"),
      path.resolve(process.cwd(), "scripts", "transcribe_audio.py"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return candidates[0];
  }

  private runPythonProcess(pythonBin: string, args: string[], timeoutMs: number) {
    return new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
    }>((resolve, reject) => {
      const child = spawn(pythonBin, args, {
        cwd: path.dirname(args[0]),
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let isTimedOut = false;

      const timer = setTimeout(() => {
        isTimedOut = true;
        this.logger.error(`[Transcription] Subprocess exceeded timeout of ${timeoutMs}ms. Killing process...`);
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        clearTimeout(timer);
        reject(
          new Error(
            `Unable to start Python transcription worker using '${pythonBin}': ${error.message}`,
          ),
        );
      });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        if (isTimedOut) {
          reject(new Error(`Transcription process timed out after ${timeoutMs}ms.`));
        } else {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode,
          });
        }
      });
    });
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean) {
    if (!value) {
      return defaultValue;
    }

    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  }

  private parseInteger(value: string | undefined, defaultValue: number) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  private asOptionalString(value: unknown) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private asOptionalNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }
}

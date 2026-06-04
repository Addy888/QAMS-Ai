import { Controller, Get, Post, Param, Query, Res, HttpStatus, UseInterceptors, UploadedFile, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { AnalysisService } from './analysis.service';
import {
  ensureRecordingsDirectory,
  getRecordingsDirectory,
  toStoredAudioPath,
} from '../runtime/runtime-paths';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
  ) {}

  @Get('health/diagnostic')
  async getDiagnostic() {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        OLLAMA_URL: process.env.OLLAMA_URL || 'NOT SET',
        OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'NOT SET',
      },
      uploadPath: {
        relative: 'uploads/recordings',
        absolute: getRecordingsDirectory(),
        exists: fs.existsSync(getRecordingsDirectory()),
      },
      recordingFiles: [] as string[],
      requiredConfiguration: [
        'Set up Ollama at http://localhost:11434 (check if running)',
      ],
    };

    try {
      const recordingsDir = getRecordingsDirectory();
      if (fs.existsSync(recordingsDir)) {
        const files = fs.readdirSync(recordingsDir);
        diagnostics.recordingFiles = files.slice(0, 10); // Show first 10
      }
    } catch (err: any) {
      diagnostics.recordingFiles = [`Error reading directory: ${err.message}`];
    }

    return diagnostics;
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = ensureRecordingsDirectory();
          try {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          } catch (err: any) {
            console.warn(`[Upload] Cannot create upload directory (read-only FS?): ${err.message}`);
            return cb(new Error('File uploads are not available in this environment (read-only filesystem).'), dir);
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `file-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!['.mp3', '.wav', '.m4a'].includes(ext)) {
          return cb(new Error('Unsupported audio format. Only MP3, WAV, and M4A are supported.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded or file format is invalid.');
    }
    const absoluteAudioPath =
      file.path || path.join(getRecordingsDirectory(), file.filename);
    const audioPath = toStoredAudioPath(absoluteAudioPath);
    const newRecording = await this.analysisService.createRecordingFromUpload(audioPath);
    return {
      success: true,
      recording: newRecording,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERVISOR', 'ADMIN')
  async getDashboardStats() {
    const stats = await this.analysisService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERVISOR', 'ADMIN')
  async getAnalysis(@Query() query: any) {
    const records = await this.analysisService.getFilteredAnalysis(query);
    return {
      success: true,
      data: records,
    };
  }

  @Get('recordings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERVISOR', 'ADMIN')
  async getAnalysisRecordings(@Query() query: any) {
    console.log("API HIT: Fetching recordings with query:", query);
    const records = await this.analysisService.getFilteredAnalysis(query);
    console.log("RETURNING RECORDS:", records.length);
    return {
       success: true,
       data: records,
    };
  }

  @Get('my-records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT')
  async getMyRecords(@CurrentUser() user: CurrentUserPayload, @Query() query: any) {
    console.log("API HIT: Fetching my-records for agent:", user.username);
    const records = await this.analysisService.getMyRecords(user, query);
    return {
       success: true,
       data: records,
    };
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERVISOR', 'ADMIN')
  async exportReport(@Query() query: any, @Res() res: any) {
    try {
      const format = (query.format || 'csv').toLowerCase();
      const records = await this.analysisService.getFilteredAnalysis(query);

      if (format === 'csv') {
        const csv = this.analysisService.generateCSV(records);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="qams_analysis_report.csv"');
        return res.status(HttpStatus.OK).send(csv);
      } else if (format === 'excel') {
        const buffer = await this.analysisService.generateExcel(records);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="qams_analysis_report.xlsx"');
        return res.status(HttpStatus.OK).send(buffer);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="qams_analysis_report.pdf"');
        return this.analysisService.generatePDF(records, res);
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Unsupported export format. Use csv, excel, or pdf.',
        });
      }
    } catch (error: any) {
      console.error("Export failed:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error?.message || 'Export failed',
      });
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERVISOR', 'ADMIN', 'AGENT')
  async getAnalysisById(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const record = await this.analysisService.getAnalysisById(id);
    
    // Authorization check for agent
    if (user.role === 'AGENT' && record.agentId !== user.id && record.agentId !== user.username) {
      throw new ForbiddenException("You do not have permission to view this analysis record.");
    }

    return {
      success: true,
      data: record,
    };
  }

  @Post('analyze/:id')
  async analyze(@Param('id') id: string) {
    console.log('========================');
    console.log('ANALYZE API HIT');
    console.log('RECORDING ID:', id);
    console.log('========================');

    try {
      const result = await this.analysisService.analyzeRecording(id);
      console.log('ANALYSIS QUEUED SUCCESS');
      return result;
    } catch (error: any) {
      console.error('ANALYSIS ERROR:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }
  }

  @Post('reanalyze/:id')
  async reanalyze(@Param('id') id: string) {
    console.log('========================');
    console.log('REANALYZE API HIT');
    console.log('RECORDING ID:', id);
    console.log('========================');

    try {
      const result = await this.analysisService.reanalyzeCall(id);
      console.log('REANALYSIS QUEUED SUCCESS');
      return result;
    } catch (error: any) {
      console.error('REANALYSIS ERROR:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }
  }

  @Post('sync')
  async sync() {
    console.log('========================');
    console.log('SYNC API HIT');
    console.log('========================');

    try {
      const result = await this.analysisService.syncData();
      return result;
    } catch (error: any) {
      console.error('SYNC ERROR:', error);
      return {
        success: false,
        error: error?.message || 'Sync failed',
      };
    }
  }
}

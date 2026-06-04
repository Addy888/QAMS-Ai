import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { getEnvFileCandidates, loadRuntimeEnv } from "./runtime/runtime-env";

import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { AuditsModule } from "./audits/audits.module";
import { ScorecardsModule } from "./scorecards/scorecards.module";
import { AgentAuditsModule } from "./agent-audits/agent-audits.module";
import { AgentPanelModule } from "./agent-panel/agent-panel.module";
import { AnalysisModule } from './analysis/analysis.module';

loadRuntimeEnv();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFileCandidates(),
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    ScorecardsModule,
    AuditsModule,
    AgentAuditsModule,
    AgentPanelModule,
    AnalysisModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

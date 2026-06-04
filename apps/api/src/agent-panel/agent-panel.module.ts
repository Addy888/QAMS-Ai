import { Module } from "@nestjs/common";
import { AgentPanelController } from "./agent-panel.controller";
import { AgentPanelService } from "./agent-panel.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditsModule } from "../audits/audits.module";

/**
 * Agent Panel module — provides agent-scoped dashboard, projects, reports, 
 * analysis, and supervisors endpoints with strict RBAC enforcement.
 * All data is automatically filtered by agentId === actor.id server-side.
 */
@Module({
  imports: [PrismaModule, AuditsModule],
  controllers: [AgentPanelController],
  providers: [AgentPanelService],
  exports: [AgentPanelService],
})
export class AgentPanelModule {}

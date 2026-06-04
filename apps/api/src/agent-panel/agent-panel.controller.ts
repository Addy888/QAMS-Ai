import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import {
  CurrentUser,
  type CurrentUserPayload,
} from "../auth/current-user.decorator";
import { Role } from "../auth/role.enum";
import { AgentPanelService } from "./agent-panel.service";

/**
 * Agent Panel controller — agent-only endpoints with strict RBAC.
 * All data is automatically scoped to agentId === actor.id.
 * Returns 403 Forbidden for any unauthorized access attempt.
 * 
 * Routes:
 *   GET /agent-panel/summary        - Dashboard statistics (total calls, processed, pending, etc.)
 *   GET /agent-panel/projects       - Projects agent has been audited on
 *   GET /agent-panel/analysis       - AI analysis records for agent's calls
 */
@Controller("agent-panel")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("AGENT")
export class AgentPanelController {
  constructor(private readonly agentPanel: AgentPanelService) {}

  /**
   * Dashboard summary — total calls, processed, pending, avg AI score, etc.
   * Auto-scoped to agentId.
   */
  @Get("summary")
  async summary(@CurrentUser() actor: CurrentUserPayload) {
    return this.agentPanel.getSummary({
      id: actor.id,
      username: actor.username,
      role: actor.role as Role,
    });
  }

  /**
   * List projects the agent has been audited on.
   * Returns distinct projects where audits exist for this agent.
   */
  @Get("projects")
  async projects(@CurrentUser() actor: CurrentUserPayload) {
    return this.agentPanel.getProjects({
      id: actor.id,
      username: actor.username,
      role: actor.role as Role,
    });
  }

  /**
   * AI analysis records for agent's own calls.
   * Filtered to only show analysis for this agent.
   */
  @Get("analysis")
  async analysis(
    @CurrentUser() actor: CurrentUserPayload,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("timeRange") timeRange?: string,
    @Query("sentiment") sentiment?: string,
    @Query("scoreMin") scoreMin?: string,
    @Query("scoreMax") scoreMax?: string,
  ) {
    return this.agentPanel.getAnalysis(
      {
        id: actor.id,
        username: actor.username,
        role: actor.role as Role,
      },
      {
        search,
        status,
        timeRange,
        sentiment,
        scoreMin: scoreMin ? parseFloat(scoreMin) : undefined,
        scoreMax: scoreMax ? parseFloat(scoreMax) : undefined,
      },
    );
  }
}

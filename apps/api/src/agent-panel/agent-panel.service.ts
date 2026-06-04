import {
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../auth/role.enum";
import { AGENT_VISIBLE_STATUSES, AuditStatus } from "../audits/audit-status.enum";

interface AuthorizedActor {
  id: string;
  role: Role;
}

interface AnalysisFilters {
  search?: string;
  status?: string;
  timeRange?: string;
  sentiment?: string;
  scoreMin?: number;
  scoreMax?: number;
}

/**
 * Agent Panel service — provides agent-scoped data with strict RBAC.
 * All methods enforce agentId === actor.id filtering server-side.
 * Frontend filtering is NEVER trusted.
 */
@Injectable()
export class AgentPanelService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------
  //  SUMMARY (Dashboard Statistics)
  // ---------------------------------------------------------------

  /**
   * Dashboard summary for agent home page.
   * Returns: total audits, average score, pending reviews, fatal count, latest audit.
   * All data scoped to agentId === actor.id.
   */
  async getSummary(actor: AuthorizedActor) {
    this.requireAgent(actor);

    const rows = await this.prisma.audit.findMany({
      where: {
        agentId: actor.id,
        status: { in: AGENT_VISIBLE_STATUSES },
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        finalScore: true,
        fatalTriggered: true,
        status: true,
        publishedAt: true,
      },
    });

    let scoreSum = 0;
    let scoreCount = 0;
    let fatalCount = 0;
    let publishedCount = 0;
    let reviewedCount = 0;

    for (const r of rows) {
      if (r.fatalTriggered) fatalCount += 1;
      if (r.status === AuditStatus.PUBLISHED) publishedCount += 1;
      if (r.status === AuditStatus.REVIEWED) reviewedCount += 1;
      if (typeof r.finalScore === "number") {
        scoreSum += r.finalScore;
        scoreCount += 1;
      }
    }

    const averageScore =
      scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null;

    const latest = rows[0];

    return {
      totalAudits: rows.length,
      publishedCount,
      reviewedCount,
      pendingReviewCount: publishedCount,
      fatalCount,
      averageScore,
      latestScore:
        latest && typeof latest.finalScore === "number"
          ? latest.finalScore
          : null,
      latestAuditAt:
        latest?.publishedAt instanceof Date
          ? latest.publishedAt.toISOString()
          : null,
    };
  }

  // ---------------------------------------------------------------
  //  PROJECTS (Agent's Projects)
  // ---------------------------------------------------------------

  /**
   * List projects the agent has been audited on.
   * Returns distinct projects with audit count per project.
   */
  async getProjects(actor: AuthorizedActor) {
    this.requireAgent(actor);

    // Get distinct project IDs from agent's audits
    const audits = await this.prisma.audit.findMany({
      where: {
        agentId: actor.id,
        status: { in: AGENT_VISIBLE_STATUSES },
      },
      select: {
        projectId: true,
      },
      distinct: ["projectId"],
    });

    const projectIds = audits.map((a) => a.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    // Fetch project details with audit count
    const projects = await this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
      },
      select: {
        id: true,
        projectName: true,
        groupName: true,
        description: true,
        status: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            audits: {
              where: {
                agentId: actor.id,
                status: { in: AGENT_VISIBLE_STATUSES },
              },
            },
          },
        },
      },
      orderBy: [{ groupName: "asc" }, { projectName: "asc" }],
    });

    return projects.map((p) => ({
      id: p.id,
      projectName: p.projectName,
      groupName: p.groupName,
      description: p.description,
      status: p.status,
      isActive: p.isActive,
      createdAt: p.createdAt,
      auditCount: p._count.audits,
    }));
  }

  // ---------------------------------------------------------------
  //  ANALYSIS (AI Call Analysis)
  // ---------------------------------------------------------------

  /**
   * AI analysis records for agent's own calls.
   * Note: This requires an `analysis_recordings` table or similar.
   * If not present in schema, return empty array or implement based on your schema.
   */
  async getAnalysis(actor: AuthorizedActor, filters: AnalysisFilters) {
    this.requireAgent(actor);

    // Check if analysis table exists in your schema
    // This is a placeholder — adjust based on your actual analysis schema
    try {
      // If you have an analysis table linked to agents:
      // const records = await this.prisma.analysisRecording.findMany({
      //   where: {
      //     agentId: actor.id,
      //     // Apply filters...
      //   },
      // });
      // return records;

      // If no analysis table, return empty
      return {
        success: true,
        data: [],
        message: "Analysis feature not yet connected to agent schema",
      };
    } catch (e) {
      // Table doesn't exist, return empty
      return {
        success: true,
        data: [],
        message: "Analysis feature not available",
      };
    }
  }

  // ---------------------------------------------------------------
  //  Helpers
  // ---------------------------------------------------------------

  private requireAgent(actor: AuthorizedActor): void {
    if (actor.role !== Role.AGENT) {
      throw new ForbiddenException("Agent-only endpoint");
    }
  }
}

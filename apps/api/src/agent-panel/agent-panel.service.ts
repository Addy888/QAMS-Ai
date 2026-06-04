import {
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../auth/role.enum";
import { AGENT_VISIBLE_STATUSES, AuditStatus } from "../audits/audit-status.enum";

interface AuthorizedActor {
  id: string;
  username: string;
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

    try {
      const where: any = {
        agentId: {
          in: [actor.id, actor.username],
        },
      };

      if (filters?.status) {
        let statusVal = filters.status;
        if (statusVal.toLowerCase() === 'completed') statusVal = 'Completed';
        else if (statusVal.toLowerCase() === 'pending') statusVal = 'Pending';
        else if (statusVal.toLowerCase() === 'processing') statusVal = 'Processing';
        else if (statusVal.toLowerCase() === 'failed') statusVal = 'Failed';
        else if (statusVal.toLowerCase() === 'retrying') statusVal = 'Retrying';
        where.status = statusVal;
      }

      if (filters?.sentiment) {
        where.sentiment = { contains: filters.sentiment };
      }

      const minScore = filters?.scoreMin ? Number(filters.scoreMin) : undefined;
      const maxScore = filters?.scoreMax ? Number(filters.scoreMax) : undefined;

      if (minScore !== undefined || maxScore !== undefined) {
        where.score = {};
        if (minScore !== undefined && !isNaN(minScore)) {
          where.score.gte = minScore;
        }
        if (maxScore !== undefined && !isNaN(maxScore)) {
          where.score.lte = maxScore;
        }
      }

      if (filters?.timeRange) {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        if (filters.timeRange === "today") {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (filters.timeRange === "yesterday") {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        } else if (filters.timeRange === "last7") {
          start = new Date();
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
        } else if (filters.timeRange === "last30") {
          start = new Date();
          start.setDate(start.getDate() - 30);
          start.setHours(0, 0, 0, 0);
        }

        if (start) {
          where.createdAt = {
            gte: start,
            ...(end ? { lte: end } : {}),
          };
        }
      }

      if (filters?.search) {
        const searchVal = filters.search;
        where.OR = [
          { id: { contains: searchVal } },
          { sentiment: { contains: searchVal } },
          { tone: { contains: searchVal } },
          { status: { contains: searchVal } },
          { summary: { contains: searchVal } },
          { transcription: { contains: searchVal } },
        ];
      }

      const records = await this.prisma.recording.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: records,
      };
    } catch (e: any) {
      console.error("[AgentPanelService] Failed to get analysis:", e);
      return {
        success: false,
        data: [],
        message: "Failed to fetch analysis records",
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

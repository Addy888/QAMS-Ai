/**
 * Agent Panel types — all data is agent-scoped.
 */

export interface AgentPanelSummary {
  totalAudits: number;
  publishedCount: number;
  reviewedCount: number;
  pendingReviewCount: number;
  fatalCount: number;
  averageScore: number | null;
  latestScore: number | null;
  latestAuditAt: string | null;
  avgAiScore: number;
  scoredCalls: number;
}

export interface AgentProject {
  id: number;
  projectName: string;
  groupName: string;
  description: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  auditCount: number;
}

export interface AgentSupervisor {
  id: string;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  auditCount: number;
}

export interface AgentReports {
  summary: {
    totalAudits: number;
    avgScore: number | null;
    fatalTriggers: number;
    pendingReview: number;
  };
  qualityDistribution: {
    good: number;
    average: number;
    bad: number;
  };
  projectBreakdown: Array<{
    projectId: number;
    projectName: string;
    groupName: string;
    totalAudits: number;
    goodCount: number;
    averageCount: number;
    badCount: number;
    fatalCount: number;
    avgScore: number | null;
  }>;
  supervisorBreakdown: Array<{
    supervisorId: string;
    supervisorName: string;
    totalAudits: number;
    goodCount: number;
    averageCount: number;
    badCount: number;
    fatalCount: number;
    avgScore: number | null;
  }>;
}

export interface AgentAnalysisRecord {
  id: string;
  agent: string;
  agentId: string;
  sentiment: string | null;
  score: number | null;
  result: string | null;
  status: string;
  statusReason: string;
  createdAt: string;
}

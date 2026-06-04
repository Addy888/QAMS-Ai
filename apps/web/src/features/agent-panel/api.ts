import { api } from "@/services/api";
import type {
  AgentPanelSummary,
  AgentProject,
  AgentAnalysisRecord,
} from "./types";

/**
 * Agent Panel API client.
 * All endpoints are agent-scoped — backend enforces agentId === actor.id.
 * Returns 403 Forbidden if agent tries to access another agent's data.
 */

export async function getAgentPanelSummary(): Promise<AgentPanelSummary> {
  const { data } = await api.get<AgentPanelSummary>("/agent-panel/summary");
  return data;
}

export async function getAgentProjects(): Promise<AgentProject[]> {
  const { data } = await api.get<AgentProject[]>("/agent-panel/projects");
  return data;
}

export async function getAgentAnalysis(filters?: {
  search?: string;
  status?: string;
  timeRange?: string;
  sentiment?: string;
  scoreMin?: number;
  scoreMax?: number;
}): Promise<{ success: boolean; data: AgentAnalysisRecord[]; message?: string }> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.timeRange) params.append("timeRange", filters.timeRange);
  if (filters?.sentiment) params.append("sentiment", filters.sentiment);
  if (filters?.scoreMin !== undefined) params.append("scoreMin", filters.scoreMin.toString());
  if (filters?.scoreMax !== undefined) params.append("scoreMax", filters.scoreMax.toString());
  
  const { data } = await api.get<{ success: boolean; data: AgentAnalysisRecord[]; message?: string }>(
    `/analysis/my-records?${params.toString()}`
  );
  return data;
}

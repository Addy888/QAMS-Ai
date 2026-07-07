import { useCallback, useEffect, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Clock,
  PhoneCall,
} from "lucide-react";
import PageContainer from "@/layouts/PageContainer";
import { StatCard } from "@/components/ui/StatCard";
import { getAgentPanelSummary } from "@/features/agent-panel/api";
import type { AgentPanelSummary } from "@/features/agent-panel/types";

/**
 * Simplified Agent Dashboard
 * Shows only: Total Calls, Processed Calls, Pending Calls, Avg AI Score
 * No audit history, no pending reviews sections
 */
export default function AgentDashboard() {
  const [summary, setSummary] = useState<AgentPanelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = await getAgentPanelSummary();
      setSummary(summaryData);
    } catch (e) {
      console.error(e);
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Average AI score and scored calls count are now computed directly by the backend
  const avgAIScore = summary?.avgAiScore ?? null;
  const scoredCalls = summary?.scoredCalls ?? 0;

  return (
    <PageContainer
      maxWidth="xl"
      title="Dashboard"
      description="Your call processing overview and AI analysis metrics"
    >
      {error && (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ----- KPI Cards ----------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Calls"
          value={summary?.totalAudits ?? 0}
          icon={PhoneCall}
          description="All calls assigned to you"
          loading={loading}
        />
        <StatCard
          label="Processed Calls"
          value={summary?.reviewedCount ?? 0}
          icon={CheckCircle2}
          description="Calls you have reviewed"
          loading={loading}
        />
        <StatCard
          label="Pending Calls"
          value={summary?.pendingReviewCount ?? 0}
          icon={Clock}
          description="Awaiting your review"
          loading={loading}
        />
        <StatCard
          label="Avg AI Score"
          value={
            scoredCalls > 0 && avgAIScore !== null
              ? `${Math.round(avgAIScore)}%`
              : "—"
          }
          icon={BrainCircuit}
          description={
            scoredCalls > 0
              ? `Based on ${scoredCalls} completed analys${scoredCalls === 1 ? "is" : "es"}`
              : "No completed analyses yet"
          }
          loading={loading}
        />
      </div>
    </PageContainer>
  );
}

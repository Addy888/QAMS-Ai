import { useState, useEffect, useCallback } from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import PageContainer from "@/layouts/PageContainer";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { getAgentAnalysis } from "@/features/agent-panel/api";
import type { AgentAnalysisRecord } from "@/features/agent-panel/types";

/**
 * Agent Analysis Page (Read-only)
 * Shows AI analysis for agent's own calls only.
 * Agent cannot upload or trigger analysis (supervisor-only feature).
 */
export default function AgentAnalysisPage() {
  const [records, setRecords] = useState<AgentAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await getAgentAnalysis();
      setRecords(result.data);
      if (result.message) {
        setMessage(result.message);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load analysis records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  return (
    <PageContainer
      maxWidth="xl"
      title="My Call Analysis"
      description="AI-powered analysis of your call recordings. Analysis is conducted by your supervisors."
      actions={
        <button
          onClick={() => void fetchRecords()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg-muted hover:bg-bg-muted hover:text-fg"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      }
    >
      {loading ? (
        <AppCard padding="lg">
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="text-fg-subtle">Loading analysis records...</p>
          </div>
        </AppCard>
      ) : error ? (
        <EmptyState
          icon={BrainCircuit}
          title="Couldn't load analysis"
          description={error}
          action={
            <button
              onClick={() => void fetchRecords()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg shadow-elev-1 hover:opacity-90"
            >
              Try again
            </button>
          }
        />
      ) : message && records.length === 0 ? (
        <AppCard padding="lg">
          <EmptyState
            icon={BrainCircuit}
            title="Analysis Feature"
            description={message}
          />
        </AppCard>
      ) : records.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No analysis records yet"
          description="Once your supervisors analyze your calls, the results will appear here."
        />
      ) : (
        <AppCard padding="md">
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-bg-elevated p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{record.agentId}</p>
                  <p className="text-xs text-fg-subtle">
                    {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {record.sentiment && (
                    <span className="rounded-full border border-border bg-bg-muted px-2 py-1 text-xs text-fg-muted">
                      {record.sentiment}
                    </span>
                  )}
                  {record.score !== null && (
                    <span className="text-sm font-semibold text-accent">
                      {record.score}%
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs",
                      record.status === "Complete"
                        ? "border-success/40 bg-success/15 text-success"
                        : "border-info/40 bg-info/15 text-info",
                    )}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}
    </PageContainer>
  );
}

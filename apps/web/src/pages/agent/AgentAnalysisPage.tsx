import { useState, useEffect, useCallback } from "react";
import { BrainCircuit, RefreshCw } from "lucide-react";
import PageContainer from "@/layouts/PageContainer";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { getAgentAnalysis } from "@/features/agent-panel/api";
import type { AnalysisRecord } from "@/services/analysis.service";
import AnalysisTable from "@/pages/supervisor/analysis/components/AnalysisTable";

/**
 * Agent Analysis Page (Read-only)
 * Shows AI analysis for agent's own calls only.
 * Agent cannot upload or trigger analysis (supervisor-only feature).
 */
export default function AgentAnalysisPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await getAgentAnalysis();
      // The backend returns an array of AnalysisRecord objects cast to any
      setRecords(result.data as unknown as AnalysisRecord[]);
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
        <AppCard padding="none">
          <AnalysisTable
            data={records}
            onUpdateRecord={(updatedRecord) => {
              setRecords((prev) =>
                prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
              );
            }}
            onRefetch={fetchRecords}
            isReadOnly={true}
          />
        </AppCard>
      )}
    </PageContainer>
  );
}

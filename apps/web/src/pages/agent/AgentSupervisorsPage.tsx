import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, UserSquare2, Users } from "lucide-react";
import PageContainer from "@/layouts/PageContainer";
import { AppCard } from "@/components/ui/AppCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatDate } from "@/lib/utils";
// import { getAgentSupervisors } from "@/features/agent-panel/api";
import type { AgentSupervisor } from "@/features/agent-panel/types";

// Temporary mock function until API endpoint is implemented
async function getAgentSupervisors(): Promise<AgentSupervisor[]> {
  return [];
}

/**
 * Agent Supervisors Page (Read-only)
 * Shows supervisors who have audited this agent.
 * Agent cannot create or modify supervisors.
 */
export default function AgentSupervisorsPage() {
  const [supervisors, setSupervisors] = useState<AgentSupervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchSupervisors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgentSupervisors();
      setSupervisors(data);
    } catch (err) {
      console.error(err);
      setError("Could not load supervisors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSupervisors();
  }, [fetchSupervisors]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return supervisors;
    return supervisors.filter((s) => {
      return (
        s.name.toLowerCase().includes(term) ||
        s.username.toLowerCase().includes(term)
      );
    });
  }, [supervisors, search]);

  const activeCount = useMemo(
    () => supervisors.filter((s) => s.isActive).length,
    [supervisors],
  );

  const columns: DataTableColumn<AgentSupervisor>[] = [
    {
      key: "name",
      header: "Supervisor",
      cell: (sup) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {sup.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{sup.name}</p>
            <p className="truncate text-xs text-fg-subtle">@{sup.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: "audits",
      header: "Audits Conducted",
      align: "center",
      cell: (sup) => (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 px-2 text-xs font-semibold text-accent">
          {sup.auditCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (sup) => (
        <StatusBadge tone={sup.isActive ? "success" : "neutral"}>
          {sup.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      align: "right",
      cell: (sup) => (
        <span className="text-xs text-fg-subtle">
          {formatDate(sup.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      maxWidth="xl"
      title="My Supervisors"
      description="Supervisors who have conducted quality audits for you."
      actions={
        <button
          onClick={() => void fetchSupervisors()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg-muted hover:bg-bg-muted hover:text-fg"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      }
    >
      <AppCard padding="sm" className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by name or username…"
            />
          </div>
          <p className="text-xs text-fg-subtle">
            {loading
              ? "Loading…"
              : `${activeCount} active · ${supervisors.length} total`}
          </p>
        </div>
      </AppCard>

      {error ? (
        <EmptyState
          icon={Users}
          title="Couldn't load supervisors"
          description={error}
          action={
            <button
              onClick={() => void fetchSupervisors()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg shadow-elev-1 hover:opacity-90"
            >
              Try again
            </button>
          }
        />
      ) : (
        <DataTable<AgentSupervisor>
          columns={columns}
          data={filtered}
          rowKey={(sup) => sup.id}
          loading={loading}
          loadingRows={5}
          emptyState={
            <EmptyState
              icon={UserSquare2}
              title={search ? "No matching supervisors" : "No supervisors yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Once a supervisor audits you, they'll appear here."
              }
            />
          }
        />
      )}
    </PageContainer>
  );
}

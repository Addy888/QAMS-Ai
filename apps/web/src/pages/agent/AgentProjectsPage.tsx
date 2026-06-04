import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderKanban, Layers, RefreshCw } from "lucide-react";
import PageContainer from "@/layouts/PageContainer";
import { AppCard } from "@/components/ui/AppCard";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn, formatDate } from "@/lib/utils";
import { getAgentProjects } from "@/features/agent-panel/api";
import type { AgentProject } from "@/features/agent-panel/types";

/**
 * Agent Projects Page (Read-only)
 * Shows only projects where the agent has been audited.
 * Agent cannot create or modify projects.
 */
export default function AgentProjectsPage() {
  const [projects, setProjects] = useState<AgentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAgentProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError("Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) => {
      return (
        p.projectName.toLowerCase().includes(term) ||
        p.groupName.toLowerCase().includes(term)
      );
    });
  }, [projects, search]);

  // Group by groupName
  const grouped = useMemo(() => {
    const map = new Map<string, AgentProject[]>();
    for (const proj of filtered) {
      if (!map.has(proj.groupName)) {
        map.set(proj.groupName, []);
      }
      map.get(proj.groupName)!.push(proj);
    }
    return Array.from(map.entries()).map(([groupName, items]) => ({
      groupName,
      projects: items,
      count: items.length,
    }));
  }, [filtered]);

  const columns: DataTableColumn<AgentProject>[] = [
    {
      key: "project",
      header: "Project",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">
            {row.projectName}
          </p>
          <p className="truncate text-xs text-fg-subtle">{row.groupName}</p>
        </div>
      ),
    },
    {
      key: "audits",
      header: "My Audits",
      align: "center",
      cell: (row) => (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 px-2 text-xs font-semibold text-accent">
          {row.auditCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge tone={row.status === "ACTIVE" ? "success" : "neutral"}>
          {row.status}
        </StatusBadge>
      ),
    },
    {
      key: "created",
      header: "Created",
      align: "right",
      cell: (row) => (
        <span className="text-xs text-fg-subtle">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      maxWidth="xl"
      title="My Projects"
      description="Projects you have been audited on. These are managed by your supervisors."
      actions={
        <button
          onClick={() => void fetchProjects()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg-muted hover:bg-bg-muted hover:text-fg"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      }
    >
      <AppCard padding="sm" className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project or group name…"
            className="h-9 flex-1 max-w-md rounded-md border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <p className="text-xs text-fg-subtle">
            {loading
              ? "Loading…"
              : `${projects.length} project${projects.length === 1 ? "" : "s"} across ${grouped.length} group${grouped.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </AppCard>

      {error ? (
        <EmptyState
          icon={Layers}
          title="Couldn't load projects"
          description={error}
          action={
            <button
              onClick={() => void fetchProjects()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg shadow-elev-1 hover:opacity-90"
            >
              Try again
            </button>
          }
        />
      ) : projects.length === 0 && !loading ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Once you've been audited on a project, it will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((group) => (
            <AppCard key={group.groupName} padding="none">
              <div className="border-b border-border px-5 py-3.5">
                <h3 className="text-sm font-semibold text-fg">{group.groupName}</h3>
                <p className="text-xs text-fg-subtle">
                  {group.count} project{group.count === 1 ? "" : "s"}
                </p>
              </div>
              <DataTable<AgentProject>
                columns={columns}
                data={group.projects}
                rowKey={(row) => row.id}
                loading={loading}
                loadingRows={3}
                emptyState={
                  <EmptyState
                    title="No projects in this group"
                    description="Try a different search term."
                  />
                }
              />
            </AppCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

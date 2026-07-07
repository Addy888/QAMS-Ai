import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";

export interface AgentPerformance {
  id: string;
  name: string;
  callCount: number;
  avgScore: number | null;
  sentiment: "Positive" | "Neutral" | "Negative" | null;
  trend: "up" | "down" | "flat";
  status: "online" | "offline" | "away";
}

interface AgentPerformanceTableProps {
  agents: AgentPerformance[];
  loading?: boolean;
  onAgentClick?: (agentId: string) => void;
  className?: string;
}

export function AgentPerformanceTable({
  agents,
  loading = false,
  onAgentClick,
  className,
}: AgentPerformanceTableProps) {
  const topAgents = agents.slice(0, 5);

  const TrendIcon = (trend: "up" | "down" | "flat") => {
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return Minus;
  };

  if (loading) {
    return (
      <AppCard variant="glass" padding="none" className={className}>
        <div className="px-6 py-4">
          <div className="h-5 w-40 animate-shimmer rounded bg-bg-muted" />
          <div className="mt-1 h-3 w-56 animate-shimmer rounded bg-bg-muted" />
        </div>
        <div className="space-y-3 px-6 pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-shimmer rounded-full bg-bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-32 animate-shimmer rounded bg-bg-muted" />
                <div className="mt-1 h-3 w-24 animate-shimmer rounded bg-bg-muted" />
              </div>
              <div className="h-8 w-16 animate-shimmer rounded-full bg-bg-muted" />
            </div>
          ))}
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard
      variant="glass"
      padding="none"
      className={className}
      header={
        <div>
          <h3 className="text-sm font-semibold text-fg">Agent Performance</h3>
          <p className="text-xs text-fg-subtle">Top 5 agents by activity</p>
        </div>
      }
    >
      {topAgents.length === 0 ? (
        <EmptyState
          icon={User}
          title="No agent data"
          description="Agent performance metrics will appear here"
          className="border-none bg-transparent py-12"
        />
      ) : (
        <div className="divide-y divide-border">
          {topAgents.map((agent, index) => {
            const Icon = TrendIcon(agent.trend);
            const scoreColor =
              agent.avgScore !== null
                ? agent.avgScore >= 80
                  ? "text-success"
                  : agent.avgScore >= 60
                  ? "text-warning"
                  : "text-danger"
                : "text-fg-muted";

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onAgentClick?.(agent.id)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors",
                  onAgentClick && "cursor-pointer hover:bg-bg-muted/50"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-info/20 text-sm font-semibold text-fg">
                    {agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface",
                      agent.status === "online" && "bg-success",
                      agent.status === "away" && "bg-warning",
                      agent.status === "offline" && "bg-fg-subtle"
                    )}
                  />
                </div>

                {/* Agent Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {agent.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-subtle">
                    <span>{agent.callCount} calls</span>
                    {agent.sentiment && (
                      <>
                        <span>•</span>
                        <span
                          className={cn(
                            agent.sentiment === "Positive" && "text-success",
                            agent.sentiment === "Negative" && "text-danger",
                            agent.sentiment === "Neutral" && "text-fg-subtle"
                          )}
                        >
                          {agent.sentiment}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score Badge */}
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      agent.trend === "up" && "text-success",
                      agent.trend === "down" && "text-danger",
                      agent.trend === "flat" && "text-fg-subtle"
                    )}
                  />
                  <div
                    className={cn(
                      "flex h-9 min-w-[3.5rem] items-center justify-center rounded-full px-3 text-sm font-semibold",
                      agent.avgScore !== null
                        ? agent.avgScore >= 80
                          ? "bg-success/10 text-success"
                          : agent.avgScore >= 60
                          ? "bg-warning/10 text-warning"
                          : "bg-danger/10 text-danger"
                        : "bg-bg-muted text-fg-subtle"
                    )}
                  >
                    {agent.avgScore !== null ? `${agent.avgScore}%` : "—"}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppCard>
  );
}

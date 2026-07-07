import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingDown,
  FileX,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";

export interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  description: string;
  count?: number;
  timestamp: Date;
}

interface AlertCenterCardProps {
  alerts: Alert[];
  loading?: boolean;
  onAlertClick?: (alert: Alert) => void;
  className?: string;
}

const alertIcons = {
  warning: AlertTriangle,
  error: XCircle,
  info: Clock,
};

const alertColors = {
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    icon: "text-warning",
  },
  error: {
    bg: "bg-danger/10",
    border: "border-danger/30",
    text: "text-danger",
    icon: "text-danger",
  },
  info: {
    bg: "bg-info/10",
    border: "border-info/30",
    text: "text-info",
    icon: "text-info",
  },
};

export function AlertCenterCard({
  alerts,
  loading = false,
  onAlertClick,
  className,
}: AlertCenterCardProps) {
  if (loading) {
    return (
      <AppCard variant="solid" padding="none" className={className}>
        <div className="px-6 py-4 border-b border-border">
          <div className="h-5 w-32 animate-shimmer rounded bg-bg-muted" />
        </div>
        <div className="space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="h-8 w-8 animate-shimmer rounded-lg bg-bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-40 animate-shimmer rounded bg-bg-muted" />
                <div className="mt-2 h-3 w-full animate-shimmer rounded bg-bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard
      variant="solid"
      padding="none"
      className={className}
      header={
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-fg">Alert Center</h3>
            <p className="text-xs text-fg-subtle">System warnings and issues</p>
          </div>
          {alerts.length > 0 && (
            <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-danger px-2 text-xs font-semibold text-white">
              {alerts.length}
            </span>
          )}
        </div>
      }
    >
      {alerts.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="All clear"
          description="No active alerts or warnings"
          className="border-none bg-transparent py-12"
        />
      ) : (
        <div className="max-h-[400px] space-y-3 overflow-y-auto p-4">
          {alerts.map((alert, index) => {
            const Icon = alertIcons[alert.type];
            const colors = alertColors[alert.type];

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onAlertClick?.(alert)}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-all",
                  colors.bg,
                  colors.border,
                  onAlertClick && "cursor-pointer hover:shadow-elev-1"
                )}
              >
                <div className={cn("mt-0.5 flex-shrink-0", colors.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", colors.text)}>
                      {alert.title}
                    </p>
                    {alert.count !== undefined && alert.count > 1 && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          colors.bg,
                          colors.text
                        )}
                      >
                        {alert.count}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">{alert.description}</p>
                  <p className="mt-2 text-xs text-fg-subtle">
                    {Math.floor((Date.now() - alert.timestamp.getTime()) / 60000)}m
                    ago
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppCard>
  );
}

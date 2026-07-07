import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Send,
  FileEdit,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingAction {
  type: "review" | "publish" | "draft" | "escalated";
  count: number;
  label: string;
  description: string;
}

interface PendingActionsCardsProps {
  actions: PendingAction[];
  onActionClick?: (type: string) => void;
  loading?: boolean;
  className?: string;
}

const actionConfig = {
  review: {
    icon: ClipboardCheck,
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/20",
  },
  publish: {
    icon: Send,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  draft: {
    icon: FileEdit,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  escalated: {
    icon: AlertTriangle,
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/20",
  },
};

export function PendingActionsCards({
  actions,
  onActionClick,
  loading = false,
  className,
}: PendingActionsCardsProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 w-24 animate-shimmer rounded bg-bg-muted" />
                <div className="mt-2 h-6 w-12 animate-shimmer rounded bg-bg-muted" />
                <div className="mt-2 h-3 w-32 animate-shimmer rounded bg-bg-muted" />
              </div>
              <div className="h-10 w-10 animate-shimmer rounded-lg bg-bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {actions.map((action, index) => {
        const config = actionConfig[action.type as keyof typeof actionConfig];
        const Icon = config.icon;

        return (
          <motion.button
            key={action.type}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            onClick={() => onActionClick?.(action.type)}
            disabled={action.count === 0}
            className={cn(
              "group relative overflow-hidden rounded-lg border p-4 text-left transition-all",
              "hover:shadow-elev-1 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg",
              config.borderColor,
              config.bgColor,
              action.count === 0 && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg-subtle">
                  {action.label}
                </p>
                <p className={cn("mt-1 text-2xl font-bold", config.color)}>
                  {action.count}
                </p>
                <p className="mt-2 text-xs text-fg-muted">
                  {action.description}
                </p>
              </div>

              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300",
                    config.bgColor,
                    action.count > 0 && "group-hover:scale-110"
                  )}
                >
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>
              </div>
            </div>

            {action.count > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                <span>View details</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

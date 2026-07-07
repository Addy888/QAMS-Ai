import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueStats {
  queued: number;
  transcribing: number;
  analysing: number;
  completed: number;
  failed: number;
}

interface ProcessingQueueCardsProps {
  stats: QueueStats;
  loading?: boolean;
  className?: string;
}

const queueItems = [
  {
    key: "queued" as keyof QueueStats,
    label: "Queued",
    icon: Clock,
    color: "text-fg-subtle",
    bgColor: "bg-fg-subtle/10",
  },
  {
    key: "transcribing" as keyof QueueStats,
    label: "Transcribing",
    icon: Loader2,
    color: "text-info",
    bgColor: "bg-info/10",
    animate: true,
  },
  {
    key: "analysing" as keyof QueueStats,
    label: "Analysing",
    icon: ListChecks,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    key: "completed" as keyof QueueStats,
    label: "Completed",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    key: "failed" as keyof QueueStats,
    label: "Failed",
    icon: XCircle,
    color: "text-danger",
    bgColor: "bg-danger/10",
  },
];

export function ProcessingQueueCards({
  stats,
  loading = false,
  className,
}: ProcessingQueueCardsProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-5", className)}>
        {queueItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="h-10 w-10 animate-shimmer rounded-lg bg-bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-16 animate-shimmer rounded bg-bg-muted" />
              <div className="mt-2 h-3 w-12 animate-shimmer rounded bg-bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-5", className)}>
      {queueItems.map((item, index) => {
        const Icon = item.icon;
        const count = stats[item.key];

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-all duration-300 hover:border-border-strong hover:shadow-elev-1"
          >
            <div className={cn("rounded-lg p-2", item.bgColor)}>
              <Icon
                className={cn("h-5 w-5", item.color, item.animate && "animate-spin")}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold tracking-tight text-fg">{count}</p>
              <p className="text-xs text-fg-subtle">{item.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

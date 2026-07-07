import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type WidgetStatus = "healthy" | "warning" | "error" | "unknown";

interface StatusWidgetProps {
  label: string;
  status: WidgetStatus;
  value?: string | number;
  icon?: LucideIcon;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  warning: {
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  error: {
    icon: XCircle,
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/20",
  },
  unknown: {
    icon: AlertCircle,
    color: "text-fg-subtle",
    bgColor: "bg-bg-muted",
    borderColor: "border-border",
  },
};

export function StatusWidget({
  label,
  status,
  value,
  icon: CustomIcon,
  className,
}: StatusWidgetProps) {
  const config = statusConfig[status];
  const StatusIcon = CustomIcon || config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <StatusIcon className={cn("h-4 w-4 flex-shrink-0", config.color)} />
        <span className="text-sm font-medium text-fg truncate">{label}</span>
      </div>
      {value !== undefined && (
        <span className={cn("text-sm font-semibold tabular-nums", config.color)}>
          {value}
        </span>
      )}
    </motion.div>
  );
}

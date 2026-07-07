import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

const variantStyles = {
  default: "border-border bg-surface",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/20 bg-warning/5",
  danger: "border-danger/20 bg-danger/5",
  info: "border-info/20 bg-info/5",
};

const iconStyles = {
  default: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
  info: "text-info bg-info/10",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  loading = false,
  trend,
  className,
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border p-6",
          variantStyles[variant],
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 animate-shimmer rounded bg-bg-muted" />
            <div className="mt-3 h-8 w-32 animate-shimmer rounded bg-bg-muted" />
            <div className="mt-2 h-3 w-28 animate-shimmer rounded bg-bg-muted" />
          </div>
          <div className="h-12 w-12 animate-shimmer rounded-xl bg-bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-6 transition-all duration-300",
        "hover:shadow-elev-2 hover:border-border-strong",
        variantStyles[variant],
        className
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-fg-subtle">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="text-3xl font-bold tracking-tight text-fg"
            >
              {value}
            </motion.p>
            {trend && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.positive ? "text-success" : "text-danger"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-2 text-xs text-fg-muted">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            iconStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

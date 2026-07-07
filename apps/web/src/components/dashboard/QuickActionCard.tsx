import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "accent" | "success" | "warning";
  disabled?: boolean;
  className?: string;
}

const variantStyles = {
  default: "border-border bg-surface hover:border-border-strong hover:bg-bg-muted",
  accent: "border-accent/20 bg-accent/5 hover:bg-accent/10",
  success: "border-success/20 bg-success/5 hover:bg-success/10",
  warning: "border-warning/20 bg-warning/5 hover:bg-warning/10",
};

const iconStyles = {
  default: "text-fg bg-bg-muted",
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "default",
  disabled = false,
  className,
}: QuickActionCardProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg",
        variantStyles[variant],
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            iconStyles[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-fg">{title}</p>
          {description && (
            <p className="mt-1 text-xs text-fg-subtle">{description}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

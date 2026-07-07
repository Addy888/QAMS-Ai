import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightItem {
  type: "success" | "info" | "warning" | "highlight";
  text: string;
}

interface FooterInsightsProps {
  insights: InsightItem[];
  loading?: boolean;
  className?: string;
}

const iconMap = {
  success: TrendingUp,
  info: Users,
  warning: AlertCircle,
  highlight: Sparkles,
};

const colorMap = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  highlight: "text-accent",
};

export function FooterInsights({
  insights,
  loading = false,
  className,
}: FooterInsightsProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "glass-panel rounded-xl border border-border p-6",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 animate-shimmer rounded bg-bg-muted" />
          <div className="h-5 w-40 animate-shimmer rounded bg-bg-muted" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-4 w-4 animate-shimmer rounded bg-bg-muted mt-0.5" />
              <div className="h-4 flex-1 animate-shimmer rounded bg-bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "glass-panel rounded-xl border border-border p-6",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-accent" />
        <h3 className="text-base font-semibold text-fg">AI Insights</h3>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-fg-subtle">No insights available yet.</p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = iconMap[insight.type];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <Icon
                  className={cn("h-4 w-4 mt-0.5 flex-shrink-0", colorMap[insight.type])}
                />
                <p className="text-sm text-fg-muted leading-relaxed">
                  {insight.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

import { motion } from "framer-motion";
import {
  MessageSquare,
  Volume2,
  Zap,
  Ear,
  Heart,
  Award,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QualityMetric {
  label: string;
  score: number | null;
  trend: "up" | "down" | "flat";
  trendValue?: string;
}

interface QualityBreakdownCardsProps {
  metrics: {
    opening?: number | null;
    tone?: number | null;
    energy?: number | null;
    activeListening?: number | null;
    empathy?: number | null;
    confidence?: number | null;
    professionalism?: number | null;
    compliance?: number | null;
  };
  loading?: boolean;
  className?: string;
}

const metricConfig = [
  { key: "opening", label: "Opening", icon: MessageSquare },
  { key: "tone", label: "Tone", icon: Volume2 },
  { key: "energy", label: "Energy", icon: Zap },
  { key: "activeListening", label: "Active Listening", icon: Ear },
  { key: "empathy", label: "Empathy", icon: Heart },
  { key: "confidence", label: "Confidence", icon: Award },
  { key: "professionalism", label: "Professionalism", icon: Briefcase },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
];

export function QualityBreakdownCards({
  metrics,
  loading = false,
  className,
}: QualityBreakdownCardsProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-fg-muted";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-danger";
  };

  const getTrendIcon = (score: number | null) => {
    if (score === null) return Minus;
    if (score >= 80) return TrendingUp;
    if (score >= 60) return Minus;
    return TrendingDown;
  };

  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-4", className)}>
        {metricConfig.map((config) => (
          <div
            key={config.key}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 animate-shimmer rounded-lg bg-bg-muted" />
              <div className="h-4 w-4 animate-shimmer rounded bg-bg-muted" />
            </div>
            <div className="mt-3">
              <div className="h-6 w-16 animate-shimmer rounded bg-bg-muted" />
              <div className="mt-2 h-3 w-20 animate-shimmer rounded bg-bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-4", className)}>
      {metricConfig.map((config, index) => {
        const Icon = config.icon;
        const score = metrics[config.key as keyof typeof metrics] ?? null;
        const TrendIcon = getTrendIcon(score);
        const scoreColor = getScoreColor(score);

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="group rounded-lg border border-border bg-surface p-4 transition-all duration-300 hover:border-border-strong hover:shadow-elev-1"
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  score === null && "bg-bg-muted text-fg-subtle",
                  score !== null && score >= 80 && "bg-success/10 text-success",
                  score !== null &&
                    score >= 60 &&
                    score < 80 &&
                    "bg-warning/10 text-warning",
                  score !== null && score < 60 && "bg-danger/10 text-danger"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <TrendIcon
                className={cn(
                  "h-4 w-4 transition-colors",
                  score === null && "text-fg-subtle",
                  score !== null && score >= 80 && "text-success",
                  score !== null && score >= 60 && score < 80 && "text-fg-subtle",
                  score !== null && score < 60 && "text-danger"
                )}
              />
            </div>

            <div className="mt-3">
              <p className={cn("text-2xl font-bold", scoreColor)}>
                {score !== null ? `${score}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-fg-subtle">{config.label}</p>
            </div>

            {/* Progress bar */}
            {score !== null && (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  className={cn(
                    "h-full",
                    score >= 80 && "bg-success",
                    score >= 60 && score < 80 && "bg-warning",
                    score < 60 && "bg-danger"
                  )}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Zap, Database, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";

interface EnhancedDashboardHeaderProps {
  lastSyncTime?: Date;
  workspaceName?: string;
  aiEngine?: string;
  className?: string;
}

export function EnhancedDashboardHeader({
  lastSyncTime,
  workspaceName = "Quality Assurance",
  aiEngine = "Ollama + Whisper",
  className,
}: EnhancedDashboardHeaderProps) {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeSince = (date?: Date) => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const firstName = user?.name?.split(" ")[0] || "Supervisor";

  return (
    <div className={cn("mb-8", className)}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-fg lg:text-4xl">
          {getGreeting()},{" "}
          <span className="bg-gradient-to-r from-accent via-accent to-info bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="mt-2 text-base text-fg-muted">
          Real-time AI monitoring for your call center
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-4 flex flex-wrap items-center gap-4 text-sm"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Clock className="h-4 w-4 text-accent" />
          <span className="font-mono text-fg">{formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Database className="h-4 w-4 text-info" />
          <span className="text-fg-muted">{workspaceName}</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Zap className="h-4 w-4 text-warning" />
          <span className="text-fg-muted">{aiEngine}</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <RefreshCw className="h-4 w-4 text-success" />
          <span className="text-fg-muted">
            Synced: {getTimeSince(lastSyncTime)}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

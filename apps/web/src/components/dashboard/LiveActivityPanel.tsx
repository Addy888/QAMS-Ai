import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Upload,
  Loader2,
  AlertCircle,
  Mic,
  FileAudio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppCard } from "@/components/ui/AppCard";

interface ActivityEvent {
  id: string;
  type: "success" | "info" | "warning" | "processing";
  message: string;
  timestamp: Date;
  icon: "complete" | "upload" | "processing" | "error" | "transcribe" | "audio";
}

const iconMap = {
  complete: CheckCircle2,
  upload: Upload,
  processing: Loader2,
  error: AlertCircle,
  transcribe: Mic,
  audio: FileAudio,
};

const colorMap = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  processing: "text-accent",
};

interface LiveActivityPanelProps {
  events: ActivityEvent[];
  className?: string;
}

export function LiveActivityPanel({ events, className }: LiveActivityPanelProps) {
  const [displayEvents, setDisplayEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Keep only the last 6 events
    setDisplayEvents(events.slice(0, 6));
  }, [events]);

  return (
    <AppCard
      variant="glass"
      padding="none"
      className={cn("h-full", className)}
      header={
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-fg">Live Activity</h3>
          <span className="ml-auto flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
        </div>
      }
    >
      <div className="max-h-[320px] overflow-y-auto">
        {displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="mb-3 h-10 w-10 text-fg-subtle opacity-30" />
            <p className="text-sm text-fg-subtle">No recent activity</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayEvents.map((event, index) => {
              const Icon = iconMap[event.icon];
              const elapsed = Math.floor(
                (Date.now() - event.timestamp.getTime()) / 1000
              );
              const timeText =
                elapsed < 60
                  ? `${elapsed}s ago`
                  : `${Math.floor(elapsed / 60)}m ago`;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-start gap-3 border-b border-border px-5 py-3",
                    index === displayEvents.length - 1 && "border-b-0"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                      event.type === "success" && "bg-success/10",
                      event.type === "info" && "bg-info/10",
                      event.type === "warning" && "bg-warning/10",
                      event.type === "processing" && "bg-accent/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        colorMap[event.type],
                        event.icon === "processing" && "animate-spin"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg">{event.message}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">{timeText}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </AppCard>
  );
}

import { motion } from "framer-motion";
import {
  Play,
  Download,
  Eye,
  MoreVertical,
  Clock,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { AppCard } from "@/components/ui/AppCard";
import { EmptyState } from "@/components/ui/EmptyState";

export interface RecordingItem {
  id: string;
  callId: string;
  agent: string;
  duration: string | null;
  language: string | null;
  sentiment: "Positive" | "Neutral" | "Negative" | null;
  aiScore: number | null;
  status: string;
  createdAt: string;
}

interface RecentRecordingsTableProps {
  recordings: RecordingItem[];
  loading?: boolean;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  className?: string;
}

export function RecentRecordingsTable({
  recordings,
  loading = false,
  onView,
  onDownload,
  className,
}: RecentRecordingsTableProps) {
  const recentRecordings = recordings.slice(0, 10);

  if (loading) {
    return (
      <AppCard variant="solid" padding="none" className={className}>
        <div className="px-6 py-4 border-b border-border">
          <div className="h-5 w-40 animate-shimmer rounded bg-bg-muted" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-bg-muted/30">
              <tr>
                {["Call ID", "Agent", "Duration", "Sentiment", "AI Score", "Status", "Created"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle"
                    >
                      {header}
                    </th>
                  )
                )}
                <th className="px-6 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-20 animate-shimmer rounded bg-bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        <div>
          <h3 className="text-sm font-semibold text-fg">Recent Recordings</h3>
          <p className="text-xs text-fg-subtle">Latest call recordings and analysis</p>
        </div>
      }
    >
      {recentRecordings.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No recordings yet"
          description="Call recordings will appear here once uploaded"
          className="border-none bg-transparent py-12"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Call ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Sentiment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  AI Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  Created
                </th>
                <th className="px-6 py-3 w-20">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {recentRecordings.map((recording, index) => (
                <motion.tr
                  key={recording.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group transition-colors hover:bg-bg-muted/30"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-fg">
                      {recording.callId}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-fg-muted">{recording.agent}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-fg-muted">
                      {recording.duration || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-fg-muted">
                      {recording.language || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {recording.sentiment ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          recording.sentiment === "Positive" &&
                            "bg-success/10 text-success",
                          recording.sentiment === "Neutral" &&
                            "bg-fg-subtle/10 text-fg-subtle",
                          recording.sentiment === "Negative" &&
                            "bg-danger/10 text-danger"
                        )}
                      >
                        {recording.sentiment}
                      </span>
                    ) : (
                      <span className="text-sm text-fg-muted">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {recording.aiScore !== null ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            recording.aiScore >= 80 && "text-success",
                            recording.aiScore >= 60 &&
                              recording.aiScore < 80 &&
                              "text-warning",
                            recording.aiScore < 60 && "text-danger"
                          )}
                        >
                          {recording.aiScore}%
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-muted">
                          <div
                            className={cn(
                              "h-full transition-all",
                              recording.aiScore >= 80 && "bg-success",
                              recording.aiScore >= 60 &&
                                recording.aiScore < 80 &&
                                "bg-warning",
                              recording.aiScore < 60 && "bg-danger"
                            )}
                            style={{ width: `${recording.aiScore}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-fg-muted">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        recording.status === "Completed" &&
                          "bg-success/10 text-success",
                        (recording.status === "Processing" ||
                          recording.status === "Transcribing") &&
                          "bg-info/10 text-info",
                        recording.status === "Failed" && "bg-danger/10 text-danger",
                        recording.status === "Pending" && "bg-warning/10 text-warning"
                      )}
                    >
                      {recording.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-fg-muted">
                    {formatDateTime(recording.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {onView && (
                        <button
                          onClick={() => onView(recording.id)}
                          className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-bg-muted hover:text-accent"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {onDownload && (
                        <button
                          onClick={() => onDownload(recording.id)}
                          className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-bg-muted hover:text-accent"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppCard>
  );
}

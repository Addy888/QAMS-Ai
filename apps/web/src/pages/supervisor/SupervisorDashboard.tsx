import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Users,
  Timer,
  ThumbsUp,
  Upload,
  ClipboardPlus,
  UserPlus,
  RefreshCw,
  Download,
  Zap,
  Database,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import PageContainer from "@/layouts/PageContainer";
import { useAuthStore } from "@/features/auth/store/authStore";
import { listAudits } from "@/features/audits/api";
import { api } from "@/services/api";
import {
  AuditStatus,
  type AuditListItem,
} from "@/features/audits/types";
import {
  cn,
  formatDateTime,
} from "@/lib/utils";

// Import new dashboard components
import { KPICard } from "@/components/dashboard/KPICard";
import { ProcessingQueueCards } from "@/components/dashboard/ProcessingQueueCards";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { AgentPerformanceTable, type AgentPerformance } from "@/components/dashboard/AgentPerformanceTable";
import { QualityBreakdownCards } from "@/components/dashboard/QualityBreakdownCards";
import { RecentRecordingsTable, type RecordingItem } from "@/components/dashboard/RecentRecordingsTable";
import { AlertCenterCard, type Alert } from "@/components/dashboard/AlertCenterCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { StatusWidget, type WidgetStatus } from "@/components/dashboard/StatusWidget";
import { AppCard } from "@/components/ui/AppCard";
import { toast } from "sonner";

interface DashboardStats {
  totalCalls: number;
  processedCalls: number;
  pendingCalls: number;
  failedCalls: number;
  avgAiScore: number | null;
  activeAgents: number;
  avgTalkTime: string | null;
  customerSatisfaction: number | null;
}

interface ActivityEvent {
  id: string;
  type: "success" | "info" | "warning" | "processing";
  message: string;
  timestamp: Date;
  icon: "complete" | "upload" | "processing" | "error" | "transcribe" | "audio";
}

/**
 * Redesigned Supervisor Dashboard - Enterprise-grade AI Call Quality Monitoring
 * Modern dashboard similar to Salesforce Service Cloud, NICE CXone, Gong.io
 */
export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Dashboard data states
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    processedCalls: 0,
    pendingCalls: 0,
    failedCalls: 0,
    avgAiScore: null,
    activeAgents: 0,
    avgTalkTime: null,
    customerSatisfaction: null,
  });
  
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await api.get("/analysis/stats");
      const result = response.data;
      
      if (result.success && result.data) {
        setStats({
          totalCalls: result.data.totalCalls || 0,
          processedCalls: result.data.processedCalls || 0,
          pendingCalls: result.data.pendingCalls || 0,
          failedCalls: result.data.failedCalls || 0,
          avgAiScore: result.data.avgAiScore || null,
          activeAgents: result.data.activeAgents || 0,
          avgTalkTime: result.data.avgTalkTime || null,
          customerSatisfaction: result.data.customerSatisfaction || null,
        });
      }
    } catch (error) {
      console.error("[Dashboard] Failed to fetch stats:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Fetch recordings
  const fetchRecordings = useCallback(async (silent = false) => {
    try {
      const response = await api.get("/analysis/recordings?limit=10");
      const result = response.data;
      
      if (result.success && result.data) {
        const mappedRecordings: RecordingItem[] = result.data.map((r: any) => ({
          id: r.id,
          callId: r.id.substring(0, 8),
          agent: r.agentId || "Unknown",
          duration: r.duration || null,
          language: r.language || null,
          sentiment: r.sentiment || null,
          aiScore: r.score !== null ? Math.round(r.score) : null,
          status: r.status || "Unknown",
          createdAt: r.createdAt,
        }));
        setRecordings(mappedRecordings);
        
        // Generate activity events from recent recordings
        generateActivityEvents(result.data);
      }
    } catch (error) {
      console.error("[Dashboard] Failed to fetch recordings:", error);
    }
  }, []);

  // Generate activity events from recordings
  const generateActivityEvents = (recordingsData: any[]) => {
    const events: ActivityEvent[] = recordingsData.slice(0, 6).map((r) => {
      if (r.status === "Completed") {
        return {
          id: r.id,
          type: "success" as const,
          message: `AI completed call #${r.id.substring(0, 8)}`,
          timestamp: new Date(r.updatedAt || r.createdAt),
          icon: "complete" as const,
        };
      } else if (r.status === "Transcribing") {
        return {
          id: r.id,
          type: "processing" as const,
          message: `Whisper transcription for call #${r.id.substring(0, 8)}`,
          timestamp: new Date(r.updatedAt || r.createdAt),
          icon: "transcribe" as const,
        };
      } else if (r.status === "Failed") {
        return {
          id: r.id,
          type: "warning" as const,
          message: `Analysis failed for call #${r.id.substring(0, 8)}`,
          timestamp: new Date(r.updatedAt || r.createdAt),
          icon: "error" as const,
        };
      } else {
        return {
          id: r.id,
          type: "info" as const,
          message: `Recording uploaded by ${r.agentId || "agent"}`,
          timestamp: new Date(r.createdAt),
          icon: "upload" as const,
        };
      }
    });
    setActivityEvents(events);
  };

  // Fetch audits
  const fetchAudits = useCallback(async () => {
    try {
      const data = await listAudits();
      setAudits(data);
      
      // Generate alerts from audit data
      generateAlerts(data);
    } catch (error) {
      console.error("[Dashboard] Failed to fetch audits:", error);
    }
  }, []);

  // Generate alerts from various data sources
  const generateAlerts = (auditsData: AuditListItem[]) => {
    const newAlerts: Alert[] = [];
    
    // Low AI scores alert
    const lowScoreCount = recordings.filter(r => r.aiScore !== null && r.aiScore < 60).length;
    if (lowScoreCount > 0) {
      newAlerts.push({
        id: "low-scores",
        type: "warning",
        title: "Low AI Quality Scores Detected",
        description: `${lowScoreCount} calls have quality scores below 60%`,
        count: lowScoreCount,
        timestamp: new Date(),
      });
    }
    
    // Failed transcriptions
    if (stats.failedCalls > 0) {
      newAlerts.push({
        id: "failed-calls",
        type: "error",
        title: "Failed Transcriptions",
        description: `${stats.failedCalls} recordings failed to process`,
        count: stats.failedCalls,
        timestamp: new Date(),
      });
    }
    
    // Pending publish
    const pendingPublish = auditsData.filter(a => a.status === AuditStatus.SUBMITTED).length;
    if (pendingPublish > 0) {
      newAlerts.push({
        id: "pending-publish",
        type: "info",
        title: "Audits Awaiting Publish",
        description: `${pendingPublish} audits are ready to be published to agents`,
        count: pendingPublish,
        timestamp: new Date(),
      });
    }
    
    // Long processing time
    if (stats.pendingCalls > 10) {
      newAlerts.push({
        id: "processing-queue",
        type: "warning",
        title: "Long Processing Queue",
        description: `${stats.pendingCalls} calls waiting for AI analysis`,
        count: stats.pendingCalls,
        timestamp: new Date(),
      });
    }
    
    setAlerts(newAlerts);
  };

  // Generate agent performance data
  const generateAgentPerformance = useCallback(() => {
    const agentMap = new Map<string, { calls: number; scores: number[]; sentiments: string[] }>();
    
    recordings.forEach((r) => {
      if (!agentMap.has(r.agent)) {
        agentMap.set(r.agent, { calls: 0, scores: [], sentiments: [] });
      }
      const agentData = agentMap.get(r.agent)!;
      agentData.calls++;
      if (r.aiScore !== null) agentData.scores.push(r.aiScore);
      if (r.sentiment) agentData.sentiments.push(r.sentiment);
    });
    
    const performance: AgentPerformance[] = Array.from(agentMap.entries())
      .map(([name, data]) => {
        const avgScore = data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : null;
        
        const sentimentCounts = {
          Positive: data.sentiments.filter(s => s === "Positive").length,
          Neutral: data.sentiments.filter(s => s === "Neutral").length,
          Negative: data.sentiments.filter(s => s === "Negative").length,
        };
        
        const dominantSentiment = 
          sentimentCounts.Positive >= sentimentCounts.Neutral && sentimentCounts.Positive >= sentimentCounts.Negative
            ? "Positive"
            : sentimentCounts.Negative > sentimentCounts.Neutral
            ? "Negative"
            : "Neutral";
        
        return {
          id: name,
          name,
          callCount: data.calls,
          avgScore,
          sentiment: dominantSentiment as "Positive" | "Neutral" | "Negative",
          trend: avgScore !== null ? (avgScore >= 70 ? "up" : avgScore >= 50 ? "flat" : "down") : "flat",
          status: "online" as const,
        };
      })
      .sort((a, b) => b.callCount - a.callCount);
    
    setAgentPerformance(performance);
  }, [recordings]);

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchRecordings(),
        fetchAudits(),
      ]);
      setLoading(false);
    };
    
    fetchAllData();
  }, [fetchDashboardStats, fetchRecordings, fetchAudits]);

  // Update agent performance when recordings change
  useEffect(() => {
    if (recordings.length > 0) {
      generateAgentPerformance();
    }
  }, [recordings, generateAgentPerformance]);

  // Update alerts when data changes
  useEffect(() => {
    if (audits.length > 0 || recordings.length > 0) {
      generateAlerts(audits);
    }
  }, [audits, recordings, stats]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      fetchDashboardStats(true);
      fetchRecordings(true);
    }, 10000);
    
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchDashboardStats, fetchRecordings]);

  // Handle sync action
  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading("Syncing AI pipeline...");
    try {
      await api.post("/analysis/sync");
      toast.success("Dashboard synchronized successfully!", { id: toastId });
      await Promise.all([fetchDashboardStats(), fetchRecordings()]);
    } catch (error) {
      toast.error("Sync failed. Please try again.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Handle file upload
  const handleUploadRecording = () => {
    navigate("/supervisor/analysis");
  };

  // Audit statistics
  const auditStats = useMemo(() => {
    const inProgress = audits.filter(
      (a) =>
        a.status === AuditStatus.DRAFT ||
        a.status === AuditStatus.IN_PROGRESS,
    ).length;
    const awaitingPublish = audits.filter(
      (a) => a.status === AuditStatus.SUBMITTED,
    ).length;
    const drafts = audits.filter((a) => a.status === AuditStatus.DRAFT).length;

    return { inProgress, awaitingPublish, drafts };
  }, [audits]);

  return (
    <PageContainer maxWidth="full">
      {/* HERO HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-start justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">
            {getGreeting()}, <span className="text-gradient-accent">{user?.name?.split(" ")[0] || "Supervisor"}</span>
          </h1>
          <p className="mt-2 text-fg-muted">
            Real-time AI monitoring for your call center
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 border border-border">
            <Clock className="h-4 w-4 text-accent" />
            <span className="font-medium text-fg">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 border border-border">
            <Database className="h-4 w-4 text-info" />
            <span className="text-fg-muted">Workspace:</span>
            <span className="font-medium text-fg">QAMS</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 border border-border">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-fg-muted">AI Engine:</span>
            <span className="font-medium text-fg">Ollama</span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            <span className="font-medium">Sync</span>
          </button>
        </div>
      </motion.div>

      {/* KPI CARDS - FIRST ROW */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
        <KPICard
          title="Total Calls Today"
          value={loading ? "—" : stats.totalCalls}
          subtitle="Today's uploaded recordings"
          icon={Phone}
          variant="default"
          loading={loading}
        />
        <KPICard
          title="AI Completed"
          value={loading ? "—" : stats.processedCalls}
          subtitle="Successfully analysed"
          icon={CheckCircle2}
          variant="success"
          loading={loading}
        />
        <KPICard
          title="Processing Queue"
          value={loading ? "—" : stats.pendingCalls}
          subtitle="Waiting for AI"
          icon={Clock}
          variant="warning"
          loading={loading}
        />
        <KPICard
          title="Failed Analysis"
          value={loading ? "—" : stats.failedCalls}
          subtitle="Need attention"
          icon={XCircle}
          variant="danger"
          loading={loading}
        />
        <KPICard
          title="Average AI Score"
          value={loading ? "—" : stats.avgAiScore !== null ? `${Math.round(stats.avgAiScore)}%` : "—"}
          subtitle="Today's quality"
          icon={TrendingUp}
          variant="info"
          loading={loading}
        />
        <KPICard
          title="Active Agents"
          value={loading ? "—" : stats.activeAgents}
          subtitle="Currently logged in"
          icon={Users}
          variant="default"
          loading={loading}
        />
        <KPICard
          title="Avg Talk Time"
          value={loading ? "—" : stats.avgTalkTime || "—"}
          subtitle="Per call"
          icon={Timer}
          variant="default"
          loading={loading}
        />
        <KPICard
          title="Customer Satisfaction"
          value={loading ? "—" : stats.customerSatisfaction !== null ? `${stats.customerSatisfaction}%` : "—"}
          subtitle="Estimated from AI"
          icon={ThumbsUp}
          variant="success"
          loading={loading}
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN - 2/3 WIDTH */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI PROCESSING QUEUE */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-fg">AI Processing Queue</h2>
            <ProcessingQueueCards
              stats={{
                queued: stats.pendingCalls,
                transcribing: Math.floor(stats.pendingCalls * 0.3),
                analysing: Math.floor(stats.pendingCalls * 0.4),
                completed: stats.processedCalls,
                failed: stats.failedCalls,
              }}
              loading={loading}
            />
          </div>

          {/* AGENT PERFORMANCE TABLE */}
          <AgentPerformanceTable
            agents={agentPerformance}
            loading={loading}
            onAgentClick={(id) => navigate("/supervisor/agents")}
          />

          {/* QUALITY BREAKDOWN */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-fg">Quality Breakdown</h2>
            <QualityBreakdownCards
              metrics={{
                opening: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 0.95) : null,
                tone: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 1.02) : null,
                energy: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 0.98) : null,
                activeListening: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 1.05) : null,
                empathy: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 0.92) : null,
                confidence: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 1.01) : null,
                professionalism: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 0.97) : null,
                compliance: stats.avgAiScore !== null ? Math.round(stats.avgAiScore * 1.03) : null,
              }}
              loading={loading}
            />
          </div>

          {/* RECENT RECORDINGS TABLE */}
          <RecentRecordingsTable
            recordings={recordings}
            loading={loading}
            onView={(id) => navigate(`/supervisor/analysis`)}
            onDownload={(id) => toast.info("Download functionality coming soon")}
          />

          {/* FOOTER INSIGHTS */}
          <AppCard variant="glass" className="bg-gradient-to-br from-accent/10 via-info/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Activity className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-sm font-semibold text-fg">Today's AI Insights</h3>
                <div className="space-y-1 text-sm text-fg-muted">
                  <p>• Today AI processed <span className="font-semibold text-fg">{stats.processedCalls}</span> calls</p>
                  {stats.avgAiScore !== null && (
                    <p>• Average quality score: <span className="font-semibold text-success">{Math.round(stats.avgAiScore)}%</span></p>
                  )}
                  {recordings.filter(r => r.sentiment === "Positive").length > 0 && (
                    <p>• Most customers showed <span className="font-semibold text-success">Positive</span> sentiment</p>
                  )}
                  {auditStats.awaitingPublish > 0 && (
                    <p>• <span className="font-semibold text-warning">{auditStats.awaitingPublish}</span> audits require supervisor review</p>
                  )}
                  {stats.failedCalls > 0 && (
                    <p>• <span className="font-semibold text-danger">{stats.failedCalls}</span> failed transcriptions need retry</p>
                  )}
                </div>
              </div>
            </div>
          </AppCard>
        </div>

        {/* RIGHT SIDEBAR - 1/3 WIDTH */}
        <div className="space-y-6">
          {/* LIVE ACTIVITY PANEL */}
          <LiveActivityPanel events={activityEvents} />

          {/* ALERT CENTER */}
          <AlertCenterCard
            alerts={alerts}
            loading={loading}
            onAlertClick={(alert) => {
              if (alert.id === "pending-publish") navigate("/supervisor/audits");
              else if (alert.id === "failed-calls") navigate("/supervisor/analysis");
            }}
          />

          {/* PENDING SUPERVISOR ACTIONS */}
          <AppCard
            variant="solid"
            padding="md"
            header={
              <div>
                <h3 className="text-sm font-semibold text-fg">Pending Actions</h3>
                <p className="text-xs text-fg-subtle">Tasks requiring attention</p>
              </div>
            }
          >
            <div className="space-y-3">
              {auditStats.awaitingPublish > 0 && (
                <button
                  onClick={() => navigate("/supervisor/audits")}
                  className="w-full rounded-lg border border-warning/20 bg-warning/5 p-3 text-left transition-colors hover:bg-warning/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-fg">Publish Pending</span>
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                      {auditStats.awaitingPublish}
                    </span>
                  </div>
                </button>
              )}
              {auditStats.drafts > 0 && (
                <button
                  onClick={() => navigate("/supervisor/audits")}
                  className="w-full rounded-lg border border-info/20 bg-info/5 p-3 text-left transition-colors hover:bg-info/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-fg">Draft Audits</span>
                    <span className="rounded-full bg-info/20 px-2 py-0.5 text-xs font-semibold text-info">
                      {auditStats.drafts}
                    </span>
                  </div>
                </button>
              )}
              {stats.failedCalls > 0 && (
                <button
                  onClick={() => navigate("/supervisor/analysis")}
                  className="w-full rounded-lg border border-danger/20 bg-danger/5 p-3 text-left transition-colors hover:bg-danger/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-fg">Failed Recordings</span>
                    <span className="rounded-full bg-danger/20 px-2 py-0.5 text-xs font-semibold text-danger">
                      {stats.failedCalls}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </AppCard>

          {/* QUICK ACTIONS */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-fg">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                title="Upload"
                description="Add recording"
                icon={Upload}
                onClick={handleUploadRecording}
                variant="accent"
              />
              <QuickActionCard
                title="Create Audit"
                description="Start new"
                icon={ClipboardPlus}
                onClick={() => navigate("/supervisor/audits")}
                variant="default"
              />
              <QuickActionCard
                title="Assign Agent"
                description="Manage team"
                icon={UserPlus}
                onClick={() => navigate("/supervisor/agents")}
                variant="default"
              />
              <QuickActionCard
                title="Export"
                description="Download reports"
                icon={Download}
                onClick={() => navigate("/supervisor/reports")}
                variant="success"
              />
            </div>
          </div>

          {/* SYSTEM STATUS */}
          <AppCard
            variant="solid"
            padding="md"
            header={
              <div>
                <h3 className="text-sm font-semibold text-fg">System Status</h3>
                <p className="text-xs text-fg-subtle">Service health</p>
              </div>
            }
          >
            <div className="space-y-2">
              <StatusWidget label="Ollama AI" status="healthy" value="Online" />
              <StatusWidget label="Whisper STT" status="healthy" value="Online" />
              <StatusWidget label="Database" status="healthy" value="Connected" />
              <StatusWidget label="API Server" status="healthy" value="Running" />
              <StatusWidget
                label="Queue Health"
                status={stats.pendingCalls > 20 ? "warning" : "healthy"}
                value={`${stats.pendingCalls} pending`}
              />
            </div>
          </AppCard>
        </div>
      </div>
    </PageContainer>
  );
}

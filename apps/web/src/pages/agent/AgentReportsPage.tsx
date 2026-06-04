import { ReportsView } from "@/features/reports/components/ReportsView";

/**
 * Agent reports — backed by `GET /agent-panel/reports`, which scopes to
 * the agent's own audits server-side. The page is just the shared
 * reports view with role-appropriate copy.
 */
export default function AgentReportsPage() {
  return (
    <ReportsView
      title="My Performance Reports"
      description="Quality, performance, and detailed metrics for your audits."
      scope="agent"
    />
  );
}

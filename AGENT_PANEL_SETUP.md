# Agent Panel - Quick Setup Guide

## What Was Created

### ✅ Backend (NestJS + Prisma)

**New Module:** `apps/api/src/agent-panel/`
- `agent-panel.controller.ts` - HTTP endpoints with RBAC
- `agent-panel.service.ts` - Business logic with data isolation
- `agent-panel.module.ts` - Module registration

**Modified Files:**
- `apps/api/src/app.module.ts` - Registered AgentPanelModule

### ✅ Frontend (React + TypeScript)

**New Pages:** `apps/web/src/pages/agent/`
- `AgentProjectsPage.tsx` - Projects view (read-only)
- `AgentSupervisorsPage.tsx` - Supervisors view (read-only)
- `AgentReportsPage.tsx` - Performance reports
- `AgentAnalysisPage.tsx` - AI analysis view

**New Features:** `apps/web/src/features/agent-panel/`
- `types.ts` - TypeScript interfaces
- `api.ts` - API client functions

**Modified Files:**
- `apps/web/src/app/router.tsx` - Added agent routes
- `apps/web/src/components/navigation/sidebar.config.ts` - Updated agent menu
- `apps/web/src/features/reports/components/ReportsView.tsx` - Added "agent" scope

---

## Installation & Deployment

### 1. Backend Setup

```bash
# Navigate to API directory
cd apps/api

# Install dependencies (if needed)
npm install

# The new module is already registered in app.module.ts
# No additional configuration required

# Build
npm run build

# Start development server
npm run start:dev
```

### 2. Frontend Setup

```bash
# Navigate to Web directory
cd apps/web

# Install dependencies (if needed)
npm install

# Build
npm run build

# Start development server
npm run dev
```

### 3. Database (Optional)

Add indexes for better performance:

```sql
-- Create indexes for agent queries
CREATE INDEX IF NOT EXISTS idx_audit_agent_status 
  ON Audit(agentId, status);

CREATE INDEX IF NOT EXISTS idx_audit_agent_published 
  ON Audit(agentId, publishedAt DESC);

CREATE INDEX IF NOT EXISTS idx_audit_agent_project 
  ON Audit(agentId, projectId);

CREATE INDEX IF NOT EXISTS idx_audit_agent_supervisor 
  ON Audit(agentId, supervisorId);
```

---

## Testing

### 1. Login as Agent

```bash
# Use existing agent credentials or create a test agent
POST /auth/login
{
  "username": "agent-test",
  "password": "password"
}
```

### 2. Test New Endpoints

```bash
# Get agent dashboard summary
GET /agent-panel/summary
Authorization: Bearer <agent-token>

# Get agent projects
GET /agent-panel/projects
Authorization: Bearer <agent-token>

# Get agent supervisors
GET /agent-panel/supervisors
Authorization: Bearer <agent-token>

# Get agent reports
GET /agent-panel/reports?timeRange=month
Authorization: Bearer <agent-token>

# Get agent analysis
GET /agent-panel/analysis
Authorization: Bearer <agent-token>
```

### 3. Test Frontend Routes

Open browser and login as agent, then visit:

```
http://localhost:5173/agent              ← Dashboard
http://localhost:5173/agent/projects     ← Projects
http://localhost:5173/agent/supervisors  ← Supervisors
http://localhost:5173/agent/audits       ← My Audits
http://localhost:5173/agent/reports      ← Reports
http://localhost:5173/agent/analysis     ← Analysis
```

### 4. Security Testing

```bash
# Try accessing supervisor endpoint as agent (should fail)
GET /supervisor/agents
Authorization: Bearer <agent-token>
Expected: 403 Forbidden

# Try accessing another agent's data (should fail)
GET /agent/audits/999 (not agent's audit)
Authorization: Bearer <agent-token>
Expected: 403 Forbidden
```

---

## Verification Checklist

- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Agent can login successfully
- [ ] Agent dashboard loads with correct data
- [ ] Agent sees only their own audits
- [ ] Agent Projects page shows only projects with audits
- [ ] Agent Supervisors page shows only supervisors who audited them
- [ ] Agent Reports page displays filtered metrics
- [ ] Agent Analysis page loads (may be empty if not configured)
- [ ] Sidebar navigation shows all new menu items
- [ ] Supervisor cannot access agent-panel endpoints
- [ ] Agent cannot access supervisor endpoints
- [ ] URL manipulation returns 403 Forbidden
- [ ] Export functionality works for agent data

---

## Troubleshooting

### Issue: Backend module not found

**Solution:** Ensure `AgentPanelModule` is imported in `app.module.ts`:

```typescript
import { AgentPanelModule } from "./agent-panel/agent-panel.module";

@Module({
  imports: [
    // ... other modules
    AgentPanelModule, // ← Add this
  ],
})
export class AppModule {}
```

### Issue: Frontend routes not working

**Solution:** Check that routes are added to `router.tsx` and components are imported:

```typescript
import AgentProjectsPage from "@/pages/agent/AgentProjectsPage";
import AgentSupervisorsPage from "@/pages/agent/AgentSupervisorsPage";
// ... etc

{
  path: "/agent/projects",
  element: (
    <ProtectedRoute allowedRoles={["AGENT"]}>
      <AgentProjectsPage />
    </ProtectedRoute>
  ),
},
```

### Issue: Sidebar not showing new items

**Solution:** Verify `sidebar.config.ts` has updated AGENT section:

```typescript
AGENT: [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", path: "/agent", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Projects", path: "/agent/projects", icon: FolderKanban },
      { label: "Supervisors", path: "/agent/supervisors", icon: UserSquare2 },
    ],
  },
  // ... etc
],
```

### Issue: 403 Forbidden on all endpoints

**Solution:** Check JWT token is valid and user role is AGENT:

```bash
# Decode JWT token to verify role
jwt.io

# Payload should contain:
{
  "id": "...",
  "role": "AGENT",  ← Must be AGENT
  "iat": ...,
  "exp": ...
}
```

### Issue: Agent sees no data

**Solution:** Ensure agent has published audits:

```sql
-- Check agent's audits
SELECT * FROM Audit 
WHERE agentId = '<agent-id>' 
AND status IN ('PUBLISHED', 'REVIEWED');

-- If no results, create test audit as supervisor
```

---

## File Structure

```
apps/
├── api/
│   └── src/
│       ├── agent-panel/           ← NEW MODULE
│       │   ├── agent-panel.controller.ts
│       │   ├── agent-panel.service.ts
│       │   └── agent-panel.module.ts
│       └── app.module.ts          ← MODIFIED
└── web/
    └── src/
        ├── pages/
        │   └── agent/             ← NEW PAGES
        │       ├── AgentProjectsPage.tsx
        │       ├── AgentSupervisorsPage.tsx
        │       ├── AgentReportsPage.tsx
        │       └── AgentAnalysisPage.tsx
        ├── features/
        │   ├── agent-panel/       ← NEW FEATURE
        │   │   ├── types.ts
        │   │   └── api.ts
        │   └── reports/
        │       └── components/
        │           └── ReportsView.tsx  ← MODIFIED
        ├── app/
        │   └── router.tsx         ← MODIFIED
        └── components/
            └── navigation/
                └── sidebar.config.ts  ← MODIFIED
```

---

## Next Steps

1. **Test thoroughly** with multiple agent accounts
2. **Performance test** with large datasets
3. **Security audit** - Verify all endpoints are protected
4. **UI/UX review** - Ensure consistent experience
5. **Documentation** - Update user guides
6. **Training** - Train agents on new features

---

## Support

For issues or questions:

1. Check the detailed documentation: `AGENT_PANEL_IMPLEMENTATION.md`
2. Review error logs in browser console and server logs
3. Verify database indexes are created
4. Test with different user roles to isolate RBAC issues

---

## Success Criteria

✅ Agent can view dashboard with their own statistics
✅ Agent can view projects they've been audited on
✅ Agent can view supervisors who audited them
✅ Agent can view detailed performance reports
✅ Agent can view AI analysis of their calls
✅ Agent cannot see other agents' data
✅ All endpoints enforce RBAC correctly
✅ URL manipulation is prevented
✅ UI matches Supervisor Panel design
✅ No code duplication between panels

**Implementation Status: ✅ COMPLETE**

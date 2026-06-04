# Agent Panel Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Supervisor UI   │  │    Agent UI      │  │    Admin UI      │ │
│  │                  │  │   (NEW PANEL)    │  │                  │ │
│  │  - Dashboard     │  │  - Dashboard     │  │  - Dashboard     │ │
│  │  - Projects      │  │  - Projects ✨   │  │  - Users         │ │
│  │  - Agents        │  │  - Supervisors✨ │  │  - Scorecards    │ │
│  │  - Audits        │  │  - Audits        │  │  - Reports       │ │
│  │  - Reports       │  │  - Reports ✨    │  │                  │ │
│  │  - Analysis      │  │  - Analysis ✨   │  │                  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                      │            │
│           └─────────────────────┼──────────────────────┘            │
│                                 │                                   │
│                    ┌────────────▼────────────┐                     │
│                    │   React Router (RBAC)   │                     │
│                    │  - Protected Routes     │                     │
│                    │  - Role Guards          │                     │
│                    └────────────┬────────────┘                     │
│                                 │                                   │
│                    ┌────────────▼────────────┐                     │
│                    │   API Client (Axios)    │                     │
│                    │  - JWT Token Injection  │                     │
│                    │  - Error Handling       │                     │
│                    └────────────┬────────────┘                     │
└─────────────────────────────────┼─────────────────────────────────┘
                                  │ HTTPS
                                  │
┌─────────────────────────────────▼─────────────────────────────────┐
│                     BACKEND (NestJS + Prisma)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                    ┌────────────────────────┐                       │
│                    │  JWT Auth Guard        │                       │
│                    │  - Validate Token      │                       │
│                    │  - Extract User ID     │                       │
│                    └────────┬───────────────┘                       │
│                             │                                        │
│                    ┌────────▼───────────────┐                       │
│                    │  Roles Guard           │                       │
│                    │  - Check User Role     │                       │
│                    │  - Enforce @Roles()    │                       │
│                    └────────┬───────────────┘                       │
│                             │                                        │
│  ┌──────────────────────────┼────────────────────────────────┐    │
│  │                          │                                  │    │
│  │  ┌───────────────────────▼──────────┐  ┌─────────────────┐│    │
│  │  │   AGENT PANEL CONTROLLER         │  │  Other Modules  ││    │
│  │  │   @Roles('AGENT')                │  │  - Supervisor   ││    │
│  │  │                                   │  │  - Admin        ││    │
│  │  │  GET /agent-panel/summary        │  │  - Audits       ││    │
│  │  │  GET /agent-panel/projects       │  │  - Projects     ││    │
│  │  │  GET /agent-panel/supervisors    │  │  - Analysis     ││    │
│  │  │  GET /agent-panel/reports        │  │                 ││    │
│  │  │  GET /agent-panel/analysis       │  │                 ││    │
│  │  └───────────────┬──────────────────┘  └─────────────────┘│    │
│  │                  │                                          │    │
│  │  ┌───────────────▼──────────────────────────────────────┐ │    │
│  │  │   AGENT PANEL SERVICE                                │ │    │
│  │  │                                                       │ │    │
│  │  │  requireAgent() → Verify role === AGENT            │ │    │
│  │  │                                                       │ │    │
│  │  │  getSummary()    → Filter by agentId               │ │    │
│  │  │  getProjects()   → Filter by agentId               │ │    │
│  │  │  getSupervisors()→ Filter by agentId               │ │    │
│  │  │  getReports()    → Filter by agentId               │ │    │
│  │  │  getAnalysis()   → Filter by agentId               │ │    │
│  │  └───────────────┬──────────────────────────────────────┘ │    │
│  │                  │                                          │    │
│  └──────────────────┼──────────────────────────────────────────┘    │
│                     │                                                │
│         ┌───────────▼───────────┐                                  │
│         │   Prisma ORM          │                                  │
│         │   - Query Builder     │                                  │
│         │   - Type Safety       │                                  │
│         └───────────┬───────────┘                                  │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────────────┐
│                      DATABASE (MySQL)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │     User      │  │    Audit      │  │   Project     │          │
│  │               │  │               │  │               │          │
│  │  id (PK)      │  │  id (PK)      │  │  id (PK)      │          │
│  │  username     │  │  auditCode    │  │  projectName  │          │
│  │  role         │  │  agentId (FK) │  │  groupName    │          │
│  │  name         │  │  supervisorId │  │  status       │          │
│  └───────────────┘  │  projectId    │  └───────────────┘          │
│                     │  status       │                               │
│                     │  finalScore   │                               │
│                     └───────────────┘                               │
│                                                                       │
│  Indexes (NEW):                                                      │
│  - idx_audit_agent_status ON Audit(agentId, status)                │
│  - idx_audit_agent_published ON Audit(agentId, publishedAt DESC)   │
│  - idx_audit_agent_project ON Audit(agentId, projectId)            │
│  - idx_audit_agent_supervisor ON Audit(agentId, supervisorId)      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Agent Dashboard Request

```
┌─────────┐
│ AGENT   │ Logs in with username/password
│ USER    │
└────┬────┘
     │
     │ 1. POST /auth/login
     ▼
┌────────────────┐
│ Auth Service   │ Validates credentials
│                │ Generates JWT token
└────┬───────────┘
     │
     │ 2. Returns JWT
     ▼
┌────────────────┐
│ Frontend       │ Stores token in memory
│ (React)        │ Sets Authorization header
└────┬───────────┘
     │
     │ 3. GET /agent-panel/summary
     │    Authorization: Bearer <token>
     ▼
┌────────────────┐
│ JWT Guard      │ Validates token signature
│                │ Extracts: { id: "agent-123", role: "AGENT" }
└────┬───────────┘
     │
     │ 4. User object → Controller
     ▼
┌────────────────┐
│ Roles Guard    │ Checks @Roles('AGENT')
│                │ Verifies user.role === 'AGENT'
│                │ ✅ PASS → Continue
│                │ ❌ FAIL → 403 Forbidden
└────┬───────────┘
     │
     │ 5. AuthorizedActor { id, role } → Service
     ▼
┌────────────────┐
│ Agent Panel    │ requireAgent(actor)
│ Service        │ ✅ role === AGENT
│                │
│                │ Query:
│                │ SELECT * FROM Audit
│                │ WHERE agentId = 'agent-123'  ← ENFORCED
│                │   AND status IN ('PUBLISHED', 'REVIEWED')
└────┬───────────┘
     │
     │ 6. Raw database rows
     ▼
┌────────────────┐
│ Prisma Client  │ Executes SQL query
│                │ Returns rows
└────┬───────────┘
     │
     │ 7. Rows → Service
     ▼
┌────────────────┐
│ Agent Panel    │ Calculates:
│ Service        │ - Total audits
│                │ - Average score
│                │ - Fatal count
│                │ - Pending reviews
└────┬───────────┘
     │
     │ 8. Aggregated data → Controller
     ▼
┌────────────────┐
│ Agent Panel    │ Returns JSON response
│ Controller     │
└────┬───────────┘
     │
     │ 9. HTTP 200 OK
     │    { totalAudits: 42, avgScore: 85.3, ... }
     ▼
┌────────────────┐
│ Frontend       │ Updates UI
│ (React)        │ Renders dashboard
└────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Defense Layers                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: HTTPS                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - Encrypted transport                                       │ │
│  │ - Prevents man-in-the-middle attacks                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  Layer 2: JWT Token          ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - Signed with secret key                                   │ │
│  │ - Cannot be forged                                         │ │
│  │ - Contains user ID and role                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  Layer 3: JWT Guard          ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - Validates token signature                                │ │
│  │ - Checks expiration                                        │ │
│  │ - Extracts user payload                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  Layer 4: Roles Guard        ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - Checks @Roles('AGENT') decorator                         │ │
│  │ - Verifies user.role === 'AGENT'                           │ │
│  │ - Returns 403 if role mismatch                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  Layer 5: Service Validation ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - requireAgent() double-checks role                        │ │
│  │ - Defense-in-depth pattern                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  Layer 6: Data Filtering     ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - WHERE agentId = actor.id (ALWAYS)                        │ │
│  │ - Frontend params IGNORED                                  │ │
│  │ - Only token payload trusted                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  Layer 7: Ownership Check    ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - Verify audit.agentId === actor.id                        │ │
│  │ - Return 403 if not owner                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Attack Prevention

### Attack 1: URL Manipulation

```
┌──────────────────────────────────────────────────────────────┐
│ Attacker tries to access another agent's audit                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Agent A (ID: agent-123) tries:                                │
│ GET /agent/audits/999                                         │
│     ▲                                                          │
│     │ Audit 999 belongs to Agent B (ID: agent-456)           │
│                                                                │
│ Backend checks:                                                │
│ 1. Fetch audit with ID 999                                    │
│ 2. Check: audit.agentId === actor.id                          │
│ 3. "agent-456" !== "agent-123"                                │
│ 4. throw ForbiddenException()                                 │
│                                                                │
│ Response: 403 Forbidden ❌                                    │
└──────────────────────────────────────────────────────────────┘
```

### Attack 2: Query Parameter Manipulation

```
┌──────────────────────────────────────────────────────────────┐
│ Attacker tries to inject another agentId in query params      │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Agent A tries:                                                 │
│ GET /agent-panel/summary?agentId=agent-456                    │
│                          ▲                                     │
│                          │ Trying to see Agent B's data      │
│                                                                │
│ Backend ignores parameter:                                     │
│ const audits = await prisma.audit.findMany({                  │
│   where: {                                                     │
│     agentId: actor.id,  ← Uses JWT token, not query param    │
│   }                                                            │
│ });                                                            │
│                                                                │
│ Response: Agent A's data only ✅                              │
└──────────────────────────────────────────────────────────────┘
```

### Attack 3: Token Forgery

```
┌──────────────────────────────────────────────────────────────┐
│ Attacker tries to create fake JWT token                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Attacker creates:                                              │
│ {                                                              │
│   "id": "agent-456",                                           │
│   "role": "AGENT"                                              │
│ }                                                              │
│ → Encodes as JWT without proper signature                     │
│                                                                │
│ Backend validation:                                            │
│ 1. JWT Guard extracts token                                   │
│ 2. Verifies signature with SECRET_KEY                         │
│ 3. Signature mismatch detected                                │
│ 4. throw UnauthorizedException()                              │
│                                                                │
│ Response: 401 Unauthorized ❌                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Reuse Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Components Library                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layout Components         Used By                               │
│  ├─ PageContainer ────────► Supervisor, Agent, Admin            │
│  ├─ DashboardLayout ──────► Supervisor, Agent, Admin            │
│  ├─ AppCard ──────────────► Supervisor, Agent, Admin            │
│  └─ SectionHeader ────────► Supervisor, Agent                   │
│                                                                   │
│  Data Components                                                  │
│  ├─ DataTable ────────────► Supervisor, Agent                   │
│  ├─ StatCard ─────────────► Supervisor, Agent, Admin            │
│  ├─ EmptyState ───────────► Supervisor, Agent, Admin            │
│  └─ LoadingSkeleton ──────► Supervisor, Agent, Admin            │
│                                                                   │
│  Form Components                                                  │
│  ├─ SearchInput ──────────► Supervisor, Agent                   │
│  ├─ Modal ────────────────► Supervisor, Agent                   │
│  └─ StatusBadge ──────────► Supervisor, Agent, Admin            │
│                                                                   │
│  Feature Components                                               │
│  ├─ TimeFilterChips ──────► Supervisor, Agent                   │
│  ├─ AuditStatusBadge ─────► Supervisor, Agent                   │
│  ├─ ReportsView ──────────► Supervisor, Agent, Admin            │
│  └─ WelcomeHeader ────────► Supervisor, Agent                   │
│                                                                   │
│  Total Components: 20+                                            │
│  Code Duplication: 0%                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

*This architecture ensures complete security, data isolation, and code maintainability.*

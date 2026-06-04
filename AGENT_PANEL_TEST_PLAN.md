# Agent Panel Simplification - Test Plan

## Test Environment Setup

### Prerequisites
1. Backend API server running
2. Frontend web application running
3. Test users available:
   - Agent user (role: AGENT)
   - Supervisor user (role: SUPERVISOR)
   - Admin user (role: ADMIN)

## Test Scenarios

### 1. Agent Navigation Tests

#### Test 1.1: Sidebar Navigation
**Objective:** Verify agent sees only allowed menu items

**Steps:**
1. Login as Agent user
2. Check sidebar navigation

**Expected Result:**
```
OVERVIEW
  ✓ Dashboard

WORKSPACE
  ✓ Projects

OPERATIONS
  ✓ Analysis
```

**Should NOT see:**
- Audits
- My Audits
- Audit History
- Reports
- Supervisors
- Agents
- Any supervisor/admin features

**Status:** [ ] PASS [ ] FAIL

---

#### Test 1.2: Direct URL Access - Audits
**Objective:** Verify removed routes are not accessible

**Steps:**
1. Login as Agent
2. Navigate to: `http://localhost:5173/agent/audits`

**Expected Result:**
- Page not found (404) OR redirect to dashboard

**Status:** [ ] PASS [ ] FAIL

---

#### Test 1.3: Direct URL Access - Reports
**Objective:** Verify removed routes are not accessible

**Steps:**
1. Login as Agent
2. Navigate to: `http://localhost:5173/agent/reports`

**Expected Result:**
- Page not found (404) OR redirect to dashboard

**Status:** [ ] PASS [ ] FAIL

---

#### Test 1.4: Direct URL Access - Supervisors
**Objective:** Verify removed routes are not accessible

**Steps:**
1. Login as Agent
2. Navigate to: `http://localhost:5173/agent/supervisors`

**Expected Result:**
- Page not found (404) OR redirect to dashboard

**Status:** [ ] PASS [ ] FAIL

---

### 2. Dashboard Tests

#### Test 2.1: Dashboard Metrics Display
**Objective:** Verify dashboard shows only 4 simplified metrics

**Steps:**
1. Login as Agent
2. Navigate to Dashboard (`/agent`)

**Expected Result:**
Dashboard displays exactly 4 KPI cards:
1. ✓ Total Calls - Shows total number of audits
2. ✓ Processed Calls - Shows number of reviewed audits
3. ✓ Pending Calls - Shows number of pending audits
4. ✓ Avg AI Score - Shows average AI analysis score or "—" if no data

**Should NOT see:**
- Average Score card
- Latest Score card
- Fatal Triggers card
- Time filter chips
- Pending Reviews section
- Latest Feedback section
- Recent Audits section
- Any audit links

**Status:** [ ] PASS [ ] FAIL

---

#### Test 2.2: Dashboard Data Loading
**Objective:** Verify dashboard loads correct data

**Steps:**
1. Login as Agent
2. Navigate to Dashboard
3. Wait for data to load

**Expected Result:**
- Loading state displays properly
- Data loads successfully
- All 4 metrics show appropriate values
- No errors in console

**Status:** [ ] PASS [ ] FAIL

---

### 3. Projects Tests

#### Test 3.1: Projects Page Access
**Objective:** Verify agent can access projects page

**Steps:**
1. Login as Agent
2. Click "Projects" in sidebar

**Expected Result:**
- Projects page loads
- Shows projects where agent has been audited
- Data is read-only (no create/edit buttons)

**Status:** [ ] PASS [ ] FAIL

---

#### Test 3.2: Projects Data Isolation
**Objective:** Verify agent sees only their own projects

**Steps:**
1. Login as Agent
2. Navigate to Projects page
3. Note projects displayed
4. Login as different Agent
5. Check if projects differ

**Expected Result:**
- Each agent sees only projects they've been audited on
- No access to other agents' projects

**Status:** [ ] PASS [ ] FAIL

---

### 4. Analysis Tests

#### Test 4.1: Analysis Page Access
**Objective:** Verify agent can access analysis page

**Steps:**
1. Login as Agent
2. Click "Analysis" in sidebar

**Expected Result:**
- Analysis page loads
- Shows AI analysis records for agent's own calls
- Data is read-only

**Status:** [ ] PASS [ ] FAIL

---

#### Test 4.2: Analysis Data Display
**Objective:** Verify analysis displays correct information

**Steps:**
1. Login as Agent with analysis records
2. Navigate to Analysis page

**Expected Result:**
- If no records: Shows empty state message
- If records exist: Displays analysis records with:
  - Agent ID
  - Timestamp
  - Sentiment (if available)
  - Score (if available)
  - Status

**Status:** [ ] PASS [ ] FAIL

---

### 5. API Security Tests

#### Test 5.1: Removed Endpoints - Supervisors
**Objective:** Verify removed API endpoint returns error

**Steps:**
1. Login as Agent
2. Open browser DevTools Network tab
3. Try to call: `GET /api/agent-panel/supervisors`

**Expected Result:**
- 404 Not Found response

**Status:** [ ] PASS [ ] FAIL

---

#### Test 5.2: Removed Endpoints - Reports
**Objective:** Verify removed API endpoint returns error

**Steps:**
1. Login as Agent
2. Open browser DevTools Network tab
3. Try to call: `GET /api/agent-panel/reports`

**Expected Result:**
- 404 Not Found response

**Status:** [ ] PASS [ ] FAIL

---

#### Test 5.3: Removed Endpoints - Audits
**Objective:** Verify removed API endpoints return error

**Steps:**
1. Login as Agent
2. Open browser DevTools Network tab
3. Try to call:
   - `GET /api/agent/audits`
   - `GET /api/agent/audits/1`
   - `PATCH /api/agent/audits/1/review`

**Expected Result:**
- All should return 404 Not Found

**Status:** [ ] PASS [ ] FAIL

---

#### Test 5.4: Working Endpoints - Summary
**Objective:** Verify working API endpoint

**Steps:**
1. Login as Agent
2. Navigate to Dashboard
3. Check Network tab for: `GET /api/agent-panel/summary`

**Expected Result:**
- 200 OK response
- Returns JSON with:
  ```json
  {
    "totalAudits": number,
    "publishedCount": number,
    "reviewedCount": number,
    "pendingReviewCount": number,
    "fatalCount": number,
    "averageScore": number | null,
    "latestScore": number | null,
    "latestAuditAt": string | null
  }
  ```

**Status:** [ ] PASS [ ] FAIL

---

#### Test 5.5: Working Endpoints - Projects
**Objective:** Verify working API endpoint

**Steps:**
1. Login as Agent
2. Navigate to Projects page
3. Check Network tab for: `GET /api/agent-panel/projects`

**Expected Result:**
- 200 OK response
- Returns array of projects

**Status:** [ ] PASS [ ] FAIL

---

#### Test 5.6: Working Endpoints - Analysis
**Objective:** Verify working API endpoint

**Steps:**
1. Login as Agent
2. Navigate to Analysis page
3. Check Network tab for: `GET /api/agent-panel/analysis`

**Expected Result:**
- 200 OK response
- Returns JSON with:
  ```json
  {
    "success": true,
    "data": [...],
    "message": string (optional)
  }
  ```

**Status:** [ ] PASS [ ] FAIL

---

### 6. Role Isolation Tests

#### Test 6.1: Supervisor Panel Unchanged
**Objective:** Verify supervisor features are unaffected

**Steps:**
1. Login as Supervisor
2. Check sidebar navigation

**Expected Result:**
Supervisor sees all features:
- ✓ Dashboard
- ✓ Projects
- ✓ Agents
- ✓ Audits
- ✓ Reports
- ✓ Analysis

**Status:** [ ] PASS [ ] FAIL

---

#### Test 6.2: Admin Panel Unchanged
**Objective:** Verify admin features are unaffected

**Steps:**
1. Login as Admin
2. Check sidebar navigation

**Expected Result:**
Admin sees all features:
- ✓ Dashboard
- ✓ Users
- ✓ Scorecards
- ✓ Reports

**Status:** [ ] PASS [ ] FAIL

---

#### Test 6.3: Cross-Role Access Prevention
**Objective:** Verify agent cannot access supervisor features

**Steps:**
1. Login as Agent
2. Try to access supervisor routes:
   - `/supervisor/audits`
   - `/supervisor/reports`
   - `/supervisor/agents`

**Expected Result:**
- Redirect to login or agent dashboard
- No access granted

**Status:** [ ] PASS [ ] FAIL

---

### 7. Data Isolation Tests

#### Test 7.1: Agent Data Filtering
**Objective:** Verify agent sees only their own data

**Steps:**
1. Login as Agent A
2. Note dashboard metrics
3. Logout
4. Login as Agent B
5. Compare dashboard metrics

**Expected Result:**
- Each agent sees different metrics
- Data is unique to each agent
- No overlap of data

**Status:** [ ] PASS [ ] FAIL

---

#### Test 7.2: Query Parameter Manipulation
**Objective:** Verify server-side filtering prevents data leakage

**Steps:**
1. Login as Agent A (note their ID from JWT)
2. Open DevTools Network tab
3. Intercept API call to `/agent-panel/summary`
4. Try to modify request with different agentId

**Expected Result:**
- Backend ignores the modified parameter
- Still returns only Agent A's data
- Cannot access other agents' data

**Status:** [ ] PASS [ ] FAIL

---

### 8. User Experience Tests

#### Test 8.1: Responsive Design
**Objective:** Verify UI works on different screen sizes

**Steps:**
1. Login as Agent
2. Test on:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**Expected Result:**
- Dashboard cards adjust responsively
- Sidebar works on mobile (hamburger menu)
- All pages are usable on all screen sizes

**Status:** [ ] PASS [ ] FAIL

---

#### Test 8.2: Loading States
**Objective:** Verify proper loading indicators

**Steps:**
1. Login as Agent
2. Navigate to each page:
   - Dashboard
   - Projects
   - Analysis
3. Observe loading states

**Expected Result:**
- Loading indicators display during data fetch
- Smooth transition to loaded state
- No jarring content shifts

**Status:** [ ] PASS [ ] FAIL

---

#### Test 8.3: Error Handling
**Objective:** Verify error messages are user-friendly

**Steps:**
1. Login as Agent
2. Simulate network error (disconnect internet)
3. Try to load Dashboard

**Expected Result:**
- Friendly error message displayed
- Option to retry
- No technical error details exposed

**Status:** [ ] PASS [ ] FAIL

---

#### Test 8.4: Empty States
**Objective:** Verify empty state messages are helpful

**Steps:**
1. Login as new Agent with no data
2. Navigate to each page

**Expected Result:**
- Dashboard: Shows 0 for all metrics
- Projects: "No projects yet" message
- Analysis: "No analysis records yet" message

**Status:** [ ] PASS [ ] FAIL

---

### 9. Browser Console Tests

#### Test 9.1: No Console Errors
**Objective:** Verify no JavaScript errors

**Steps:**
1. Login as Agent
2. Open DevTools Console
3. Navigate through all pages

**Expected Result:**
- No red errors in console
- No 404 errors for missing assets
- No unhandled promise rejections

**Status:** [ ] PASS [ ] FAIL

---

#### Test 9.2: No TypeScript Errors
**Objective:** Verify type safety

**Steps:**
1. Open project in IDE
2. Check TypeScript compiler output

**Expected Result:**
- No TypeScript compilation errors
- All types correctly defined
- No `any` types used incorrectly

**Status:** [ ] PASS [ ] FAIL

---

## Test Results Summary

### Total Tests: 30
- **Passed:** ___ / 30
- **Failed:** ___ / 30
- **Blocked:** ___ / 30

### Critical Issues Found:
(List any critical issues discovered during testing)

1. 
2. 
3. 

### Minor Issues Found:
(List any minor issues discovered during testing)

1. 
2. 
3. 

### Recommendations:
(List any recommendations for improvement)

1. 
2. 
3. 

---

## Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Signature:** ___________________

**Reviewed By:** ___________________
**Date:** ___________________
**Signature:** ___________________

---

## Notes

- All tests should be executed in a test/staging environment first
- Use different agent users to verify data isolation
- Test both empty state and populated data scenarios
- Verify both frontend behavior and backend API responses
- Document any deviations from expected results

# Testing Strategy — AURA

> **Status**: `PROPOSED` — Testing strategy defined, to be executed during and after implementation.

---

## 1. Testing Philosophy

For a 36-hour hackathon, testing must be:

1. **Focused** — Test what matters for the demo, not exhaustive coverage
2. **Practical** — Manual testing is acceptable where automation is too costly
3. **Integration-first** — Verify that components work together, not just in isolation
4. **Demo-reliable** — The demo flow must work 3 times consecutively before judging

> Goal: **Verify important behavior and prevent regressions**, not maximize test coverage.

---

## 2. Testing Levels

### 2.1 Unit Tests

**Scope**: Individual functions, validation logic, utility helpers

**What to test**:
- Input validation functions
- Task state transition logic
- Risk classification logic (policy engine)
- Tool parameter validation
- Data formatting utilities

**Framework**: `PROPOSED` — Vitest (frontend), Jest or Vitest (backend)

**Priority**: P1 — Implement for critical business logic only

---

### 2.2 API Tests

**Scope**: Backend endpoint request/response validation

**What to test**:
- Every documented endpoint returns correct schema
- Authentication works (valid/invalid/missing token)
- Validation errors return proper error codes
- Task CRUD operations work correctly
- Approval flow works

**Method**: HTTP client tests (e.g., supertest) or manual via Thunder Client / Postman

**Priority**: P0 — Must verify before integration

---

### 2.3 Integration Tests

**Scope**: Component interactions across boundaries

**What to test**:
- Frontend can create a task and receive correct response
- Frontend can poll task status and render updates
- Backend correctly coordinates with AI layer
- AI layer produces valid plans from tool registry
- Tool execution returns results to backend
- Audit logs are created for every action

**Priority**: P0 — Must verify before demo

---

### 2.4 Agent Workflow Tests

**Scope**: End-to-end agent execution and LLM provider resilience

**What to test**:
- Agent generates valid plan from goal via unified LLM Provider Adapter
- LLM Provider Adapter normalizes requests across Groq and Gemini
- Provider failover: if primary (Groq) fails with 429/5xx, fallback (Gemini) executes seamlessly
- Mock LLM Provider can run full agent loop offline during unit testing
- Agent executes plan steps in order
- Agent handles tool success correctly
- Agent handles tool failure correctly
- Agent requests approval for high-risk actions
- Agent verifies outcomes
- Agent produces audit trail (including provider failover events)

**Method**: Unit tests with mock LLM provider; integration tests with Groq (primary) and Gemini (fallback)

**Priority**: P0

---

### 2.5 Security Tests

**Scope**: Security controls work as designed

**What to test**:
- Unauthenticated requests are rejected (401)
- Users cannot access other users' tasks (403)
- Invalid inputs are rejected (400)
- Tool registry prevents hallucinated tools
- Policy engine enforces risk levels
- No secrets in API responses
- No secrets in frontend code

**Priority**: P0

---

## 3. Critical Test Scenarios

### Normal Flow Tests

| # | Scenario | Expected Result | Priority |
|---|----------|----------------|----------|
| 1 | User submits a valid goal | Task created, status = QUEUED | P0 |
| 2 | Agent generates a plan | Task status = PLANNING → EXECUTING | P0 |
| 3 | Agent executes all steps successfully | Status = COMPLETED with result | P0 |
| 4 | Agent completes verification | Verification evidence in result | P0 |
| 5 | Audit trail shows all actions | All entries present chronologically | P0 |

### Error Flow Tests

| # | Scenario | Expected Result | Priority |
|---|----------|----------------|----------|
| 6 | Tool execution fails | Step marked FAILED, agent replans or fails gracefully | P0 |
| 7 | Tool is unavailable (timeout) | Step marked FAILED with timeout error | P0 |
| 8 | Tool returns unexpected data | Agent logs anomaly, attempts adaptation | P1 |
| 9 | LLM produces malformed plan | Plan validation rejects, retry or fail | P0 |
| 10 | LLM produces hallucinated tool | Validation rejects (tool not in registry) | P0 |
| 10a | Primary AI provider (Groq) rate limit / error | LLM Adapter seamlessly fails over to Gemini; audit log records failover | P0 |
| 10b | Both AI providers fail | Task transitions to FAILED with structured error code; audit log records details | P0 |

### Permission Flow Tests

| # | Scenario | Expected Result | Priority |
|---|----------|----------------|----------|
| 11 | Low-risk action | Executes automatically | P0 |
| 12 | High-risk action | Pauses, requests user approval | P0 |
| 13 | User approves | Execution continues | P0 |
| 14 | User rejects | Step cancelled, task continues or fails | P0 |
| 15 | Disallowed action | Rejected immediately, not executed | P0 |

### Security Tests

| # | Scenario | Expected Result | Priority |
|---|----------|----------------|----------|
| 16 | No auth token | 401 returned | P0 |
| 17 | Access another user's task | 404 returned (not 403, to avoid information leak) | P0 |
| 18 | Prompt injection in goal | Agent processes safely, no arbitrary code execution | P1 |
| 19 | Tool injection (fake tool in goal) | Only registered tools execute | P0 |

### Edge Cases

| # | Scenario | Expected Result | Priority |
|---|----------|----------------|----------|
| 20 | Empty goal submitted | 400 validation error | P0 |
| 21 | Very long goal (>1000 chars) | 400 validation error | P1 |
| 22 | User cancels running task | Status = CANCELLED | P1 |
| 23 | Partial success (some steps pass, some fail) | Status = PARTIALLY_COMPLETED | P1 |
| 24 | Duplicate task submission | Both tasks created (no dedup for MVP) | P2 |
| 25 | Verification fails | Task marked appropriately, not "COMPLETED" | P0 |

---

## 4. Test Matrix

| Component | Unit | API | Integration | E2E Manual | Security |
|-----------|------|-----|-------------|-----------|----------|
| **Frontend: Goal Input** | — | — | ✓ | ✓ | — |
| **Frontend: Task Display** | — | — | ✓ | ✓ | — |
| **Frontend: Approval UI** | — | — | ✓ | ✓ | — |
| **Frontend: Audit Log** | — | — | ✓ | ✓ | — |
| **Backend: Auth** | — | ✓ | ✓ | ✓ | ✓ |
| **Backend: Task CRUD** | — | ✓ | ✓ | — | ✓ |
| **Backend: Validation** | ✓ | ✓ | — | — | ✓ |
| **Backend: Policy Engine** | ✓ | — | ✓ | — | ✓ |
| **AI: LLM Adapter & Failover** | ✓ | — | ✓ | ✓ | ✓ |
| **AI: Plan Generation** | ✓ | — | ✓ | ✓ | — |
| **AI: Tool Execution** | — | — | ✓ | ✓ | ✓ |
| **AI: Error Handling** | ✓ | — | ✓ | ✓ | — |
| **AI: Verification** | ✓ | — | ✓ | ✓ | — |
| **Database: Queries** | — | — | ✓ | — | ✓ |
| **Full Pipeline** | — | — | — | ✓ | — |

---

## 5. AI Evaluation

### Plan Quality

| Check | Method |
|-------|--------|
| Plan contains only registered tools | Automated validation |
| Plan parameters match tool schemas | Automated validation |
| Plan steps are logically ordered | Manual review during testing |
| Plan is not unnecessarily complex | Manual review |

### Guardrail Evaluation

| Check | Method |
|-------|--------|
| Tool allowlist enforced | Attempt unregistered tool → expect rejection |
| Risk classification accurate | Review risk assignments for known tools |
| Approval gates trigger correctly | Submit high-risk goals → expect approval request |
| Output validation catches malformed responses | Send malformed LLM output → expect rejection |

---

## 6. Demo Smoke Test Checklist

Run this checklist **3 times** before the demo:

- [ ] Application loads at production URL
- [ ] Login works (if auth is in MVP)
- [ ] Goal submission creates a task
- [ ] Plan is displayed within 10 seconds
- [ ] Steps execute with visible progress
- [ ] At least one real external API call succeeds
- [ ] Approval request appears for high-risk action
- [ ] Approval/rejection works
- [ ] Task completes with verification
- [ ] Audit trail is visible and complete
- [ ] Error recovery works (disconnect tool or use failing input)
- [ ] UI is responsive and professional-looking
- [ ] No console errors in browser
- [ ] No 500 errors from backend

---

## 7. Definition of Done

### Frontend

- [ ] Component renders correctly
- [ ] All task states display properly
- [ ] Loading, error, empty states work
- [ ] API integration works with real backend
- [ ] Responsive on desktop (primary), tablet (secondary)
- [ ] No console errors

### Backend

- [ ] Endpoint returns documented response schema
- [ ] Input validation works
- [ ] Authentication/authorization enforced
- [ ] Database operations work
- [ ] Error responses match documented format
- [ ] Audit log entries created

### AI Layer

- [ ] LLM Provider Adapter functions with primary provider (Groq)
- [ ] Fallback provider (Gemini) activates seamlessly upon primary failure/rate limit
- [ ] Provider selection (`AI_PROVIDER`) toggles cleanly via environment variables
- [ ] Plan generation produces valid structured output
- [ ] Tool execution works with real APIs
- [ ] Policy engine correctly classifies risk
- [ ] Error handling prevents crashes
- [ ] Verification produces evidence
- [ ] Hallucinated tools are rejected

### Integration

- [ ] Frontend correctly consumes backend API
- [ ] Backend correctly coordinates with AI layer
- [ ] Database state reflects actual task state
- [ ] Audit trail is complete and accurate
- [ ] End-to-end flow works without manual intervention

### Deployment

- [ ] Production build succeeds
- [ ] Deployed URL is accessible
- [ ] Environment variables configured
- [ ] Health check passes
- [ ] Demo smoke test passes 3 times

---

## 8. MVP Acceptance Criteria

The MVP is accepted when ALL of these conditions are met:

1. ✅ A user can submit a natural-language goal
2. ✅ The agent generates and displays an execution plan
3. ✅ The agent executes at least 2 real tool calls (external APIs)
4. ✅ The user sees step-by-step execution progress
5. ✅ High-risk actions trigger an approval request
6. ✅ The agent verifies outcomes before reporting completion
7. ✅ A complete audit trail is viewable
8. ✅ Error handling works for tool failure
9. ✅ The application is deployed and accessible
10. ✅ The demo flow works reliably 3 consecutive times

---

## 9. Mock / Stub Strategy

### Frontend Development (before backend is ready)

Manoj can develop the frontend using mock data:

```javascript
// services/mockApi.js
export const mockTasks = [
  {
    taskId: "mock-001",
    goal: "Check weather in Chennai and summarize",
    status: "EXECUTING",
    createdAt: "2026-09-12T10:00:00Z",
    plan: {
      steps: [
        { stepIndex: 0, description: "Fetch weather", tool: "weather_api", status: "COMPLETED", riskLevel: "LOW" },
        { stepIndex: 1, description: "Generate summary", tool: "llm_summarize", status: "EXECUTING", riskLevel: "LOW" }
      ]
    },
    currentStepIndex: 1
  }
];
```

**Switch mechanism**: Use an environment variable `VITE_USE_MOCKS=true` to toggle between mock and real API.

### AI Development (before real tools are connected)

Bala can develop the agent using fake tool adapters:

```javascript
// tools/fakeWeatherTool.js
export async function fakeWeatherTool(params) {
  return {
    success: true,
    data: { temperature: 32, condition: "Sunny", city: params.city }
  };
}
```

**Switch mechanism**: Tool registry can load real or fake implementations based on environment.

### Backend Development (before AI layer is ready)

Abishek can develop the backend with a stub orchestrator:

```javascript
// services/stubOrchestrator.js
export async function executeTask(task) {
  // Simulate plan + execution with delays
  return {
    status: "COMPLETED",
    steps: [{ tool: "stub", result: { message: "Stub result" } }]
  };
}
```

---

## 10. Testing Ownership

| Area | Owner | Support |
|------|-------|---------|
| Frontend tests | Manoj | Elango |
| Backend API tests | Abishek | Elango |
| AI/Agent tests | Bala | Elango |
| Integration tests | Elango | Kamal |
| Security tests | Elango | Abishek |
| Demo smoke tests | Kamal + Elango | All |
# Project Overview — AURA

> **Status**: ACTIVE — Problem statement received, architecture phase in progress.

---

## Documentation Navigation — Start Here

Each team member should read documents in this order:

| Member | Role | Reading Order |
|--------|------|---------------|
| **Kamal** | Architecture / Coordination / Integration | 01 → 02 → 10 → 11 → 03 → 08 |
| **Manoj** | Frontend + UI/UX | 01 → 04 → 03 → 11 → 06 |
| **Abishek** | Backend | 01 → 02 → 03 → 05 → 08 → 11 |
| **Bala Subramanian V** | AI + Backend Support | 01 → 02 → 03 → 08 → 11 → 06 |
| **Elango** | Testing / Deployment / Integration Support | 01 → 02 → 03 → 06 → 07 → 08 → 11 |

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | AURA |
| **Hackathon** | VIT HackBattle 2026 |
| **Duration** | 36 hours |
| **Track** | AI & Automation |
| **Primary Subtrack** | Agentic Workflows |
| **Team Size** | 5 members |
| **Status** | `DECIDED` |

---

## 2. One-Line Pitch

> AURA is a bounded autonomous AI agent that can plan, execute multi-step tasks using real tools, and verify outcomes — while keeping humans informed and in control.

**Status**: `PROPOSED` — Subject to refinement after use-case finalization.

---

## 3. Official Problem Statement

### Challenge Quote

> "The great tragedy of artificial intelligence is that we taught rocks to think, and now we exclusively use them to write mediocre apologies to our clients."

### Challenge Directive

> "Rescue AI from the chat window. Give it hands, memory, and a sense of boundaries so it can actually interact with the real world without needing constant adult supervision."

### Official Subtrack Directions

1. **Agentic Workflows** (PRIMARY): Build AI that can plan, trigger external APIs, and execute multi-step tasks autonomously.
2. **Self-Learning & Adaptation**: Build models that continuously learn as data changes.
3. **Guardrails & Trust**: Create filters, evaluation harnesses, or honeypots that keep model outputs safe, accurate, and aligned.

**Status**: `REQUIRED` — Directly from hackathon problem statement.

---

## 4. Problem Analysis

### Why Current AI Interfaces Are Insufficient

| Limitation | Description |
|-----------|-------------|
| **Chat-only** | AI is trapped in a text-in/text-out loop with no ability to act |
| **No planning** | Users must decompose tasks themselves and prompt step by step |
| **No tool use** | AI cannot interact with external services, APIs, or systems |
| **No memory** | Each conversation is stateless; context is lost |
| **No verification** | AI claims success without evidence |
| **No boundaries** | No permission system; AI either does everything or nothing |
| **No observability** | Users cannot see what AI is doing or why |
| **No failure recovery** | When something goes wrong, the user must restart from scratch |

### What the PS Actually Asks For

The problem statement explicitly calls for:
1. **"Hands"** → Tool execution capability (API calls, external actions)
2. **"Memory"** → Persistent context across tasks
3. **"Sense of boundaries"** → Permission system, guardrails, risk awareness
4. **"Without constant adult supervision"** → Autonomous execution within safe limits

**Status**: `CONFIRMED` — Direct interpretation of official PS.

---

## 5. Target Users

| User Type | Description | Status |
|-----------|-------------|--------|
| Knowledge workers | Professionals who need multi-step task automation | `PROPOSED` |
| Developers | Engineers who want AI to execute workflows against APIs | `PROPOSED` |
| Operations teams | People managing repetitive multi-tool processes | `PROPOSED` |

> **Note**: The exact target persona depends on the demonstration use-case. See Section 14 for candidate workflows.

---

## 6. Product Vision

AURA transforms AI from a passive text generator into an active, goal-oriented agent that can:
- Understand a high-level goal
- Decompose it into actionable steps
- Execute steps using real tools
- Observe outcomes
- Adapt when things go wrong
- Request human approval for risky actions
- Verify results before claiming success
- Remember relevant context for future tasks

---

## 7. AURA Definition

**AURA** = **A**utonomous **U**nified **R**easoning **A**gent

AURA is an **agentic system**, not a chatbot.

### Chatbot vs. Agentic System

| Aspect | Chatbot | AURA (Agentic System) |
|--------|---------|----------------------|
| Input | Prompt | Goal |
| Processing | Generate text | Plan → Act → Observe → Verify |
| Output | Text response | Verified task completion |
| State | Stateless | Persistent task + memory state |
| Tools | None | Registered tool registry |
| Failures | User retries | Agent adapts/replans |
| Permissions | None | Risk-based approval system |
| Verification | None | Outcome verification before reporting |
| Transparency | Black box | Observable step-by-step execution |

**Status**: `DECIDED` — Core product identity.

---

## 8. Core Value Proposition

> AURA demonstrates that AI can move beyond conversation into **autonomous, bounded, observable action** — planning tasks, using tools, handling failures, and proving results.

---

## 9. Core Capabilities

### MUST HAVE (P0 — MVP)

| # | Capability | Description | Status |
|---|-----------|-------------|--------|
| 1 | Goal intake | User submits a high-level goal in natural language | `DECIDED` |
| 2 | Task planning | Agent decomposes goal into executable steps | `DECIDED` |
| 3 | Tool execution | Agent executes steps via registered tools (API calls) | `DECIDED` |
| 4 | Observable state | User sees real-time task status, current step, plan | `DECIDED` |
| 5 | Permission system | Risk-based approval before dangerous actions | `DECIDED` |
| 6 | Verification | Agent checks outcomes before claiming success | `DECIDED` |
| 7 | Error handling | Agent handles tool failures gracefully | `DECIDED` |
| 8 | Audit trail | Every action logged with timestamps and results | `DECIDED` |

### SHOULD HAVE (P1)

| # | Capability | Description | Status |
|---|-----------|-------------|--------|
| 9 | Task memory | Relevant context persists across tasks | `PROPOSED` |
| 10 | Replanning | Agent adapts plan when a step fails or conditions change | `PROPOSED` |
| 11 | Multi-step visualization | UI shows plan → progress → results visually | `PROPOSED` |
| 12 | Task history | User can review past tasks and their outcomes | `PROPOSED` |

### COULD HAVE (P2)

| # | Capability | Description | Status |
|---|-----------|-------------|--------|
| 13 | User preferences memory | Agent remembers user-specific preferences | `PROPOSED` |
| 14 | Parallel step execution | Execute independent steps concurrently | `PROPOSED` |
| 15 | Guardrail analytics | Dashboard showing blocked/approved actions | `PROPOSED` |

### WON'T HAVE (Out of Scope)

| # | Feature | Reason |
|---|---------|--------|
| 1 | Continuous model retraining | Not feasible in 36h; would be dishonest to claim |
| 2 | True online learning | Requires infrastructure beyond hackathon scope |
| 3 | Multi-user collaboration | Adds complexity without strengthening core demo |
| 4 | Custom model fine-tuning | Time and compute constraints |
| 5 | Voice/multimodal input | Adds UI complexity without agentic value |
| 6 | Mobile-native app | Web is sufficient for demo |

---

## 10. Agent Characteristics

AURA must exhibit these properties:

1. **Goal-oriented**: Receives goals, not just prompts
2. **Planning**: Creates explicit plans before acting
3. **Tool-based**: Acts through registered, permission-checked tools
4. **Observable**: Every step visible to the user
5. **Bounded**: Operates within defined permissions
6. **Approval-aware**: Requests human approval for risky actions
7. **Failure-resilient**: Handles errors, replans when necessary
8. **Verification-first**: Checks outcomes before claiming success
9. **Auditable**: Full action log with timestamps
10. **Memory-capable**: Retains relevant context (P1)

---

## 11. Example User Journey

```
1. User opens AURA dashboard
2. User types: "Check if my GitHub repo has any open issues 
   labeled 'bug' and create a summary report"
3. AURA acknowledges the goal
4. AURA creates a plan:
   Step 1: Authenticate with GitHub API
   Step 2: Fetch open issues with label 'bug'
   Step 3: Extract and summarize issue details
   Step 4: Generate formatted report
   Step 5: Present report to user
5. AURA shows plan to user with risk assessment
6. Step 1 requires API token → user approves
7. AURA executes steps sequentially
8. User sees real-time progress for each step
9. If Step 2 returns unexpected data → AURA adapts
10. AURA verifies the report was generated correctly
11. AURA presents result with evidence
12. Task logged in audit trail
```

> **Note**: This is an ILLUSTRATIVE example. The actual demo workflow is defined in Section 14.

---

## 12. Agent Execution Lifecycle

```
USER GOAL
    ↓
UNDERSTAND (parse intent, extract parameters)
    ↓
PLAN (decompose into steps, select tools)
    ↓
CHECK POLICY / PERMISSIONS (risk classification)
    ↓
SELECT TOOLS (from registered tool registry)
    ↓
EXECUTE (call tools via backend)
    ↓
OBSERVE (validate tool response)
    ↓
UPDATE TASK STATE / MEMORY
    ↓
ADAPT IF NECESSARY (replan on failure)
    ↓
VERIFY (confirm outcome against goal)
    ↓
REPORT RESULT (with evidence)
```

**Status**: `DECIDED` — Core agent architecture.

---

## 13. Key Concepts

### Memory

| Aspect | Definition | Status |
|--------|-----------|--------|
| **What** | Task execution context: tool results, user preferences, past task outcomes | `PROPOSED` |
| **Why** | Enables adaptation and avoids redundant work | `PROPOSED` |
| **Duration** | Task memory: lifetime of task. Long-term: persisted in DB | `PROPOSED` |
| **Access** | Scoped to the user who created it | `PROPOSED` |
| **Deletion** | User can clear memory | `PROPOSED` |
| **Influence** | Agent uses memory in planning; stale memory must not override fresh data | `PROPOSED` |

### Adaptation

AURA adapts within a task by replanning when:
- A tool returns an error
- A tool returns unexpected data
- The environment has changed since planning
- A permission is denied

AURA does NOT claim to implement continuous model retraining or online learning.

**Status**: `DECIDED` — Adaptation is within-task replanning, not model learning.

### Guardrails

Guardrails are **architectural enforcement**, not just prompt instructions:
- Tool allowlist (only registered tools can execute)
- Parameter validation (tool inputs validated before execution)
- Risk classification (LOW / MEDIUM / HIGH / DISALLOWED)
- Execution limits (max steps, timeouts)
- Output validation (tool results checked)
- Audit logging (every action recorded)

**Status**: `DECIDED` — Guardrails must be enforced by application logic.

### Human Approval

| Risk Level | Behavior |
|-----------|----------|
| LOW | Execute automatically |
| MEDIUM | Execute with enhanced logging |
| HIGH | Pause and request explicit user approval |
| DISALLOWED | Reject; do not execute |

**Status**: `DECIDED`

### Verification

AURA distinguishes:

| State | Meaning |
|-------|---------|
| ACTION_REQUESTED | Agent wants to perform an action |
| ACTION_ATTEMPTED | Tool call was made |
| ACTION_SUCCEEDED | Tool returned a success response |
| ACTION_VERIFIED | Outcome confirmed against expected result |

AURA must not claim "Task completed" without verification evidence.

**Status**: `DECIDED`

### Failure Handling

| Scenario | Response |
|----------|----------|
| Tool fails | Log error, attempt retry or replan |
| Tool unavailable | Mark step as blocked, replan if possible |
| Tool returns unexpected data | Log, attempt to adapt |
| Plan becomes invalid | Replan from current state |
| Permission denied | Halt step, notify user |
| User rejects approval | Cancel step, log reason |
| Partial success | Report completed/failed steps separately |
| Timeout | Halt execution, report status |
| Model produces invalid action | Reject via validation, log |
| Verification fails | Report failure honestly |

**Status**: `DECIDED`

---

## 14. Candidate Demonstration Use Cases

> **IMPORTANT**: The exact demo workflow is `TBD`. The team must select one based on feasibility.

### Candidate A: Multi-API Task Automation

**Description**: User asks AURA to perform a workflow across multiple APIs (e.g., fetch data from one API, process it, post results to another).

| Criterion | Score |
|-----------|-------|
| PS alignment | ★★★★★ |
| Agentic depth | ★★★★★ |
| API availability (free) | ★★★★☆ |
| Implementation complexity | ★★★☆☆ |
| Demo impact | ★★★★★ |
| Memory usefulness | ★★★☆☆ |
| Guardrail demonstration | ★★★★☆ |
| 36h feasibility | ★★★★☆ |

**Example APIs**: OpenWeatherMap, GitHub API, JSONPlaceholder, NewsAPI, REST Countries

**Status**: `RECOMMENDED`

### Candidate B: DevOps Workflow Agent

**Description**: User asks AURA to check repository status, run health checks, and generate a status report.

| Criterion | Score |
|-----------|-------|
| PS alignment | ★★★★★ |
| Agentic depth | ★★★★★ |
| API availability | ★★★★☆ |
| Implementation complexity | ★★★★☆ |
| Demo impact | ★★★★☆ |
| Memory usefulness | ★★★★☆ |
| Guardrail demonstration | ★★★★★ |
| 36h feasibility | ★★★☆☆ |

**Status**: `ALTERNATIVE`

### Candidate C: Research & Summarization Agent

**Description**: User asks AURA to research a topic across multiple sources, synthesize findings, and produce a report.

| Criterion | Score |
|-----------|-------|
| PS alignment | ★★★★☆ |
| Agentic depth | ★★★★☆ |
| API availability | ★★★★★ |
| Implementation complexity | ★★★☆☆ |
| Demo impact | ★★★★☆ |
| Memory usefulness | ★★★★★ |
| Guardrail demonstration | ★★★☆☆ |
| 36h feasibility | ★★★★★ |

**Status**: `ALTERNATIVE`

> **DECISION REQUIRED**: Team must finalize the demonstration use case before implementation begins. The recommendation is **Candidate A** because it best demonstrates tool execution, multi-step planning, and real API interaction — which directly addresses the PS.

---

## 15. Success Criteria

### MVP Success (36-Hour Target)

- [ ] User can submit a natural-language goal
- [ ] Agent creates a visible plan
- [ ] Agent executes steps using at least 2 real external tools
- [ ] User sees real-time step-by-step progress
- [ ] Permission system blocks or requests approval for risky actions
- [ ] Agent verifies outcomes before claiming success
- [ ] Full audit trail is visible
- [ ] Error handling works for at least: tool failure, timeout, invalid response
- [ ] Application is deployed and accessible via URL
- [ ] Demo flow works reliably 3 times consecutively

### Stretch Success

- [ ] Memory persists across tasks
- [ ] Agent replans when a step fails
- [ ] Task history is browsable
- [ ] Multiple tool types are demonstrated

---

## 16. Demo Strategy

### Demo Script (Target: 5 minutes)

1. **Introduction** (30s): Explain what AURA is and how it differs from a chatbot
2. **Goal Submission** (30s): Submit a real multi-step goal
3. **Plan Display** (30s): Show the agent's generated plan
4. **Execution** (90s): Watch real-time step execution with tool calls
5. **Permission Gate** (30s): Trigger a high-risk action requiring approval
6. **Failure & Recovery** (30s): Show graceful error handling
7. **Verification** (30s): Show verification step and evidence
8. **Audit Trail** (30s): Show the complete action log

### Judge-Facing Differentiation

| What Judges See | Why It Matters |
|----------------|----------------|
| Real API calls, not simulated | Proves the agent has "hands" |
| Visible planning | Shows reasoning, not just generation |
| Permission gates | Shows "sense of boundaries" |
| Step-by-step progress | Shows observability and transparency |
| Failure recovery | Shows robustness |
| Verification evidence | Shows the agent doesn't blindly claim success |
| Audit trail | Shows accountability |

---

## 17. Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React (Vite) | `PROPOSED` |
| Backend | Node.js + Express | `PROPOSED` |
| Database | Supabase (PostgreSQL) | `PROPOSED` |
| AI/LLM | Groq API (Primary) / Google Gemini API (Secondary/Fallback) via Provider Adapter | `PROPOSED` |
| Authentication | Supabase Auth | `PROPOSED` |
| Deployment (Frontend) | Vercel | `PROPOSED` |
| Deployment (Backend) | Render | `PROPOSED` |

> See `docs/10-DECISIONS.md` for full justification.

---

## 18. Hackathon Feasibility Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM API rate limits / downtime | Medium | High | Multi-provider architecture (Groq primary, Gemini fallback), caching, structured error recovery |
| LLM produces invalid tool calls | High | Medium | Strict schema validation on all LLM output |
| External API downtime during demo | Low | Critical | Pre-cache demo data as fallback |
| Team coordination failures | Medium | High | Clear contracts, async communication |
| Scope creep | High | High | Strict MVP enforcement |
| Database cold start | Low | Medium | Keep DB connections warm before demo |
| 36h exhaustion | Certain | Medium | Phase planning with clear milestones |

---

## 19. Assumptions

> These are assumptions currently treated as working decisions. They must be validated.

1. Groq API (Primary) and Google Gemini API (Secondary/Fallback) developer tiers provide sufficient rate limits and low latency for development and demo
2. At least 2-3 free external APIs are available and reliable for tool demonstration
3. Supabase free tier is sufficient for database and auth needs
4. All team members have Node.js and npm installed locally
5. All team members have Git configured and can push to the repository
6. The hackathon allows use of AI APIs (Groq, Gemini, etc.)
7. Internet connectivity is available during the demo

---

## 20. TBD Decisions

| Decision | Owner | Deadline |
|----------|-------|----------|
| Final demonstration use case | Team | Before Phase D (implementation) |
| Specific external APIs to integrate as tools | Bala + Abishek | Before Phase D |
| Authentication requirement (required or optional for MVP) | Team | Before Phase D |
| Exact LLM model versions for Groq and Gemini (latency vs quality evaluation) | Bala | Before Phase D |
| WebSocket vs polling for real-time updates | Abishek + Manoj | Before Phase D |

---

## 21. Future Roadmap (Post-Hackathon, Informational Only)

These features are explicitly OUT OF SCOPE for the hackathon but represent the product direction:

- Multi-agent collaboration
- Custom tool creation by users
- Scheduled/recurring tasks
- Team workspaces
- Advanced analytics dashboard
- Plugin marketplace
- Mobile application

**Status**: `OUT OF SCOPE` — Listed for completeness only. Do not implement.
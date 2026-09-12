# Design System — AURA

> **Status**: `PROPOSED` — UI/UX specification for frontend development. Manoj should use this as the design reference.

---

## 1. UX Principles

1. **Clarity over decoration** — Every UI element must serve a purpose
2. **Transparency** — User must always understand what the agent is doing
3. **Control** — User must be able to approve, reject, or cancel at any time
4. **Progressive disclosure** — Show summary first, details on demand
5. **Status-driven** — Visual state reflects actual system state
6. **Responsive** — Works on desktop (primary) and tablet

---

## 2. Visual Identity

AURA should look like a **professional AI operations platform**, not a chatbot.

| Aspect | Direction | Status |
|--------|-----------|--------|
| Aesthetic | Dark mode, minimal, technical | `PROPOSED` |
| Personality | Precise, intelligent, trustworthy | `PROPOSED` |
| Feel | Command center / operations dashboard | `PROPOSED` |
| NOT | Social media app, generic chatbot, colorful toy | `DECIDED` |

---

## 3. Design Tokens

### Color System

#### Base Palette (Dark Mode Primary)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#0A0E17` | Main background |
| `--color-bg-secondary` | `#111827` | Card/panel backgrounds |
| `--color-bg-tertiary` | `#1F2937` | Elevated surfaces |
| `--color-bg-hover` | `#374151` | Hover states |
| `--color-border` | `#1F2937` | Default borders |
| `--color-border-active` | `#3B82F6` | Active/focused borders |

#### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#F9FAFB` | Primary text |
| `--color-text-secondary` | `#9CA3AF` | Secondary/muted text |
| `--color-text-tertiary` | `#6B7280` | Placeholder, disabled |
| `--color-text-inverse` | `#111827` | Text on light backgrounds |

#### Accent / Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#3B82F6` | Primary actions, active states, links |
| `--color-accent-hover` | `#2563EB` | Primary action hover |
| `--color-success` | `#10B981` | Success states, completed |
| `--color-warning` | `#F59E0B` | Warning states, needs attention |
| `--color-error` | `#EF4444` | Error states, failed |
| `--color-info` | `#6366F1` | Informational, in-progress |
| `--color-neutral` | `#6B7280` | Queued, inactive |

### Typography

| Token | Value | Status |
|-------|-------|--------|
| `--font-family` | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` | `PROPOSED` |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | `PROPOSED` |
| `--font-size-xs` | `0.75rem` (12px) | `PROPOSED` |
| `--font-size-sm` | `0.875rem` (14px) | `PROPOSED` |
| `--font-size-base` | `1rem` (16px) | `PROPOSED` |
| `--font-size-lg` | `1.125rem` (18px) | `PROPOSED` |
| `--font-size-xl` | `1.25rem` (20px) | `PROPOSED` |
| `--font-size-2xl` | `1.5rem` (24px) | `PROPOSED` |
| `--font-size-3xl` | `1.875rem` (30px) | `PROPOSED` |
| `--font-weight-normal` | `400` | |
| `--font-weight-medium` | `500` | |
| `--font-weight-semibold` | `600` | |
| `--font-weight-bold` | `700` | |

### Spacing

| Token | Value |
|-------|-------|
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-5` | `1.25rem` (20px) |
| `--space-6` | `1.5rem` (24px) |
| `--space-8` | `2rem` (32px) |
| `--space-10` | `2.5rem` (40px) |
| `--space-12` | `3rem` (48px) |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-full` | `9999px` |

### Elevation / Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.3)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.3)` |

### Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease` | Hover, focus |
| `--transition-normal` | `250ms ease` | State changes |
| `--transition-slow` | `400ms ease` | Layout shifts |

---

## 4. Information Architecture

### Pages / Screens

| Screen | Purpose | Priority |
|--------|---------|----------|
| **Dashboard** | Overview: active tasks, recent tasks, quick goal input | P0 |
| **Task Detail** | Full task view: goal, plan, step execution, results | P0 |
| **Approval Modal** | Approve/reject a pending action | P0 |
| **Audit Log** | Detailed action log for a task | P0 |
| **Login** | Authentication (if in MVP scope) | TBD |
| **Task History** | Browse past tasks | P1 |
| **Tools View** | List available tools and their descriptions | P2 |

### Navigation

```
┌──────────────────────────────────────────────┐
│  AURA                          [User] [Logout]│
├──────────────────────────────────────────────┤
│ [Dashboard] [Tasks] [Audit]                   │
├──────────────────────────────────────────────┤
│                                               │
│  Main content area                            │
│                                               │
└──────────────────────────────────────────────┘
```

**Navigation type**: Top navigation bar (simple, flat).

---

## 5. Component Specifications

### 5.1 Goal Input

**Purpose**: Primary interaction point — user submits a goal.

```
┌─────────────────────────────────────────────────┐
│  💬 What would you like AURA to do?             │
│  ┌─────────────────────────────────────┐ [Send] │
│  │ Enter your goal...                  │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

- Text input with submit button
- Max 1000 characters
- Disabled while a task is actively executing (P1: allow concurrent tasks)
- Submit via Enter key or button click

### 5.2 Task Card (Dashboard)

**Purpose**: Summary card showing a task's current state.

```
┌─────────────────────────────────────────────────┐
│  ● EXECUTING                    2 min ago       │
│                                                  │
│  Check the weather in Chennai and create a       │
│  summary                                         │
│                                                  │
│  Step 2/3 ████████░░░░░                         │
│  Currently: Generating summary...                │
│                                                  │
│                              [View Details →]    │
└─────────────────────────────────────────────────┘
```

- Status badge (color-coded)
- Goal text (truncated if long)
- Progress indicator
- Current step description
- Click to navigate to Task Detail

### 5.3 Plan Viewer

**Purpose**: Display the agent's generated plan as a step list.

```
┌─────────────────────────────────────────────────┐
│  📋 Execution Plan                              │
│                                                  │
│  ✅ Step 1: Fetch weather data (LOW risk)       │
│     Tool: weather_api                            │
│     Result: Temperature: 32°C, Sunny             │
│                                                  │
│  ⏳ Step 2: Generate summary (LOW risk)          │
│     Tool: llm_summarize                          │
│     Running...                                   │
│                                                  │
│  ○ Step 3: Format report (LOW risk)              │
│     Tool: text_formatter                         │
│     Waiting                                      │
└─────────────────────────────────────────────────┘
```

Step status icons:
- `○` — Queued (not started)
- `⏳` — Executing
- `✅` — Completed
- `❌` — Failed
- `⚠️` — Needs approval
- `🔄` — Replanning

### 5.4 Approval Request

**Purpose**: Modal/banner when the agent needs user approval.

```
┌─────────────────────────────────────────────────┐
│  ⚠️ APPROVAL REQUIRED                           │
│                                                  │
│  AURA wants to execute a HIGH RISK action:       │
│                                                  │
│  Tool: github_create_issue                       │
│  Action: Create a new issue in repo "myproject"  │
│  Parameters:                                     │
│    title: "Bug: API timeout"                     │
│    body: "Detected during monitoring..."         │
│                                                  │
│  Risk Level: 🔴 HIGH                             │
│  Reason: Creates a permanent public resource     │
│                                                  │
│  [Reject]                          [Approve ✓]   │
└─────────────────────────────────────────────────┘
```

- Must clearly show what action will be taken
- Show tool name, parameters, risk level
- Approve and Reject buttons
- Optional reason field for rejection

### 5.5 Audit Log Viewer

**Purpose**: Chronological list of all actions for a task.

```
┌─────────────────────────────────────────────────┐
│  📜 Audit Trail                                  │
│                                                  │
│  10:00:00  TASK_CREATED                          │
│            Goal: "Check the weather..."           │
│                                                  │
│  10:00:02  PLAN_GENERATED                        │
│            3 steps planned                        │
│                                                  │
│  10:00:05  TOOL_EXECUTED                         │
│            weather_api → Success (1.2s)           │
│                                                  │
│  10:00:08  TOOL_EXECUTED                         │
│            llm_summarize → Success (2.1s)        │
│                                                  │
│  10:00:11  VERIFICATION_PASSED                   │
│            Outcome matches expected result        │
│                                                  │
│  10:00:12  TASK_COMPLETED                        │
│            Result delivered                       │
└─────────────────────────────────────────────────┘
```

### 5.6 Status Badge

Color-coded badge for task status:

| Status | Color | Background | Text Color |
|--------|-------|-----------|------------|
| `QUEUED` | Neutral | `--color-neutral` with 10% opacity | `--color-neutral` |
| `PLANNING` | Info | `--color-info` with 10% opacity | `--color-info` |
| `AWAITING_APPROVAL` | Warning | `--color-warning` with 10% opacity | `--color-warning` |
| `EXECUTING` | Accent | `--color-accent` with 10% opacity | `--color-accent` |
| `OBSERVING` | Info | `--color-info` with 10% opacity | `--color-info` |
| `REPLANNING` | Warning | `--color-warning` with 10% opacity | `--color-warning` |
| `VERIFYING` | Info | `--color-info` with 10% opacity | `--color-info` |
| `COMPLETED` | Success | `--color-success` with 10% opacity | `--color-success` |
| `PARTIALLY_COMPLETED` | Warning | `--color-warning` with 10% opacity | `--color-warning` |
| `FAILED` | Error | `--color-error` with 10% opacity | `--color-error` |
| `CANCELLED` | Neutral | `--color-neutral` with 10% opacity | `--color-neutral` |

### 5.7 Risk Level Indicator

| Risk | Color | Icon |
|------|-------|------|
| `LOW` | `--color-success` | 🟢 |
| `MEDIUM` | `--color-warning` | 🟡 |
| `HIGH` | `--color-error` | 🔴 |
| `DISALLOWED` | `--color-error` | ⛔ |

---

## 6. State Displays

### Loading State

```
┌─────────────────────────────────────────────────┐
│                                                  │
│          ◌ Loading...                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

Subtle spinner or pulsing animation. No full-page block unless necessary.

### Empty State

```
┌─────────────────────────────────────────────────┐
│                                                  │
│          🤖 No tasks yet                        │
│                                                  │
│     Submit a goal to get AURA started            │
│                                                  │
│         [Submit Your First Goal]                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────┐
│                                                  │
│    ❌ Something went wrong                       │
│                                                  │
│    Could not load tasks. Please try again.       │
│                                                  │
│              [Retry]                             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Success State (Task Completion)

```
┌─────────────────────────────────────────────────┐
│  ✅ TASK COMPLETED                               │
│                                                  │
│  Goal: Check the weather in Chennai              │
│                                                  │
│  Result:                                         │
│  Current weather in Chennai: 32°C, Sunny,        │
│  humidity 65%. Expected to remain clear           │
│  throughout the day.                             │
│                                                  │
│  Verification: ✅ Passed                         │
│  Steps completed: 3/3                            │
│  Duration: 12 seconds                            │
│                                                  │
│  [View Audit Trail]     [Start New Task]         │
└─────────────────────────────────────────────────┘
```

---

## 7. Responsive Design

| Breakpoint | Target | Layout |
|-----------|--------|--------|
| `≥ 1024px` | Desktop (PRIMARY) | Full layout with sidebar potential |
| `768px - 1023px` | Tablet | Stacked layout, reduced padding |
| `< 768px` | Mobile | Single column, simplified navigation |

**Priority**: Desktop-first for demo. Mobile responsiveness is P1.

---

## 8. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements focusable and operable via keyboard |
| Color contrast | WCAG AA minimum (4.5:1 for text) |
| Screen reader labels | ARIA labels on icons and status indicators |
| Focus indicators | Visible focus rings on interactive elements |
| Semantic HTML | Proper heading hierarchy, landmark regions |

**Status**: `PROPOSED` — Implement where practical within hackathon constraints.

---

## 9. Icons

Use a consistent icon set. Recommendation: **Lucide Icons** (free, lightweight, React-compatible).

| Concept | Icon | Context |
|---------|------|---------|
| Task/Goal | `Target` | Goal submission |
| Plan | `ListChecks` | Plan display |
| Execute | `Play` | Running state |
| Approve | `CheckCircle` | Approval button |
| Reject | `XCircle` | Rejection button |
| Warning | `AlertTriangle` | Risk/warning |
| Error | `XOctagon` | Error states |
| Success | `CheckCircle2` | Completion |
| Audit | `ScrollText` | Audit log |
| Tool | `Wrench` | Tool references |
| Memory | `Brain` | Memory/context |
| Settings | `Settings` | Configuration |

**Status**: `PROPOSED`

---

## 10. Component Hierarchy

```
App
├── NavBar
│   ├── Logo
│   ├── NavLinks
│   └── UserMenu
├── Dashboard (page)
│   ├── GoalInput
│   ├── ActiveTaskList
│   │   └── TaskCard (repeating)
│   └── RecentTaskList
│       └── TaskCard (repeating)
├── TaskDetail (page)
│   ├── TaskHeader (goal, status, timestamps)
│   ├── PlanViewer
│   │   └── StepItem (repeating)
│   ├── TaskResult
│   └── AuditLogViewer
│       └── AuditEntry (repeating)
├── ApprovalModal
├── ErrorBoundary
└── LoadingSpinner
```

---

## 11. UI Rules

1. Maintain visual consistency — use design tokens, not arbitrary values
2. Do not create duplicate components unnecessarily
3. Every interactive element must have hover and focus states
4. Every async operation must show a loading state
5. Every failure must show an actionable error message
6. Status indicators must match the canonical task states from the API contract
7. Never show raw JSON to the user (format data for readability)
8. Prioritize usability over decorative complexity
9. Test on Chrome and Firefox at minimum
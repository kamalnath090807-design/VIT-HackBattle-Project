# Architecture & Technology Decisions — AURA

> **Status**: Active — Decisions recorded as they are made.

---

## Decision Record Format

Each decision follows this structure:
- **ID**: Unique identifier
- **Date**: When the decision was made
- **Status**: `DECIDED` | `PROPOSED` | `TBD` | `SUPERSEDED`
- **Decision**: What was decided
- **Context**: Why this decision was needed
- **Options**: What alternatives were considered
- **Chosen**: Which option was selected
- **Reason**: Why this option was chosen
- **Consequences**: What this decision implies
- **Revisit Condition**: When this decision should be reconsidered

---

## ADR-001: Project Name

| Field | Value |
|-------|-------|
| **ID** | ADR-001 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | Project name is **AURA** (Autonomous Unified Reasoning Agent) |
| **Context** | Need a memorable, meaningful project name for hackathon |
| **Options** | AURA, AgentFlow, TaskPilot, AutoAgent |
| **Chosen** | AURA |
| **Reason** | Evocative, short, the acronym maps to the product concept |
| **Consequences** | All documentation, branding, and code uses "AURA" |
| **Revisit** | Not expected |

---

## ADR-002: Track Selection

| Field | Value |
|-------|-------|
| **ID** | ADR-002 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | Track: AI & Automation. Subtrack: Agentic Workflows |
| **Context** | Official hackathon track selection |
| **Options** | Agentic Workflows, Self-Learning & Adaptation, Guardrails & Trust |
| **Chosen** | Agentic Workflows (primary), with guardrail elements |
| **Reason** | Best matches the PS directive to "give AI hands, memory, and boundaries" |
| **Consequences** | Product must demonstrate planning, tool execution, and bounded autonomy |
| **Revisit** | Not applicable |

---

## ADR-003: Team Roles

| Field | Value |
|-------|-------|
| **ID** | ADR-003 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | Kamal=Architecture, Manoj=Frontend, Abishek=Backend, Bala=AI, Elango=Testing/Deployment |
| **Context** | 5-member team needs clear ownership for parallel development |
| **Options** | Various role permutations |
| **Chosen** | Current allocation based on member strengths |
| **Reason** | Allows maximum parallel work with minimum coordination overhead |
| **Consequences** | Each member has clear ownership and documentation to work from |
| **Revisit** | Only if a member's availability changes |

---

## ADR-004: Frontend Framework

| Field | Value |
|-------|-------|
| **ID** | ADR-004 |
| **Date** | 2026-09-12 |
| **Status** | `PROPOSED` |
| **Decision** | React with Vite |
| **Context** | Need a frontend framework for the dashboard UI |
| **Options** | React/Vite, Next.js, Vue/Vite, Vanilla HTML/JS |
| **Chosen** | React/Vite |
| **Reason** | Fast dev server, simple setup, team familiarity, no SSR needed |
| **Consequences** | Frontend code uses JSX, component-based architecture |
| **Revisit** | If team prefers a different framework |

---

## ADR-005: Backend Framework

| Field | Value |
|-------|-------|
| **ID** | ADR-005 |
| **Date** | 2026-09-12 |
| **Status** | `PROPOSED` |
| **Decision** | Node.js with Express |
| **Context** | Need a backend API server |
| **Options** | Express, Fastify, Hono, Python/Flask, Python/FastAPI |
| **Chosen** | Express |
| **Reason** | Minimal boilerplate, huge ecosystem, team familiarity, same language as frontend |
| **Consequences** | JavaScript across full stack, easy to share utility code |
| **Revisit** | If Python is strongly preferred for AI integration (both Groq and Gemini have JS/Node SDKs & REST APIs) |

---

## ADR-006: Database

| Field | Value |
|-------|-------|
| **ID** | ADR-006 |
| **Date** | 2026-09-12 |
| **Status** | `PROPOSED` |
| **Decision** | Supabase (PostgreSQL) |
| **Context** | Need persistent storage for tasks, audit logs, user data |
| **Options** | Supabase, Firebase, MongoDB Atlas, SQLite, PlanetScale |
| **Chosen** | Supabase |
| **Reason** | Free tier includes DB + Auth + Realtime. PostgreSQL gives proper relational modeling. RLS supports per-user isolation. |
| **Consequences** | Backend uses Supabase JS client, auth uses Supabase Auth |
| **Revisit** | If Supabase free tier proves insufficient or unreliable |

---

## ADR-007: Provider-Agnostic AI Architecture (Groq Primary, Gemini Fallback)

| Field | Value |
|-------|-------|
| **ID** | ADR-007 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | Provider-Agnostic LLM Adapter with Groq API as Primary and Google Gemini API as Secondary/Fallback |
| **Context** | Need an LLM reasoning engine for task planning, tool parameter generation, and verification. Relying on a single provider introduces single-point-of-failure risks (rate limits, latency, downtime) during a high-stakes 36h hackathon. |
| **Options** | Single provider (Gemini only), Single provider (Groq only), Direct vendor coupling, Provider-agnostic adapter layer supporting Groq (Primary) + Gemini (Fallback) |
| **Chosen** | Provider-agnostic adapter: Groq API (Primary) + Google Gemini API (Secondary/Fallback) |
| **Reason** | 1. **Groq Primary**: Ultra-low latency inference via LPU hardware guarantees fast plan generation and responsive multi-step execution; generous developer limits prevent demo blocking.<br/>2. **Gemini Fallback**: Large context window, multimodal capabilities, and proven stability provide a rock-solid failover if Groq encounters 429 rate limits or server anomalies.<br/>3. **Vendor Agnosticism**: Core Planner, Orchestrator, and Verifier interact only via normalized interfaces, completely decoupling agent business logic from vendor-specific payloads. |
| **Consequences** | 1. Implement adapter layer (`agent/src/providers/`) normalizing requests and responses.<br/>2. Configuration-driven selection via `AI_PROVIDER=groq|gemini` and automatic failover when `AI_ENABLE_FALLBACK=true`.<br/>3. Store both `GROQ_API_KEY` and `GEMINI_API_KEY` securely in backend environment.<br/>4. Production model IDs (`GROQ_MODEL`, `GEMINI_MODEL`) are configurable and TBD based on benchmark testing. |
| **Revisit** | If hackathon sponsor model requirements change or rate limits dictate dynamic load balancing. |

---

## ADR-008: Frontend Hosting

| Field | Value |
|-------|-------|
| **ID** | ADR-008 |
| **Date** | 2026-09-12 |
| **Status** | `PROPOSED` |
| **Decision** | Vercel |
| **Context** | Need free, fast static site hosting |
| **Options** | Vercel, Netlify, Cloudflare Pages, GitHub Pages |
| **Chosen** | Vercel |
| **Reason** | Zero-config Vite deployment, instant deploys, free SSL, GitHub integration |
| **Consequences** | Vite build output (`dist/`) deployed to Vercel CDN |
| **Revisit** | If Vercel free tier limits are hit |

---

## ADR-009: Backend Hosting

| Field | Value |
|-------|-------|
| **ID** | ADR-009 |
| **Date** | 2026-09-12 |
| **Status** | `PROPOSED` |
| **Decision** | Render |
| **Context** | Need free Node.js hosting with always-available HTTPS |
| **Options** | Render, Railway, Fly.io, Vercel Serverless Functions |
| **Chosen** | Render |
| **Reason** | Free tier (750 hrs/month), supports Node.js, auto-deploy from Git, free SSL |
| **Consequences** | Cold start after inactivity (~30-50s). Must warm before demo. |
| **Revisit** | If cold starts are unacceptable, consider Railway |

---

## ADR-010: Security Model

| Field | Value |
|-------|-------|
| **ID** | ADR-010 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | Deterministic policy engine for risk classification; LLM cannot bypass security |
| **Context** | AURA executes real actions — security must be architectural, not prompt-based |
| **Options** | LLM-only guardrails, deterministic policy engine, hybrid |
| **Chosen** | Deterministic policy engine (with LLM for plan generation only) |
| **Reason** | LLM can be manipulated via prompt injection; security decisions must be deterministic |
| **Consequences** | Policy engine is application code, not LLM-generated. Tool registry is static. |
| **Revisit** | Not expected — this is a core security principle |

---

## ADR-011: API Contract as Shared Contract

| Field | Value |
|-------|-------|
| **ID** | ADR-011 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | `docs/03-API-CONTRACT.md` is the single source of truth for all API interfaces |
| **Context** | 5 developers working in parallel need a shared agreement |
| **Options** | Informal coordination, API contract document, auto-generated from code |
| **Chosen** | Explicit API contract document |
| **Reason** | Allows frontend/backend/AI to develop independently against the same contract |
| **Consequences** | Any API change must update the document first. Both sides must conform. |
| **Revisit** | Not expected |

---

## ADR-012: Integration Contract

| Field | Value |
|-------|-------|
| **ID** | ADR-012 |
| **Date** | 2026-09-12 |
| **Status** | `DECIDED` |
| **Decision** | `docs/11-INTEGRATION-CONTRACT.md` defines all module boundaries and integration rules |
| **Context** | Independent development requires explicit boundary definitions |
| **Options** | Informal integration, formal integration contract |
| **Chosen** | Formal integration contract |
| **Reason** | Prevents integration failures during the critical last hours of the hackathon |
| **Consequences** | All team members must follow the documented boundaries |
| **Revisit** | Not expected |

---

## ADR-013: Agent Module Location

| Field | Value |
|-------|-------|
| **ID** | ADR-013 |
| **Date** | 2026-09-12 |
| **Status** | `PROPOSED` |
| **Decision** | Agent layer as separate `agent/` directory |
| **Context** | Need to decide whether AI code lives inside `backend/` or separately |
| **Options** | `agent/` (separate), `backend/src/agent/` (subdirectory) |
| **Chosen** | `agent/` (separate) |
| **Reason** | Clear ownership boundary (Bala vs. Abishek). Easier to develop independently. |
| **Consequences** | Backend imports agent module. May need shared config. |
| **Revisit** | If separate directory creates too much overhead, merge into backend |

---

## ADR-014: Real-Time Updates Mechanism

| Field | Value |
|-------|-------|
| **ID** | ADR-014 |
| **Date** | 2026-09-12 |
| **Status** | `TBD` |
| **Decision** | How frontend receives real-time task execution updates |
| **Context** | User needs to see step-by-step progress as the agent executes |
| **Options** | Polling (every 2-3s), Server-Sent Events (SSE), WebSocket |
| **Chosen** | TBD — Polling recommended for MVP simplicity |
| **Reason** | Polling is the simplest to implement and debug |
| **Consequences** | If polling: slight delay (2-3s) in updates. If SSE: more responsive but more complex. |
| **Revisit** | During Phase D if polling feels too sluggish |

---

## ADR-015: Authentication Scope for MVP

| Field | Value |
|-------|-------|
| **ID** | ADR-015 |
| **Date** | 2026-09-12 |
| **Status** | `TBD` |
| **Decision** | Whether full authentication is in MVP or simplified for demo |
| **Context** | Auth adds value but costs development time |
| **Options** | Full Supabase Auth, simplified single-user auth, no auth (MVP only) |
| **Chosen** | TBD |
| **Reason** | Full auth demonstrates security properly but may consume hours |
| **Consequences** | If full auth: better security demo. If simplified: faster implementation. |
| **Revisit** | Phase C based on time estimate |

---

## ADR-016: Demonstration Use Case

| Field | Value |
|-------|-------|
| **ID** | ADR-016 |
| **Date** | 2026-09-12 |
| **Status** | `TBD` |
| **Decision** | Specific use case and tools for the demo |
| **Context** | Need to select which APIs/tools to demonstrate |
| **Options** | Multi-API workflow, DevOps agent, Research agent |
| **Chosen** | TBD — Multi-API workflow recommended |
| **Reason** | Best demonstrates tool execution and multi-step planning |
| **Consequences** | Determines which tool implementations are needed |
| **Revisit** | Must be decided before Phase D (implementation) |
# AURA — Autonomous Unified Reasoning Agent

> **VIT HackBattle 2026** | Track: AI & Automation | Subtrack: Agentic Workflows

---

## What is AURA?

AURA is a bounded autonomous AI agent that can **plan, execute multi-step tasks using real tools, and verify outcomes** — while keeping humans informed and in control.

Unlike a chatbot that generates text, AURA:
- Receives a **goal** (not just a prompt)
- Creates an **execution plan**
- Uses **real tools** (external APIs)
- Shows **step-by-step progress**
- Requests **approval** for risky actions
- **Verifies** results before claiming success
- Logs a complete **audit trail**

---

## Project Status

**Architecture Phase** — Documentation and contracts defined. Implementation ready to begin.

---

## Team

| Member | Role |
|--------|------|
| Kamal | Architecture / Coordination / Integration |
| Manoj | Frontend + UI/UX |
| Abishek | Backend |
| Bala Subramanian V | AI + Backend Support |
| Elango | Testing / Deployment / Integration Support |

---

## Repository Structure

```
VIT-HackBattle-Project/
├── .agents/skills/          # Agent skills for each domain
├── docs/                    # Engineering documentation (source of truth)
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-API-CONTRACT.md
│   ├── 04-DESIGN-SYSTEM.md
│   ├── 05-DATABASE.md
│   ├── 06-TESTING.md
│   ├── 07-DEPLOYMENT.md
│   ├── 08-SECURITY.md
│   ├── 09-TEAM-WORKFLOW.md
│   ├── 10-DECISIONS.md
│   └── 11-INTEGRATION-CONTRACT.md
├── AGENTS.md                # Agent operating rules
├── README.md
└── .gitignore
```

## Documentation Entry Points

| Role | Start With |
|------|------------|
| **Everyone** | `docs/01-PROJECT-OVERVIEW.md` |
| **Architecture** | `docs/02-ARCHITECTURE.md` → `docs/10-DECISIONS.md` |
| **Frontend** | `docs/04-DESIGN-SYSTEM.md` → `docs/03-API-CONTRACT.md` |
| **Backend** | `docs/03-API-CONTRACT.md` → `docs/05-DATABASE.md` → `docs/08-SECURITY.md` |
| **AI/Agent** | `docs/02-ARCHITECTURE.md` → `docs/08-SECURITY.md` |
| **Testing** | `docs/06-TESTING.md` → `docs/07-DEPLOYMENT.md` |
| **Integration** | `docs/11-INTEGRATION-CONTRACT.md` |

---

## Technology Stack (Proposed)

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| AI/LLM | Groq API (Primary) / Google Gemini API (Fallback) via Provider Adapter |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
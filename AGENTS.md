# AURA — Agent Instructions

## 1. Project Context

**Project**: AURA (Autonomous Unified Reasoning Agent)
**Hackathon**: VIT HackBattle 2026 — 36-hour software development hackathon
**Track**: AI & Automation
**Primary Subtrack**: Agentic Workflows

This is a bounded autonomous AI agent that plans, executes multi-step tasks using real tools, and verifies outcomes — while keeping humans informed and in control.

---

## 2. Mandatory Rules

Before making significant changes:

1. Understand the current project structure.
2. Read the relevant documentation in `/docs`.
3. Read and follow the relevant skills in `/.agents/skills/`.
4. Do not invent requirements.
5. Do not introduce unnecessary technologies.
6. Prefer simple, reliable, hackathon-friendly solutions.
7. Preserve existing working functionality.
8. Do not overwrite another team member's work unnecessarily.
9. Do not commit secrets or credentials.
10. Test changes before considering them complete.

---

## 3. Source of Truth

When making project decisions, use this priority:

1. Official hackathon problem statement
2. Agreed project documentation in `/docs`
3. Project skills in `/.agents/skills/`
4. Existing working implementation
5. General engineering best practices

Before making architectural, API, database, UI, security, testing, AI, or deployment changes:

1. Read `AGENTS.md`.
2. Read the relevant project skill.
3. Read the relevant documentation.
4. Inspect the current implementation.
5. Check the API contract (`docs/03-API-CONTRACT.md`).
6. Check the integration contract (`docs/11-INTEGRATION-CONTRACT.md`).
7. Do not invent interfaces.
8. Do not silently contradict documentation.
9. If documentation and implementation conflict, identify the conflict.
10. Approved architectural changes must update the relevant documentation.

Do not override a project-specific decision merely because another approach is generally preferred.

---

## 4. Project Documentation

The `/docs` directory contains the project's source of truth.

| Document | Purpose |
|----------|---------|
| `docs/01-PROJECT-OVERVIEW.md` | Product specification, MVP, demo strategy |
| `docs/02-ARCHITECTURE.md` | System architecture, component design |
| `docs/03-API-CONTRACT.md` | API endpoints, schemas, error codes |
| `docs/04-DESIGN-SYSTEM.md` | UI/UX specification, design tokens |
| `docs/05-DATABASE.md` | Database schema, entities, access rules |
| `docs/06-TESTING.md` | Testing strategy, test cases, acceptance criteria |
| `docs/07-DEPLOYMENT.md` | Hosting, environment, deployment workflow |
| `docs/08-SECURITY.md` | Threat model, permissions, secrets |
| `docs/09-TEAM-WORKFLOW.md` | Team roles, schedule, git workflow |
| `docs/10-DECISIONS.md` | Architecture decision records |
| `docs/11-INTEGRATION-CONTRACT.md` | Module boundaries, shared contracts |

When these documents contain project-specific decisions, follow them.

If implementation conflicts with the documentation, do not silently change the architecture. Explain the conflict and propose the smallest safe change.

---

## 5. Project Skills

Project-specific skills are stored under `.agents/skills/`:

- `project-architecture` — Architecture work
- `project-api-contract` — API work
- `project-design-system` — UI/UX work
- `project-security` — Database/security-sensitive work
- `project-testing` — Testing/debugging
- `project-deployment` — Deployment

Do not ignore these skills when they are relevant.

---

## 6. Architecture Rules

Follow the architecture defined in `docs/02-ARCHITECTURE.md`.

- Keep components modular.
- Avoid unnecessary abstraction.
- Avoid unnecessary dependencies.
- Keep frontend and backend responsibilities clear.
- Keep business logic in the appropriate layer.
- Avoid duplicated logic.
- Keep external integrations isolated.
- Prefer maintainable code over clever code.
- **LLM must not control security-critical decisions** without deterministic enforcement.
- **All tool executions must go through the tool registry and policy engine**.
- **Every agent action must produce an audit log entry**.
- **AI provider access must be decoupled via the LLM provider adapter** (Groq primary, Gemini fallback) — never couple core reasoning directly to vendor SDKs.

Do not introduce a new framework or major dependency without a clear reason.

---

## 7. Frontend Rules

Follow `docs/04-DESIGN-SYSTEM.md`.

- Use reusable components.
- Follow the project's design system.
- Maintain responsive layouts.
- Include loading, error, empty, and success states.
- Maintain accessibility where practical.
- Avoid unnecessary visual complexity.
- Status indicators must match the canonical task states from the API contract.
- **Never invent backend API responses** — use documented contract or mocks.

---

## 8. Backend Rules

Follow `docs/02-ARCHITECTURE.md` and `docs/03-API-CONTRACT.md`.

- Validate inputs.
- Handle errors explicitly.
- Keep business logic organized.
- Follow the defined API contract.
- Avoid exposing secrets.
- Return predictable responses matching the documented schema.
- Avoid unnecessary endpoints.
- **Implement the exact documented API contract** — no ad-hoc endpoints.

Any API contract change must be reflected in `docs/03-API-CONTRACT.md`.

---

## 9. Database Rules

Follow `docs/05-DATABASE.md`.

- Use the database selected by the project (Supabase/PostgreSQL).
- Follow the documented schema.
- Validate data.
- Protect sensitive data.
- Avoid unnecessary tables/collections.
- Avoid exposing privileged credentials.
- Document important schema changes.
- Use parameterized queries — never concatenate user input.

Never place database credentials directly in source code.

---

## 10. Security Rules

Follow `docs/08-SECURITY.md`.

Never commit: API keys, passwords, access tokens, database credentials, private keys, service-account credentials, `.env` files containing real secrets.

Use environment variables or the appropriate secret-management mechanism.

The policy engine must be deterministic — the LLM must not be the sole authority on permission decisions.

---

## 11. Testing Rules

Follow `docs/06-TESTING.md`.

Every significant feature should be tested before integration.

At minimum:
1. Test the normal flow.
2. Test important invalid inputs.
3. Test failure conditions.
4. Test integration with dependent components.
5. Test the production build when appropriate.

Do not claim a feature is complete if it has not been tested.

---

## 12. Git Rules

Follow `docs/09-TEAM-WORKFLOW.md`.

- Pull the latest changes before beginning work.
- Work on the appropriate branch.
- Make focused commits.
- Use meaningful commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `style:`, `chore:`
- Do not commit generated junk.
- Do not commit secrets.
- Do not force-push shared branches unless explicitly coordinated.
- Do not overwrite another member's changes.
- Test before pushing.

---

## 13. Team

| Member | Role |
|--------|------|
| Kamal | Architecture / Coordination / Integration |
| Manoj | Frontend + UI/UX |
| Abishek | Backend |
| Bala Subramanian V | AI + Backend Support |
| Elango | Testing / Deployment / Integration Support |

Avoid unnecessary changes outside the assigned task.

If a change affects another member's component:
1. Inspect the dependency.
2. Inform/coordinate with the affected component.
3. Make the smallest required change.
4. Test integration.

---

## 14. Hackathon Priority

The primary objective is: **WORKING PRODUCT > EXCESSIVE FEATURES**

Prioritize:
1. Core problem solved
2. Reliable main user flow
3. Functional backend/database
4. Good UI/UX
5. AI/agent functionality
6. Testing
7. Deployment
8. Demo reliability
9. Optional features

Do not sacrifice a working core product for unnecessary features.

---

## 15. 36-Hour Constraint

Prefer: familiar technologies, free-tier services, managed services, simple architectures, fast deployment, minimal infrastructure, reliable libraries, small number of dependencies.

Avoid unnecessary: microservices, complex DevOps, custom infrastructure, premature optimization, over-engineering, large dependency chains.

---

## 16. Definition of Done

A feature is considered complete only when:

- [ ] Implementation is complete
- [ ] Existing functionality still works
- [ ] Relevant tests pass
- [ ] Error cases are handled
- [ ] UI is responsive if applicable
- [ ] API contract is respected if applicable
- [ ] Security requirements are respected
- [ ] Documentation is updated when necessary
- [ ] Changes are committed properly

---

## 17. Final Integration

Before the final hackathon submission:

1. Pull the latest repository state.
2. Integrate all completed features.
3. Resolve merge conflicts carefully.
4. Run the full test suite.
5. Build the production application.
6. Test the deployed application.
7. Verify environment variables.
8. Verify database connectivity.
9. Verify external APIs/AI services.
10. Verify the primary user flow.
11. Verify responsive UI.
12. Remove debugging code.
13. Remove unnecessary console logs.
14. Verify no secrets are committed.
15. Update README.
16. Verify the final deployment URL.
17. Perform a complete demo rehearsal.

---

## Current Project Status

**POST-PROBLEM-STATEMENT — Architecture Phase**

The official problem statement has been received and analyzed. Architecture and documentation are defined. Implementation is ready to begin after team approval.
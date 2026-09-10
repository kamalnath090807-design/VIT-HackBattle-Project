# VIT HackBattle Project — Agent Instructions

## 1. Project Context

This repository is for a 36-hour software development hackathon.

The problem statement, technology stack, and exact implementation requirements may change after the official problem statement is released.

The agent must NOT assume a specific problem, architecture, database, framework, or feature before the team defines it.

---

# 2. Mandatory Rules

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

# 3. Project Documentation

The `/docs` directory contains the project's source of truth.

Important documents:

- `docs/01-PROJECT-OVERVIEW.md`
- `docs/02-ARCHITECTURE.md`
- `docs/03-API-CONTRACT.md`
- `docs/04-DESIGN-SYSTEM.md`
- `docs/05-DATABASE.md`
- `docs/06-TESTING.md`
- `docs/07-DEPLOYMENT.md`
- `docs/08-SECURITY.md`
- `docs/09-TEAM-WORKFLOW.md`
- `docs/10-DECISIONS.md`

When these documents contain project-specific decisions, follow them.

If implementation conflicts with the documentation, do not silently change the architecture. Explain the conflict and propose the smallest safe change.

---

# 4. Project Skills

Project-specific skills are stored under:

`.agents/skills/`

Available skills:

- `project-architecture`
- `project-api-contract`
- `project-deployment`
- `project-design-system`
- `project-security`
- `project-testing`

Use the relevant skill when performing work in that domain.

Examples:

- Architecture work → `project-architecture`
- API work → `project-api-contract`
- UI/UX work → `project-design-system`
- Database/security-sensitive work → `project-security`
- Testing/debugging → `project-testing`
- Deployment → `project-deployment`

Do not ignore these skills when they are relevant.

---

# 5. Before Coding

Before implementing a feature:

1. Identify the requirement.
2. Check the relevant documentation.
3. Inspect the existing code.
4. Identify dependencies on other components.
5. Determine the smallest practical implementation.
6. Implement the feature.
7. Test it.
8. Update documentation if the implementation changes an agreed project decision.

Do not immediately start coding based only on a vague request.

---

# 6. Architecture Rules

Follow the architecture defined in:

`docs/02-ARCHITECTURE.md`

General principles:

- Keep components modular.
- Avoid unnecessary abstraction.
- Avoid unnecessary dependencies.
- Keep frontend and backend responsibilities clear.
- Keep business logic in the appropriate layer.
- Avoid duplicated logic.
- Keep external integrations isolated.
- Prefer maintainable code over clever code.

Do not introduce a new framework or major dependency without a clear reason.

---

# 7. Frontend Rules

Follow:

`docs/04-DESIGN-SYSTEM.md`

Frontend implementation should:

- Use reusable components.
- Follow the project's design system.
- Maintain responsive layouts.
- Include loading states.
- Include error states.
- Include empty states where appropriate.
- Maintain accessibility where practical.
- Avoid unnecessary visual complexity.
- Avoid inconsistent styling.

Do not create multiple implementations of the same UI component without a reason.

---

# 8. Backend Rules

Follow:

`docs/02-ARCHITECTURE.md`

and

`docs/03-API-CONTRACT.md`

Backend implementation should:

- Validate inputs.
- Handle errors explicitly.
- Keep business logic organized.
- Follow the defined API contract.
- Avoid exposing secrets.
- Return predictable responses.
- Avoid unnecessary endpoints.

Any API contract change must be reflected in:

`docs/03-API-CONTRACT.md`

---

# 9. Database Rules

Follow:

`docs/05-DATABASE.md`

Database implementation should:

- Use the database selected by the project.
- Follow the documented schema.
- Validate data.
- Protect sensitive data.
- Avoid unnecessary tables/collections.
- Avoid exposing privileged credentials.
- Document important schema changes.

Never place database credentials directly in source code.

---

# 10. Security Rules

Follow:

`docs/08-SECURITY.md`

Never commit:

- API keys
- Passwords
- Access tokens
- Database credentials
- Private keys
- Service-account credentials
- `.env` files containing real secrets

Use environment variables or the appropriate secret-management mechanism.

Before deployment, verify that no secrets are exposed.

---

# 11. Testing Rules

Follow:

`docs/06-TESTING.md`

Every significant feature should be tested before integration.

At minimum:

1. Test the normal flow.
2. Test important invalid inputs.
3. Test failure conditions.
4. Test integration with dependent components.
5. Test the production build when appropriate.

Do not claim a feature is complete if it has not been tested.

---

# 12. Git Rules

Follow:

`docs/09-TEAM-WORKFLOW.md`

General rules:

- Pull the latest changes before beginning work.
- Work on the appropriate branch.
- Make focused commits.
- Use meaningful commit messages.
- Do not commit generated junk.
- Do not commit secrets.
- Do not force-push shared branches unless explicitly coordinated.
- Do not overwrite another member's changes.
- Test before pushing.

Preferred commit style:

`feat: add user authentication`

`fix: resolve API validation error`

`refactor: simplify dashboard components`

`test: add API integration tests`

`docs: update deployment instructions`

---

# 13. Team Integration

This is a shared five-person repository.

Different members may work simultaneously on:

- Frontend
- Backend
- AI
- Database
- Testing
- Deployment

Avoid unnecessary changes outside the assigned task.

If a change affects another member's component:

1. Inspect the dependency.
2. Inform/coordinate with the affected component.
3. Make the smallest required change.
4. Test integration.

---

# 14. Problem Statement Phase

When the official problem statement is provided, do NOT immediately generate the entire application.

First:

1. Analyze the problem statement.
2. Identify the actual user/problem.
3. Extract functional requirements.
4. Identify non-functional requirements.
5. Identify core user flows.
6. Define MVP features.
7. Separate P0/P1/P2 features.
8. Select the technology stack.
9. Design the architecture.
10. Define the database if required.
11. Define the API contract if required.
12. Define the UI/UX direction.
13. Assign team responsibilities.
14. Update the `/docs` files.
15. Only then begin implementation.

The team must agree on the blueprint before major parallel development begins.

---

# 15. Hackathon Priority

The primary objective is:

WORKING PRODUCT > EXCESSIVE FEATURES

Prioritize:

1. Core problem solved
2. Reliable main user flow
3. Functional backend/database when required
4. Good UI/UX
5. AI functionality when required
6. Testing
7. Deployment
8. Demo reliability
9. Optional features

Do not sacrifice a working core product for unnecessary features.

---

# 16. 36-Hour Constraint

All technical decisions should consider the limited hackathon duration.

Prefer:

- Familiar technologies
- Free-tier services
- Managed services
- Simple architectures
- Fast deployment
- Minimal infrastructure
- Reliable libraries
- Small number of dependencies

Avoid unnecessary:

- Microservices
- Complex DevOps
- Custom infrastructure
- Premature optimization
- Over-engineering
- Large dependency chains

---

# 17. Definition of Done

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

# 18. Agent Behavior

When asked to modify the project:

- Inspect before editing.
- Reuse existing code where appropriate.
- Follow project documentation.
- Follow relevant project skills.
- Avoid unnecessary rewrites.
- Explain important architectural changes.
- Identify risks before making destructive changes.
- Verify the result after implementation.

If requirements are unclear, use the existing project documentation and context first.

Do not invent missing requirements.

---

# 19. Final Integration

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

# 20. Source of Truth

When making project decisions, use this priority:

1. Official hackathon problem statement
2. Agreed project documentation in `/docs`
3. Project skills in `/.agents/skills/`
4. Existing working implementation
5. General engineering best practices

Do not override a project-specific decision merely because another approach is generally preferred.

---

# Current Project Status

PRE-PROBLEM-STATEMENT

The official problem statement has not yet been provided.

Do not make project-specific assumptions until the problem statement is available.
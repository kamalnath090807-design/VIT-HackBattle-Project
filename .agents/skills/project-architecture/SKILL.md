---
name: project-architecture
description: Defines and maintains the software architecture, technology boundaries, system structure, data flow, and major technical decisions for the project. Use when planning architecture, adding major features, changing technologies, or modifying system boundaries.
---

# Project Architecture

## Purpose

Maintain a simple, reliable, scalable-enough architecture for the project.

The architecture must prioritize:

1. Correctness
2. Reliability
3. Security
4. Maintainability
5. Development speed
6. Demo readiness

For a time-limited hackathon, avoid unnecessary complexity.

---

## Mandatory Rules

### 1. Understand Before Implementing

Before making architectural decisions:

- Read `AGENTS.md`.
- Read the relevant files in `docs/`.
- Understand the current project structure.
- Identify existing technologies and dependencies.
- Identify how the proposed change affects other components.

Do not invent requirements.

---

### 2. Preserve the Existing Architecture

Before introducing:

- a new framework
- a new library
- a new database
- a new API service
- a new authentication system
- a new AI provider
- a new deployment platform
- a new architectural pattern

first determine whether the existing architecture already provides the required capability.

Prefer extending existing systems over adding unnecessary infrastructure.

---

### 3. Define Clear Boundaries

Keep responsibilities separated.

Typical boundaries may include:

```text
Frontend
   ↓
API / Backend
   ↓
Database
   ↓
External Services / AI
```

---

### 4. Architecture Verification Checklist

Before considering an architecture task complete:

- [ ] Clear separation between frontend presentation and backend business logic.
- [ ] No database credentials or secrets exposed to client-side code.
- [ ] Technology decisions recorded in `docs/10-DECISIONS.md`.
- [ ] High-level architecture and data flow updated in `docs/02-ARCHITECTURE.md`.
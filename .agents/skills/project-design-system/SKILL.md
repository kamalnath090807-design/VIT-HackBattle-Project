---
name: project-design-system
description: Defines and maintains the project's UI/UX system, visual language, component consistency, responsive behavior, accessibility, interaction patterns, and frontend design quality. Use when designing, implementing, reviewing, or modifying user interfaces.
---

# Project Design System

## Purpose

Create a polished, consistent, responsive, accessible, and production-quality user interface.

The UI should feel intentionally designed rather than generated as disconnected screens.

Priorities:

1. Usability
2. Visual hierarchy
3. Consistency
4. Responsiveness
5. Accessibility
6. Performance
7. Visual polish

---

# 1. Read Before Designing

Before creating or modifying UI:

1. Read `AGENTS.md`.
2. Read `docs/DESIGN_SYSTEM.md` if it exists.
3. Inspect existing components.
4. Inspect existing layouts and routes.
5. Reuse existing components where appropriate.
6. Understand the actual product requirements.

Do not invent unnecessary screens or features.

---

# 2. Design Before Implementation

For significant UI work, establish:

- page purpose
- user goal
- information hierarchy
- navigation
- primary action
- secondary actions
- loading states
- empty states
- error states
- success states
- responsive behavior

Do not immediately generate large amounts of UI code without understanding the screen structure.

---

# 3. Visual Hierarchy

Every screen should have a clear hierarchy.

Users should quickly understand:

```text
Where am I?
      ↓
What is this page about?
      ↓
What should I do?
      ↓
What happened?
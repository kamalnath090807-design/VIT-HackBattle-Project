---
name: project-testing
description: Defines the project's testing, verification, debugging, regression, integration, and quality-assurance workflow. Use when implementing features, debugging problems, reviewing code, integrating components, preparing releases, or verifying that the application is ready for demonstration.
---

# Project Testing

## Purpose

Ensure that the application is actually working, integrated, reliable, and ready for deployment and demonstration.

The goal is not maximum test coverage.

The goal is:

> Verify the important behavior and prevent regressions.

Priorities:

1. Core functionality
2. Integration correctness
3. Critical error handling
4. Security
5. User experience
6. Regression prevention
7. Additional test coverage

---

# 1. Read Before Testing

Before testing:

1. Read `AGENTS.md`.
2. Read relevant documentation in `docs/`.
3. Understand the feature requirements.
4. Inspect the implementation.
5. Identify dependencies and affected components.

Never declare something broken or working without checking the actual implementation and behavior.

---

# 2. Test the Requirement, Not the Implementation

Tests should verify what the application is supposed to do.

Prefer:

```text
User performs action
        ↓
Expected behavior
```

---

# 3. Hackathon Testing Workflow

Focus testing effort where it matters most:

1. **Happy Path (Primary Flow)**: Verify that the end-to-end user scenario works seamlessly without crashes.
2. **Key Negative Cases**: Test empty inputs, invalid formats, unauthorized requests, and network timeouts.
3. **Integration Points**: Verify that frontend correctly consumes backend responses and displays appropriate feedback.
4. **Demo Readiness**: Run the exact demonstration script 3 times prior to judging to confirm repeatability.
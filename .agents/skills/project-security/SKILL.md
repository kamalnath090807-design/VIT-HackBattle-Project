---
name: project-security
description: Defines security practices for application development including secrets, authentication, authorization, input validation, API security, database security, dependency safety, AI security, client-side exposure, and secure deployment. Use when implementing, reviewing, debugging, integrating, or deploying security-sensitive functionality.
---

# Project Security

## Purpose

Build the application securely without introducing unnecessary complexity.

Security priorities:

1. Protect secrets
2. Protect user data
3. Enforce authentication and authorization
4. Validate untrusted input
5. Secure APIs
6. Secure database access
7. Secure external services
8. Prevent common application vulnerabilities
9. Maintain secure deployment configuration

For a 36-hour hackathon, prioritize practical security controls that directly apply to the application.

---

# 1. Read Before Implementing

Before implementing security-sensitive functionality:

1. Read `AGENTS.md`.
2. Read relevant files in `docs/`.
3. Understand the application architecture.
4. Identify trust boundaries.
5. Identify what data is sensitive.
6. Identify which components are public and private.

Do not add security mechanisms without understanding the actual architecture.

---

# 2. Never Expose Secrets

Never put secrets directly in:

- source code
- frontend JavaScript
- HTML
- Git commits
- README files
- screenshots
- logs
- API responses

Examples of secrets:

```text
API keys
Database passwords
JWT signing secrets
Private tokens
Service-role credentials
OAuth client secrets
Private certificates
---
name: project-deployment
description: Defines the project's deployment, environment configuration, production build, hosting, secrets, domain, database configuration, monitoring, rollback, and production verification workflow. Use when preparing, deploying, debugging, or validating a production deployment.
---

# Project Deployment

## Purpose

Deploy the application reliably and verify that the deployed version actually works.

The goal is:

> Build → Configure → Deploy → Verify → Fix → Re-verify

Do not consider deployment complete merely because the hosting platform reports a successful build.

---

# 1. Read Before Deployment

Before deploying:

1. Read `AGENTS.md`.
2. Read relevant files in `docs/`.
3. Inspect the project structure.
4. Identify frontend, backend, database, AI, and external services.
5. Identify required environment variables.
6. Identify the production build command.
7. Identify the deployment platform.

Do not deploy based on assumptions.

---

# 2. Deployment Architecture

Document the production architecture.

Example:

```text
User
  ↓
Frontend Hosting
  ↓
Backend API
  ↓
Database
  ↓
External Services / AI
```

---

# 3. Post-Deployment Verification

After deploying:

1. Visit the deployed production URL.
2. Verify critical user paths end-to-end.
3. Check browser console and server logs for uncaught errors.
4. Verify all environment variables are correctly populated on the host.
5. Record the working production URL in `docs/07-DEPLOYMENT.md`.
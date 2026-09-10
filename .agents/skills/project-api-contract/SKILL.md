---
name: project-api-contract
description: Defines, maintains, validates, and documents the contracts between frontend, backend, AI services, databases, and external services. Use when creating, modifying, integrating, or debugging APIs and data exchange.
---

# Project API Contract

## Purpose

Maintain a clear and stable communication contract between all application components.

The contract may cover:

- Frontend ↔ Backend
- Backend ↔ Database
- Backend ↔ AI services
- Backend ↔ External APIs
- Frontend ↔ External APIs when explicitly required

The API contract is the shared agreement between components.

---

# 1. Read Before Changing

Before creating or modifying an API:

1. Read `AGENTS.md`.
2. Read `docs/03-API-CONTRACT.md`.
3. Read the relevant architecture documentation in `docs/02-ARCHITECTURE.md`.
4. Inspect the existing implementation.
5. Identify all consumers of the API.

Never modify an API based only on assumptions.

---

# 2. Every API Must Have a Clear Contract

For each endpoint, define:

- HTTP method
- URL/path
- Purpose
- Authentication requirement
- Request parameters
- Request body
- Request validation
- Response structure
- HTTP status codes
- Error structure
- Example request
- Example response

Example:

```text
POST /api/tasks

Authentication:
Required

Request:
{
  "title": "Build prototype",
  "description": "Create the MVP"
}

Success:
201

Response:
{
  "id": "123",
  "title": "Build prototype",
  "status": "pending"
}

Error:
400

{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Title is required"
  }
}
```
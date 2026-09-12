# API Contract — AURA

> **Status**: `PROPOSED` — Contract defined, pending team approval. Backend MUST implement this exact contract. Frontend MUST consume this exact contract.

---

## 1. API Principles

1. All communication between frontend and backend uses REST over HTTP/HTTPS
2. All request and response bodies are JSON (`Content-Type: application/json`)
3. All endpoints follow the documented contract — no ad-hoc endpoints
4. Backend validates all inputs before processing
5. Frontend must handle all documented error codes
6. API changes require updating this document FIRST, then implementation
7. No secrets in API responses

---

## 2. Base URL

| Environment | URL | Status |
|-------------|-----|--------|
| Development | `http://localhost:3001/api/v1` | `PROPOSED` |
| Production | `https://<backend-host>/api/v1` | `TBD` |

---

## 3. Authentication

| Aspect | Detail | Status |
|--------|--------|--------|
| Method | Bearer token (JWT from Supabase Auth) | `PROPOSED` |
| Header | `Authorization: Bearer <token>` | `PROPOSED` |
| Required | All endpoints except `POST /auth/login`, `POST /auth/register`, `GET /health` | `PROPOSED` |
| MVP simplification | For MVP, may use a pre-authenticated demo session | `TBD` |

### Authentication Failure Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}
```

HTTP Status: `401`

---

## 4. Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Backend dependency unavailable |
| `TASK_NOT_FOUND` | 404 | Specified task does not exist |
| `TOOL_EXECUTION_FAILED` | 500 | External tool call failed |
| `LLM_PROVIDER_ERROR` | 503 | AI model provider call failed after retry/fallback |
| `APPROVAL_REQUIRED` | 202 | Task paused, awaiting user approval |

---

## 5. Task States

Tasks progress through these states. Frontend rendering MUST map to these exact values.

| State | Description | Terminal? |
|-------|-------------|-----------|
| `QUEUED` | Task created, not yet started | No |
| `PLANNING` | Agent is generating a plan | No |
| `AWAITING_APPROVAL` | Plan or step requires user approval | No |
| `EXECUTING` | Agent is executing steps | No |
| `OBSERVING` | Agent is processing tool results | No |
| `REPLANNING` | Agent is adapting the plan | No |
| `VERIFYING` | Agent is verifying outcomes | No |
| `COMPLETED` | Task finished successfully with verification | Yes |
| `PARTIALLY_COMPLETED` | Some steps succeeded, some failed | Yes |
| `FAILED` | Task failed | Yes |
| `CANCELLED` | Task cancelled by user | Yes |

**Status**: `DECIDED` — These states are the canonical shared contract.

---

## 6. Endpoints

---

### 6.1 Health Check

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/health` |
| **Purpose** | Verify backend is running |
| **Authentication** | None |
| **Owner** | Abishek |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "ai_provider": "groq",
    "timestamp": "2026-09-12T10:00:00Z"
  }
}
```

---

### 6.2 Create Task

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/tasks` |
| **Purpose** | Submit a new goal for the agent to execute |
| **Authentication** | Required |
| **Owner** | Abishek |

#### Request Body

```json
{
  "goal": "Check the weather in Chennai and create a summary"
}
```

#### Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `goal` | string | Yes | 1-1000 characters, non-empty |

#### Response (201)

```json
{
  "success": true,
  "data": {
    "taskId": "uuid-v4",
    "goal": "Check the weather in Chennai and create a summary",
    "status": "QUEUED",
    "createdAt": "2026-09-12T10:00:00Z",
    "steps": [],
    "currentStepIndex": null,
    "result": null
  }
}
```

#### Errors

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 400 | Goal is empty or exceeds length |
| `AUTH_REQUIRED` | 401 | No valid token |
| `RATE_LIMITED` | 429 | Too many tasks created |

---

### 6.3 Get Task

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/tasks/:taskId` |
| **Purpose** | Get current state of a task including all steps |
| **Authentication** | Required |
| **Owner** | Abishek |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "taskId": "uuid-v4",
    "goal": "Check the weather in Chennai and create a summary",
    "status": "EXECUTING",
    "createdAt": "2026-09-12T10:00:00Z",
    "updatedAt": "2026-09-12T10:01:30Z",
    "plan": {
      "steps": [
        {
          "stepIndex": 0,
          "description": "Fetch current weather for Chennai",
          "tool": "weather_api",
          "params": { "city": "Chennai" },
          "riskLevel": "LOW",
          "status": "COMPLETED",
          "result": { "temperature": 32, "condition": "Sunny" },
          "startedAt": "2026-09-12T10:00:05Z",
          "completedAt": "2026-09-12T10:00:07Z"
        },
        {
          "stepIndex": 1,
          "description": "Generate weather summary",
          "tool": "llm_summarize",
          "params": { "data": "..." },
          "riskLevel": "LOW",
          "status": "EXECUTING",
          "result": null,
          "startedAt": "2026-09-12T10:00:08Z",
          "completedAt": null
        }
      ]
    },
    "currentStepIndex": 1,
    "result": null,
    "approvalRequired": null
  }
}
```

#### Errors

| Code | Status | Condition |
|------|--------|-----------|
| `TASK_NOT_FOUND` | 404 | Task does not exist or belongs to another user |
| `AUTH_REQUIRED` | 401 | No valid token |

---

### 6.4 List Tasks

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/tasks` |
| **Purpose** | List all tasks for the authenticated user |
| **Authentication** | Required |
| **Owner** | Abishek |

#### Query Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | string | No | all | Filter by task status |
| `limit` | integer | No | 20 | Max results (1-100) |
| `offset` | integer | No | 0 | Pagination offset |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "uuid-v4",
        "goal": "Check the weather in Chennai",
        "status": "COMPLETED",
        "createdAt": "2026-09-12T10:00:00Z",
        "updatedAt": "2026-09-12T10:02:00Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 6.5 Cancel Task

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/tasks/:taskId/cancel` |
| **Purpose** | Cancel a running task |
| **Authentication** | Required |
| **Owner** | Abishek |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "taskId": "uuid-v4",
    "status": "CANCELLED",
    "cancelledAt": "2026-09-12T10:05:00Z"
  }
}
```

#### Errors

| Code | Status | Condition |
|------|--------|-----------|
| `TASK_NOT_FOUND` | 404 | Task does not exist |
| `VALIDATION_ERROR` | 400 | Task is already in a terminal state |

---

### 6.6 Submit Approval Decision

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/tasks/:taskId/approve` |
| **Purpose** | Approve or reject a pending approval request |
| **Authentication** | Required |
| **Owner** | Abishek |

#### Request Body

```json
{
  "stepIndex": 2,
  "decision": "APPROVED",
  "reason": "Looks good, proceed"
}
```

#### Validation

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `stepIndex` | integer | Yes | Index of the step awaiting approval |
| `decision` | string | Yes | `"APPROVED"` or `"REJECTED"` |
| `reason` | string | No | Optional reason for the decision |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "taskId": "uuid-v4",
    "stepIndex": 2,
    "decision": "APPROVED",
    "status": "EXECUTING"
  }
}
```

#### Errors

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 400 | Invalid decision value or step not awaiting approval |
| `TASK_NOT_FOUND` | 404 | Task not found |

---

### 6.7 Get Audit Logs

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/tasks/:taskId/audit` |
| **Purpose** | Get the audit trail for a task |
| **Authentication** | Required |
| **Owner** | Abishek |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "taskId": "uuid-v4",
    "entries": [
      {
        "entryId": "uuid-v4",
        "timestamp": "2026-09-12T10:00:00Z",
        "action": "TASK_CREATED",
        "details": { "goal": "Check the weather in Chennai" }
      },
      {
        "entryId": "uuid-v4",
        "timestamp": "2026-09-12T10:00:05Z",
        "action": "PLAN_GENERATED",
        "details": { "stepCount": 3 }
      },
      {
        "entryId": "uuid-v4",
        "timestamp": "2026-09-12T10:00:07Z",
        "action": "TOOL_EXECUTED",
        "details": {
          "tool": "weather_api",
          "stepIndex": 0,
          "success": true,
          "duration_ms": 1200
        }
      }
    ]
  }
}
```

#### Audit Action Types

| Action | Description |
|--------|-------------|
| `TASK_CREATED` | Task was created |
| `PLAN_GENERATED` | Agent generated a plan |
| `PLAN_VALIDATED` | Plan passed validation |
| `PLAN_REJECTED` | Plan failed validation |
| `STEP_STARTED` | Step execution began |
| `TOOL_EXECUTED` | Tool was called |
| `TOOL_FAILED` | Tool call failed |
| `APPROVAL_REQUESTED` | Step requires user approval |
| `APPROVAL_GRANTED` | User approved the step |
| `APPROVAL_DENIED` | User rejected the step |
| `STEP_COMPLETED` | Step finished successfully |
| `STEP_FAILED` | Step failed |
| `REPLANNING` | Agent is generating a new plan |
| `VERIFICATION_STARTED` | Verification began |
| `VERIFICATION_PASSED` | Outcome verified |
| `VERIFICATION_FAILED` | Verification failed |
| `TASK_COMPLETED` | Task finished |
| `TASK_FAILED` | Task failed |
| `TASK_CANCELLED` | Task was cancelled |

---

### 6.8 Get Available Tools

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Path** | `/api/v1/tools` |
| **Purpose** | List all registered tools and their descriptions |
| **Authentication** | Required |
| **Owner** | Abishek / Bala |

#### Response (200)

```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "name": "weather_api",
        "description": "Fetch current weather data for a city",
        "parameters": {
          "city": { "type": "string", "required": true, "description": "City name" }
        },
        "riskLevel": "LOW"
      },
      {
        "name": "github_issues",
        "description": "Fetch issues from a GitHub repository",
        "parameters": {
          "owner": { "type": "string", "required": true },
          "repo": { "type": "string", "required": true },
          "state": { "type": "string", "required": false, "default": "open" }
        },
        "riskLevel": "LOW"
      }
    ]
  }
}
```

---

### 6.9 Authentication Endpoints

> **Status**: `PROPOSED` — Required only if authentication is in MVP scope.

#### Register

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/register` |
| **Purpose** | Create a new user account |
| **Authentication** | None |

```json
// Request
{ "email": "user@example.com", "password": "securepassword" }

// Response (201)
{ "success": true, "data": { "userId": "uuid", "email": "user@example.com" } }
```

#### Login

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/login` |
| **Purpose** | Authenticate and receive a token |
| **Authentication** | None |

```json
// Request
{ "email": "user@example.com", "password": "securepassword" }

// Response (200)
{ "success": true, "data": { "token": "jwt-token", "userId": "uuid" } }

// Error (401)
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }
```

---

## 7. Real-Time Updates

| Option | Mechanism | Complexity | Status |
|--------|-----------|-----------|--------|
| **Polling** | Frontend polls `GET /tasks/:id` every 2-3 seconds | Low | `RECOMMENDED` |
| **SSE** | Server-Sent Events for push updates | Medium | `ALTERNATIVE` |
| **WebSocket** | Full duplex real-time | High | `NOT RECOMMENDED` for MVP |

**Decision**: `TBD` — Polling is recommended for MVP simplicity.

---

## 8. API Rules

1. Frontend MUST consume the exact response schema documented here
2. Backend MUST return the exact response schema documented here
3. Do not silently change request/response structures
4. API changes MUST update this document FIRST
5. Breaking changes require team coordination
6. Validate inputs on the backend (never trust client)
7. Do not expose secrets through API responses
8. All dates in ISO 8601 UTC format
9. All IDs are UUIDs (v4)
10. Pagination uses `limit` + `offset` pattern
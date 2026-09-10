# Deployment

## Status

TBD

## Frontend Hosting

TBD

## Backend Hosting

TBD

## Database Hosting

TBD

## Production URL

TBD

## Environment Variables

Required variables:

```text
# TBD — Add environment variable keys here (NEVER commit actual values)
# Example:
# API_BASE_URL=
# DATABASE_URL=
```

## Build & Run Commands

### Frontend

- Build: `TBD`
- Run: `TBD`

### Backend

- Build: `TBD`
- Run: `TBD`

## Deployment Workflow

1. Verify all tests pass locally.
2. Ensure no uncommitted secrets or debug logs remain.
3. Configure environment variables in hosting dashboard.
4. Deploy to target hosting platform.
5. Perform post-deployment smoke test immediately.

## Post-Deployment Smoke Test Checklist

- [ ] Deployed production URL is live and returns HTTP 200
- [ ] Frontend loads and assets render properly
- [ ] API endpoints respond as expected
- [ ] Database read/write operations succeed
- [ ] Authentication / external services work in production
- [ ] Responsive layout verifies on mobile / desktop

## Emergency Fallback & Rollback Plan

- **Deployment failure**: Roll back to the last known working commit on `main`.
- **Hosting outage during demo**: Prepare a verified local demo runner fallback (`localhost`) with mock/seed data.
- **Critical bug found during demo**: Revert or toggle the specific feature branch rather than making untested hotfixes.
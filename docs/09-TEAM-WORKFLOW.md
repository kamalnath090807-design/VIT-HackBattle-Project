# Team Workflow

## Team Size

5 members

## Repository

Shared Git repository.

## Development Model

All team members work from the same repository.

## Branch Strategy

main
│
├── feature/frontend
├── feature/backend
├── feature/ai
├── feature/database
└── feature/testing

Actual branch names may be assigned per member.

## Rules

1. Do not directly overwrite another person's work.
2. Pull latest changes before starting work.
3. Commit frequently.
4. Use meaningful commit messages.
5. Push completed work regularly.
6. Test before opening a pull request.
7. Do not merge blindly.
8. Resolve conflicts carefully.
9. Do not modify another person's feature without coordination.
10. Main branch must remain deployable whenever practical.

## Roles

### Kamal

Team lead / architecture / integration / final QA / deployment

### Abishek

Frontend / UI Implementation (tentative)

### Manoj

Backend / API (tentative)

### Balasubramanian

Database / AI / Backend Support (tentative)

### Elango

Testing / Deployment / Integration Support (tentative)

> Note: Roles will be finalized immediately after the official problem statement is released.

## Integration Process

```text
Member develops feature
        ↓
Local testing
        ↓
Commit
        ↓
Push feature branch
        ↓
Pull Request / Coordinate
        ↓
Review & Integration
        ↓
Integration Testing on main
```

## Git Command Quick Reference

### Starting Work on a Feature

```bash
git checkout main
git pull origin main
git checkout -b feature/<feature-name>
```

### Syncing with Latest Main

```bash
git checkout feature/<feature-name>
git fetch origin
git merge origin/main
```

### Submitting Completed Feature

```bash
git add .
git commit -m "feat: concise description of change"
git push origin feature/<feature-name>
```
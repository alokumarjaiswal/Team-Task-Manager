# Test Credentials & Demo Data

These accounts are seeded by `backend/scripts/seed-test-users.js`.  
Run `node scripts/seed-test-users.js` from the `backend/` directory after a fresh database to recreate them.

## Test Admin

| Field    | Value             |
|----------|-------------------|
| Email    | admin@test.com    |
| Password | Admin1234!        |
| Role     | admin             |

## Test Member

| Field    | Value             |
|----------|-------------------|
| Email    | member@test.com   |
| Password | Member1234!       |
| Role     | member            |

---

## Usage in Tests

The test suite uses an **in-memory SQLite database** (`DB_STORAGE=:memory:`), so these seeded accounts are not present during automated tests. Instead, tests create users programmatically via the API or directly via `User.create()`.

For JWT generation in tests, use the `makeToken` helper:

```js
const { makeToken, createTestApp } = require('./__tests__/helpers/setup');

const adminToken = makeToken({ _id: 1, role: 'admin' }, 'test-secret');
const memberToken = makeToken({ _id: 2, role: 'member' }, 'test-secret');
```

## Manual / Integration Testing

Use these credentials when testing against the local development server (`npm run dev` or `node server.js` from `backend/`).

Login endpoint:
```
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@test.com", "password": "Admin1234!" }
```

The response includes a JWT token valid for 24 hours (configurable via `JWT_EXPIRES_IN`).

---

## Demo Project

Seeded by `backend/scripts/seed-demo-project.js`. Run after `seed-test-users.js`.

```
node scripts/seed-test-users.js
node scripts/seed-demo-project.js
```

The script is idempotent — re-running it skips creation if the project already exists.

### Project: 🚀 Team Task Manager — Feature Showcase

Both test users are members. The project contains 11 tasks spread across 4 milestones:

| Milestone | Tasks | What it demonstrates |
|---|---|---|
| **Onboarding** | 2 | Role differences (admin vs member), login flow |
| **Task Management** | 4 | All task fields, Kanban board, labels, overdue highlighting |
| **Collaboration** | 2 | Comments, file attachments |
| **Admin Features** | 2 | Team management, Dashboard stats |
| **Real-time** | 1 | WebSocket live updates |

Tasks cover all three statuses (`todo`, `in-progress`, `done`), include due dates (past and future), labels, milestones, and assignees. Seed comments and activity log entries are included so the Activity feed is populated on first login.

---

## Known Model Fixes Applied

Two Sequelize models had `updatedAt: false` while their migrations created the `updatedAt` column as `NOT NULL`. This caused every `create()` call to fail with a SQLite constraint error surfaced as `"Validation error"`.

**Fixed files:**
- `backend/models/User.js` — removed `updatedAt: false`
- `backend/models/Project.js` — removed `updatedAt: false`

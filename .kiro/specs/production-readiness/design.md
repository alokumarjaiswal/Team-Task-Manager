# Design Document: Production Readiness

## Overview

This document describes the technical architecture and implementation plan for making the Team Task Manager production-ready. The work spans five areas: project-membership authorization, database migrations, backend build quality, frontend bug fixes, and test infrastructure. No new product features are introduced.

The backend is Node.js + Express 5 + Sequelize 6 running on Railway. The frontend is React 19 + Vite deployed to Railway or Netlify. The database is SQLite in development and PostgreSQL in production.

---

## Architecture

### Current State

The backend currently uses `sequelize.sync()` in development to create tables on the fly and skips sync entirely in production. There is no migration system, no membership check on task reads/writes, no HTTP compression, and the `uploads/` directory is assumed to exist. The frontend `Team.jsx` mixes direct `axios` calls with the `api.js` service module.

### Target State

```
backend/
  migrations/
    001-create-users.js
    002-create-projects.js
    003-create-project-members.js
    004-create-tasks.js
    005-create-activity-logs.js
    006-create-comments.js
    007-create-attachments.js
  middleware/
    auth.js          ← adds requireProjectMember()
  server.js          ← runs migrations before listen(), creates uploads/, adds compression
  nixpacks.toml      ← npm ci
  __tests__/
    auth.test.js
    projects.test.js
    tasks.test.js
    dashboard.test.js
    helpers/
      setup.js       ← in-memory SQLite, model sync, token helpers

frontend/src/
  components/
    layout/TopNav.jsx          ← avatar dropdown with logout
    project/FilterBar.jsx      ← outside-click closes menu
    task/TaskDetailPanel.jsx   ← inline status + assignee selects
  pages/
    Dashboard.jsx              ← uses dashboardAPI, correct todo count
    Team.jsx                   ← no direct axios imports
```

---

## Components and Interfaces

### Backend Components

| Component | File | Responsibility |
|-----------|------|----------------|
| Migration Runner | `backend/migrations/runner.js` | Creates and returns an Umzug instance configured for the active Sequelize connection |
| Migration Files | `backend/migrations/001-007-*.js` | Idempotent DDL for each table; compatible with SQLite and PostgreSQL |
| `requireProjectMember` | `backend/middleware/auth.js` | Factory middleware that enforces project membership with admin bypass |
| Compression Middleware | `backend/server.js` | Applies gzip to responses > 1 KB via the `compression` npm package |
| Uploads Bootstrap | `backend/server.js` | Creates `uploads/` directory on startup if absent |

### Frontend Components

| Component | File | Change |
|-----------|------|--------|
| `TopNav` | `frontend/src/components/layout/TopNav.jsx` | Adds avatar dropdown with user name and logout; outside-click closes it |
| `FilterBar` | `frontend/src/components/project/FilterBar.jsx` | Adds `useRef` + `useEffect` outside-click handler to close open menus |
| `TaskDetailPanel` | `frontend/src/components/task/TaskDetailPanel.jsx` | Adds inline `<select>` for `status` and `assignedTo`; both included in `onSave` payload |
| `Dashboard` | `frontend/src/pages/Dashboard.jsx` | Switches to `dashboardAPI.get()`; derives all counts from `tasksByStatus` |
| `Team` | `frontend/src/pages/Team.jsx` | Replaces direct `axios` calls with `authAPI.signup()` and `userAPI.setRole()` |
| `api.js` | `frontend/src/services/api.js` | Adds `userAPI.setRole(id, role)` method |

### Interfaces

**`requireProjectMember(getProjectId)` middleware factory:**
- Input: `getProjectId` — a synchronous or async function `(req) => projectId | null`
- Behaviour: calls `getProjectId(req)`, looks up `ProjectMembers`, returns 403 if no row found
- Admin bypass: if `req.user.role === 'admin'`, calls `next()` immediately
- Exported from `backend/middleware/auth.js` alongside `auth` and `adminAuth`

**`createMigrationRunner(sequelize)` function:**
- Input: a Sequelize instance
- Returns: an Umzug instance with `SequelizeStorage` and glob-resolved migration files
- Called once in `startServer()` before `server.listen()`

**`dashboardAPI.get()` response shape (existing, consumed by Dashboard):**
```js
{
  tasksByStatus: { todo: number, 'in-progress': number, done: number },
  totalTasks: number,
  projectCount: number,
  teamSize: number,
  overdueTasks: number,
  tasksByProject: [{ projectId, projectName, taskCount }],
  recentActivity: [ActivityLog],
}
```

---

## Component Design

### 1. Migration System

**Library choice:** `umzug` v3 (the official Sequelize migration companion). It is dialect-agnostic, works with the existing Sequelize instance, and supports programmatic execution — no CLI required.

**Migration runner module** (`backend/migrations/runner.js`):

```js
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');

function createMigrationRunner(sequelize) {
  return new Umzug({
    migrations: {
      glob: path.join(__dirname, '*.js'),
      resolve: ({ name, path: migPath, context }) => {
        const migration = require(migPath);
        return {
          name,
          up: async () => migration.up(context, sequelize.constructor),
          down: async () => migration.down(context, sequelize.constructor),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
}

module.exports = createMigrationRunner;
```

Each migration file exports `{ up, down }` using `queryInterface` directly so it works with both SQLite and PostgreSQL:

```js
// 001-create-users.js
'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('Users', {
      _id:       { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name:      { type: DataTypes.STRING,  allowNull: false },
      email:     { type: DataTypes.STRING,  allowNull: false, unique: true },
      password:  { type: DataTypes.STRING,  allowNull: false },
      role:      { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
      createdAt: { type: DataTypes.DATE,    allowNull: false },
      updatedAt: { type: DataTypes.DATE,    allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Users');
  },
};
```

> **SQLite note:** SQLite does not support `ENUM` natively. Sequelize maps `DataTypes.ENUM` to `VARCHAR(255)` on SQLite automatically, so the same migration file works on both dialects without branching.

**Startup integration** in `server.js`:

```js
const createMigrationRunner = require('./migrations/runner');
const fs = require('fs');

const startServer = async () => {
  // 1. Run pending migrations
  const umzug = createMigrationRunner(sequelize);
  await umzug.up();

  // 2. Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // 3. Start listening
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});

The old `sequelize.sync()` branch is removed entirely. Both development and production now go through migrations.

**Migration file sequence and key constraints:**

| File | Table | Notable constraints |
|------|-------|---------------------|
| `001-create-users.js` | `Users` | `email` UNIQUE |
| `002-create-projects.js` | `Projects` | FK `createdBy → Users._id` |
| `003-create-project-members.js` | `ProjectMembers` | FK `projectId → Projects._id`, FK `userId → Users._id`, INDEX on `userId` |
| `004-create-tasks.js` | `Tasks` | FK `projectId → Projects._id` ON DELETE CASCADE, INDEX on `projectId`, FK `assignedTo → Users._id` |
| `005-create-activity-logs.js` | `ActivityLogs` | FK `userId → Users._id`, FK `taskId → Tasks._id` |
| `006-create-comments.js` | `Comments` | FK `userId → Users._id`, FK `taskId → Tasks._id` ON DELETE CASCADE |
| `007-create-attachments.js` | `Attachments` | FK `userId → Users._id`, FK `taskId → Tasks._id` ON DELETE CASCADE |

Umzug stores applied migration names in a `SequelizeMeta` table it creates automatically. Re-running `umzug.up()` on a server that already has all migrations applied is a no-op.

---

### 2. Authorization Middleware

**New middleware function** `requireProjectMember` added to `backend/middleware/auth.js`:

```js
const { ProjectMembers } = require('../models/Project');

/**
 * Factory that returns middleware enforcing project membership.
 * @param {Function} getProjectId - receives (req) and returns the projectId to check
 */
const requireProjectMember = (getProjectId) => async (req, res, next) => {
  if (req.user.role === 'admin') return next(); // admin bypass

  const projectId = await getProjectId(req);
  if (!projectId) return next(); // no project context — let route handle it

  const membership = await ProjectMembers.findOne({
    where: { projectId, userId: req.user._id },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

**Applied to routes:**

`GET /api/tasks?projectId=X` — middleware resolves `projectId` from `req.query.projectId`:

```js
router.get('/',
  auth,
  requireProjectMember(req => req.query.projectId || null),
  async (req, res) => { /* existing handler, but adds member filter when no projectId */ }
);
```

When `projectId` is absent, the handler itself filters tasks to only those belonging to the user's member projects (mirrors the dashboard logic already in `GET /api/dashboard`).

`PUT /api/tasks/:id` — middleware resolves `projectId` by loading the task first:

```js
router.put('/:id',
  auth,
  async (req, res, next) => {
    // Pre-load task so both the membership check and the handler can use it
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    req.task = task; // attach for downstream use
    next();
  },
  requireProjectMember(req => req.task.projectId),
  validate(taskUpdateSchema),
  async (req, res) => { /* handler uses req.task instead of re-fetching */ }
);
```

`GET /api/projects` — handler already exists but returns all projects for all users. Fix: add membership filter for non-admins:

```js
router.get('/', auth, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const projects = isAdmin
    ? await Project.findAll({ include: [...] })
    : await Project.findAll({
        include: [
          { model: User, as: 'members', where: { _id: req.user._id }, through: { attributes: [] } },
          { model: User, as: 'owner', attributes: ['_id', 'name', 'email'] },
        ],
      });
  res.json(projects.map(formatProject));
});
```

`GET /api/projects/:id` — add membership check after fetching:

```js
router.get('/:id', auth, async (req, res) => {
  const project = await Project.findByPk(req.params.id, { include: [...] });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin') {
    const membership = await ProjectMembers.findOne({
      where: { projectId: project._id, userId: req.user._id },
    });
    if (!membership) return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(formatProject(project));
});
```

---

### 3. Backend Build and Runtime Quality

#### 3a. nixpacks.toml — `npm ci`

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[start]
cmd = "node server.js"
```

#### 3b. Uploads directory creation

Handled in `startServer()` as shown in the migration section above. Uses `fs.mkdirSync(UPLOADS_DIR, { recursive: true })` which is idempotent — safe to call even if the directory already exists.

#### 3c. Cache-Control header for attachments

```js
app.get('/api/attachments/:filename', auth, (req, res) => {
  // ... path validation unchanged ...
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).json({ error: 'File not found' });
  });
});
```

#### 3d. HTTP compression

Add `compression` middleware (npm package `compression`) before route registration:

```js
const compression = require('compression');

// After helmet and cors, before routes:
app.use(compression({
  threshold: 1024, // only compress responses > 1 KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));
```

`compression` is added to `dependencies` in `package.json`.

#### 3e. Team.jsx — remove direct axios imports

`Team.jsx` currently calls `axios.post(...)` for signup and `axios.put(...)` for role promotion. These are replaced with `api.js` service calls:

```js
// Before (Team.jsx)
import axios from 'axios';
const { data: newUser } = await axios.post(`${API_URL}/api/auth/signup`, { ... });
await axios.put(`${API_URL}/api/users/${newUser._id}/role`, { role: 'admin' }, {
  headers: { Authorization: `Bearer ${token}` },
});

// After (Team.jsx)
import { authAPI, userAPI } from '../services/api';
const { data: newUser } = await authAPI.signup({ name, email, password });
if (form.role === 'admin') {
  await userAPI.setRole(newUser._id, 'admin');
}
```

A new `setRole` method is added to `userAPI` in `api.js`:

```js
export const userAPI = {
  getAll: () => api.get('/users'),
  getMe: () => api.get('/users/me'),
  delete: (id) => api.delete(`/users/${id}`),
  setRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};
```

The `import API_URL from '../config'` import in `Team.jsx` is also removed since it is no longer needed.

---

### 4. Frontend Bug Fixes

#### 4a. Dashboard — correct "To Do" count and pie chart

**Bug:** The "To Do" value is computed as `totalTasks - completedTasks - pendingTasks`, where `pendingTasks` already includes `todo` tasks (`status === 'todo' || status === 'in-progress'`). This double-counts `todo` tasks and produces zero or negative values.

**Fix:** Compute each status count independently from the `tasksByStatus` object returned by `GET /api/dashboard`:

```jsx
// Dashboard.jsx — after
const { data } = await dashboardAPI.get();
const { tasksByStatus, totalTasks, projectCount, teamSize, overdueTasks,
        tasksByProject, recentActivity } = data;

const todoCount      = tasksByStatus.todo        ?? 0;
const inProgressCount = tasksByStatus['in-progress'] ?? 0;
const doneCount      = tasksByStatus.done        ?? 0;
```

The pie chart data array becomes:

```jsx
const pieData = [
  { name: 'To Do',       value: todoCount,       color: '#9CA3AF' },
  { name: 'In Progress', value: inProgressCount, color: '#F59E0B' },
  { name: 'Done',        value: doneCount,       color: '#22C55E' },
];
```

The stat cards use `todoCount`, `inProgressCount`, and `doneCount` directly. The `tasks` and `projects` local state arrays are removed; all counts come from the dashboard endpoint response. The `recentActivity` array from the response replaces the separate `activityAPI.getAll()` call.

**Data flow change:** Dashboard now calls only `dashboardAPI.get()` (and `userAPI.getAll()` for the assignee avatar lookup in the recent tasks list). The four parallel `Promise.all` calls are replaced with a single dashboard call.

#### 4b. TopNav — avatar dropdown

**Current behavior:** Clicking the avatar button calls `onLogout` directly.

**Fix:** Add local `open` state and render a dropdown panel. Outside-click is handled via a `useEffect` that attaches a `mousedown` listener to `document` and closes the menu when the click target is outside the component's ref.

```jsx
import { useRef, useState, useEffect } from 'react';

export default function TopNav({ user, onLogout, onToggleTheme, themeLabel, darkMode, onCreate }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="top-nav">
      {/* ... left side unchanged ... */}
      <div className="top-nav__right">
        {/* ... other buttons unchanged ... */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="avatar-button"
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="User menu"
          >
            {initial}
          </button>
          {open && (
            <div className="avatar-dropdown" role="menu">
              <div className="avatar-dropdown__name">{user?.name}</div>
              <button
                type="button"
                role="menuitem"
                className="avatar-dropdown__item"
                onClick={() => { setOpen(false); onLogout(); }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

#### 4c. FilterBar — outside-click closes menu

**Current behavior:** Menus only close when the user clicks the "Close" or "Done" button inside the menu. Clicking elsewhere on the page leaves the menu open.

**Fix:** Same `useRef` + `useEffect` pattern as TopNav, scoped to the `filter-bar__actions` container:

```jsx
import { useRef, useMemo, useState, useEffect } from 'react';

export default function FilterBar({ ... }) {
  const [openMenu, setOpenMenu] = useState(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  return (
    <div className="filter-bar">
      {/* search input unchanged */}
      <div ref={actionsRef} className="filter-bar__actions" style={{ position: 'relative' }}>
        {/* all existing content unchanged */}
        {renderMenu()}
      </div>
    </div>
  );
}
```

#### 4d. TaskDetailPanel — inline status and assignee selects

**Current behavior:** The panel has text inputs for title, description, labels, and milestone, but no controls for `status` or `assignedTo`. The `onSave(draft)` call therefore never includes updated status or assignee values.

**Fix:** Add `<select>` elements for both fields inside the editor section, driven by the `draft` state:

```jsx
{/* Status select */}
<label htmlFor="task-status" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
  Status
</label>
<select
  id="task-status"
  value={draft?.status || 'todo'}
  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
  aria-label="Task status"
>
  <option value="todo">To Do</option>
  <option value="in-progress">In Progress</option>
  <option value="done">Done</option>
</select>

{/* Assignee select */}
<label htmlFor="task-assignee" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
  Assignee
</label>
<select
  id="task-assignee"
  value={draft?.assignedTo ?? ''}
  onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value ? Number(e.target.value) : null })}
  aria-label="Task assignee"
>
  <option value="">Unassigned</option>
  {users.map((u) => (
    <option key={u._id} value={u._id}>{u.name}</option>
  ))}
</select>
```

The `draft` state already spreads all task fields including `status` and `assignedTo` on initialization, so `onSave(draft)` will automatically include the updated values when the user clicks "Save changes".

---

### 5. Test Infrastructure

#### 5a. Dependencies

Added to `backend/package.json` `devDependencies`:

```json
{
  "jest": "^29.7.0",
  "supertest": "^7.0.0"
}
```

Updated `test` script:

```json
{
  "scripts": {
    "test": "jest --forceExit"
  }
}
```

Jest configuration in `package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.js"],
    "setupFilesAfterFramework": []
  }
}
```

#### 5b. Test setup helper (`backend/__tests__/helpers/setup.js`)

```js
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');

// Create a fresh in-memory SQLite instance for each test file
function createTestSequelize() {
  return new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
}

// Generate a signed JWT for a user object { _id, role }
function makeToken(user, secret = 'test-secret') {
  return jwt.sign({ _id: user._id, role: user.role }, secret, { expiresIn: '1h' });
}

// Bootstrap: sync all models against the in-memory DB
async function setupTestDb(sequelize) {
  // Re-define models against the test sequelize instance
  // (models are imported and their sequelize instance is replaced)
  await sequelize.sync({ force: true });
}

module.exports = { createTestSequelize, makeToken, setupTestDb };
```

**Environment variable override:** Tests set `process.env.NODE_ENV = 'test'` and `process.env.JWT_SECRET = 'test-secret'` before importing the app. The config module reads these at require-time, so the test JWT secret is used throughout.

**App factory pattern:** `server.js` exports the Express `app` (without calling `listen`) so Supertest can wrap it:

```js
// server.js — add at bottom
if (require.main === module) {
  startServer();
}
module.exports = { app };
```

#### 5c. Test file structure

```
backend/__tests__/
  helpers/
    setup.js
  auth.test.js       — POST /api/auth/signup, POST /api/auth/login
  projects.test.js   — GET /api/projects, POST /api/projects
  tasks.test.js      — GET /api/tasks, PUT /api/tasks/:id
  dashboard.test.js  — GET /api/dashboard
```

Each test file:
1. Calls `jest.resetModules()` and sets env vars before requiring the app
2. Uses `beforeAll` to sync the in-memory DB and seed minimal fixture data
3. Uses `afterAll` to close the Sequelize connection

Example pattern (`auth.test.js`):

```js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const { app } = require('../server');

describe('POST /api/auth/signup', () => {
  it('returns 201 and a token for valid input', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 400 for duplicate email', async () => {
    await request(app).post('/api/auth/signup')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/signup')
      .send({ name: 'Bob2', email: 'bob@example.com', password: 'password123' });
    expect(res.status).toBe(400);
  });
});
```

---

## Data Models

No new models are introduced. The migration files formalize the schema that Sequelize models already define. The key additions are:

- **Explicit `ON DELETE CASCADE`** on `Tasks.projectId → Projects._id` (currently only defined at the Sequelize association level, not enforced at the DB level in SQLite without explicit FK pragma)
- **Indexes** on `Tasks.projectId` and `ProjectMembers.userId` for query performance

---

## Error Handling

| Scenario | HTTP status | Response body |
|----------|-------------|---------------|
| Unauthenticated request | 401 | `{ "error": "Access denied" }` |
| Authenticated non-member accessing project/task | 403 | `{ "error": "Forbidden" }` |
| Resource not found | 404 | `{ "error": "... not found" }` |
| Validation failure | 400 | `{ "error": "..." }` (Joi message) |
| Unhandled server error | 500 | `{ "error": "Internal server error" }` (production) |

The 403 response body uses the key `"error"` with value `"Forbidden"` exactly as specified in Requirements 1.4 and 1.7.

---

## Deployment Considerations

- `npm ci` in `nixpacks.toml` ensures reproducible installs from `package-lock.json`
- Migrations run before `server.listen()`, so Railway health checks only pass after the schema is ready
- The `SequelizeMeta` table created by Umzug persists across deployments; re-deploys are safe
- `compression` middleware reduces Railway egress costs for JSON-heavy dashboard responses
- The `uploads/` directory is ephemeral on Railway (no persistent volume by default); the `mkdirSync` call ensures it exists on each cold start

---
## Testing Strategy

### Dual Testing Approach

**Unit / integration tests (example-based)** cover specific scenarios with concrete inputs:
- Auth routes: valid signup returns 201 + token; duplicate email returns 400; invalid password returns 401
- Project routes: unauthenticated returns 401; non-admin member sees only their projects; admin sees all; non-admin POST returns 403
- Task routes: unauthenticated returns 401; non-member GET with projectId returns 403; non-member PUT returns 403
- Dashboard route: authenticated user receives response with `tasksByStatus`, `totalTasks`, `projectCount`, `teamSize`
- Migration idempotence: run `umzug.up()` twice, assert no error and schema unchanged

**Property-based tests** validate universal invariants across generated inputs:
- Membership enforcement: generate random user/project/membership combinations, assert 403 for non-members and 200 for members
- Result set scoping: generate tasks across multiple projects, assert returned tasks only belong to member projects
- Dashboard count correctness: generate task sets with known status distributions, assert `tasksByStatus.todo` equals actual count
- TaskDetailPanel payload: generate random status/assignee values, assert `onSave` receives the updated values

### Test Environment

All backend tests use an in-memory SQLite database (`storage: ':memory:'`) via `sequelize.sync({ force: true })` in `beforeAll`. This ensures:
- Tests are isolated from the development `database.sqlite` file
- Each test suite starts with a clean schema
- No cleanup of persistent state is required

### Test Configuration

```json
// backend/package.json
{
  "scripts": {
    "test": "jest --forceExit"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.js"]
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  }
}
```

The `--forceExit` flag ensures Jest exits after all tests complete, preventing the process from hanging on open Sequelize connections or Socket.IO handles.

### CI Integration

The existing `.github/workflows/deploy.yml` can add a test step before deployment:

```yaml
- name: Run backend tests
  working-directory: backend
  run: npm ci && npm test
```

A non-zero exit from `npm test` (any failing assertion) will block the deployment step.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property reflection:** After reviewing all testable criteria, the following consolidations were made:
- Requirements 1.1 and 1.3 (membership check on GET tasks with projectId, and on PUT tasks) share the same invariant and are combined into Property 1.
- Requirements 1.2 and 1.5 (filtered task list and filtered project list for non-admin users) are both "result set containment" properties and are expressed as separate properties since they cover different resources.
- Requirements 4.1 and 4.2 (todo count in stat card and pie chart) are the same computation applied to two rendering targets; they are combined into Property 5.
- Requirement 2.7 (idempotent migration runner) stands alone as Property 4.
- Requirements 3.3 and 3.4 (Cache-Control header and compression) are independent universal properties kept separate.
- Requirement 4.9 (TaskDetailPanel save payload) is a data-flow property kept as Property 8.

---

### Property 1: Membership check enforced on task access and mutation

*For any* authenticated non-admin user and any task endpoint (`GET /api/tasks?projectId=X` or `PUT /api/tasks/:id`), if the user is not a member of the project that owns the requested tasks, the API SHALL return HTTP 403 with `{ "error": "Forbidden" }`.

**Validates: Requirements 1.1, 1.3, 1.4**

---

### Property 2: Task list is scoped to member projects

*For any* authenticated non-admin user, every task returned by `GET /api/tasks` (without a `projectId` filter) SHALL have a `projectId` that belongs to a project of which the user is a member. No task from a non-member project SHALL appear in the response.

**Validates: Requirements 1.2**

---

### Property 3: Project list is scoped to member projects

*For any* authenticated non-admin user, every project returned by `GET /api/projects` SHALL be a project of which the user is a member. No project the user does not belong to SHALL appear in the response. An admin user SHALL receive all projects.

**Validates: Requirements 1.5, 1.6, 1.7**

---

### Property 4: Migration runner is idempotent

*For any* database state where all migrations have already been applied, running `umzug.up()` again SHALL complete without error and SHALL NOT alter the existing schema or data.

**Validates: Requirements 2.7**

---

### Property 5: Dashboard "To Do" count matches actual task status

*For any* set of tasks returned by `GET /api/dashboard`, the `tasksByStatus.todo` value SHALL equal the count of tasks whose `status` field is exactly `"todo"`, and the pie chart "To Do" slice SHALL use this same value.

**Validates: Requirements 4.1, 4.2**

---

### Property 6: Cache-Control header present on all attachment responses

*For any* valid authenticated request to `GET /api/attachments/:filename` that resolves to an existing file, the response SHALL include a `Cache-Control` header with the value `"public, max-age=31536000, immutable"`.

**Validates: Requirements 3.3**

---

### Property 7: Compression applied to large JSON responses

*For any* API response with a JSON body larger than 1 KB, when the client sends `Accept-Encoding: gzip`, the response SHALL include `Content-Encoding: gzip` and the response body SHALL be gzip-compressed.

**Validates: Requirements 3.4**

---

### Property 8: TaskDetailPanel save payload reflects inline edits

*For any* task displayed in `TaskDetailPanel`, after the user changes the `status` select to any valid status value and/or changes the `assignedTo` select to any valid user, clicking "Save changes" SHALL invoke `onSave` with a payload containing the updated `status` and `assignedTo` values — not the original values from when the panel was opened.

**Validates: Requirements 4.7, 4.8, 4.9**

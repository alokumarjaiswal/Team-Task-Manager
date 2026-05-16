# Implementation Plan: Production Readiness

## Overview

This plan converts the Team Task Manager into a production-ready application across five areas: database migrations (umzug v3), authorization enforcement, backend build quality, frontend bug fixes, and test infrastructure. Tasks are ordered so each step builds on the previous, with no orphaned code.

## Tasks

- [x] 1. Set up Sequelize migration system with umzug v3
  - Install `umzug` as a dependency in `backend/package.json`
  - Create `backend/migrations/runner.js` that exports `createMigrationRunner(sequelize)` returning a configured Umzug instance with `SequelizeStorage` and glob-resolved migration files from the same directory
  - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [x] 1.1 Create migration files for Users, Projects, and ProjectMembers tables
    - Create `backend/migrations/001-create-users.js` — `Users` table with `_id`, `name`, `email` (UNIQUE), `password`, `role`, `createdAt`, `updatedAt`
    - Create `backend/migrations/002-create-projects.js` — `Projects` table with all columns and FK `createdBy → Users._id`
    - Create `backend/migrations/003-create-project-members.js` — `ProjectMembers` table with FK `projectId → Projects._id`, FK `userId → Users._id`, and INDEX on `userId`
    - Each file exports `{ up(queryInterface), down(queryInterface) }` using `DataTypes` from sequelize; compatible with both SQLite and PostgreSQL dialects
    - _Requirements: 2.1, 2.3, 2.6_

  - [x] 1.2 Create migration files for Tasks, ActivityLogs, Comments, and Attachments tables
    - Create `backend/migrations/004-create-tasks.js` — `Tasks` table with FK `projectId → Projects._id` ON DELETE CASCADE, FK `assignedTo → Users._id`, and INDEX on `projectId`
    - Create `backend/migrations/005-create-activity-logs.js` — `ActivityLogs` table with FK `userId → Users._id`, FK `taskId → Tasks._id`
    - Create `backend/migrations/006-create-comments.js` — `Comments` table with FK `userId → Users._id`, FK `taskId → Tasks._id` ON DELETE CASCADE
    - Create `backend/migrations/007-create-attachments.js` — `Attachments` table with FK `userId → Users._id`, FK `taskId → Tasks._id` ON DELETE CASCADE
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [ ]* 1.3 Write property test for migration idempotence
    - **Property 4: Migration runner is idempotent**
    - **Validates: Requirements 2.7**
    - In `backend/__tests__/migrations.test.js`, call `umzug.up()` twice against an in-memory SQLite instance and assert no error is thrown and the schema is unchanged after the second run

- [ ] 2. Integrate migration runner into server startup and apply backend build quality fixes
  - [x] 2.1 Wire migration runner into `backend/server.js` startup sequence
    - Import `createMigrationRunner` from `./migrations/runner` in `backend/server.js`
    - In `startServer()`, call `await umzug.up()` before `server.listen()`
    - Remove the existing `sequelize.sync()` call (both development and production now use migrations)
    - Export `{ app }` at the bottom of `server.js` behind a `require.main === module` guard so Supertest can import the app without starting the server
    - _Requirements: 2.2, 2.3_

  - [ ] 2.2 Add uploads directory creation and compression middleware to `backend/server.js`
    - Add `fs.mkdirSync(UPLOADS_DIR, { recursive: true })` in `startServer()` after migrations and before `server.listen()`
    - Install `compression` npm package and add it to `dependencies` in `backend/package.json`
    - Register `app.use(compression({ threshold: 1024 }))` after `helmet`/`cors` and before route registration
    - _Requirements: 3.2, 3.4_

  - [ ] 2.3 Add `Cache-Control` header to the attachments route in `backend/server.js`
    - In the `GET /api/attachments/:filename` handler, add `res.set('Cache-Control', 'public, max-age=31536000, immutable')` before `res.sendFile()`
    - _Requirements: 3.3_

  - [x] 2.4 Fix `backend/nixpacks.toml` to use `npm ci`
    - Change the install phase command from `npm install` to `npm ci` in `backend/nixpacks.toml`
    - _Requirements: 3.1_

  - [ ]* 2.5 Write property test for Cache-Control header on attachment responses
    - **Property 6: Cache-Control header present on all attachment responses**
    - **Validates: Requirements 3.3**
    - In `backend/__tests__/tasks.test.js` or a dedicated file, assert that a valid authenticated GET to `/api/attachments/:filename` returns a `Cache-Control` header with value `"public, max-age=31536000, immutable"`

  - [ ]* 2.6 Write property test for compression on large JSON responses
    - **Property 7: Compression applied to large JSON responses**
    - **Validates: Requirements 3.4**
    - Assert that a response with a JSON body larger than 1 KB, when the client sends `Accept-Encoding: gzip`, includes `Content-Encoding: gzip`

- [ ] 3. Checkpoint — Ensure migration runner and server startup work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement `requireProjectMember` authorization middleware
  - [ ] 4.1 Add `requireProjectMember` factory to `backend/middleware/auth.js`
    - Import `ProjectMembers` model (from `../models/Project` or `../models/index`)
    - Export `requireProjectMember(getProjectId)` — an async middleware factory that: bypasses for `req.user.role === 'admin'`; calls `getProjectId(req)` to resolve the project ID; queries `ProjectMembers` for a matching `{ projectId, userId: req.user._id }` row; returns `res.status(403).json({ error: 'Forbidden' })` if no row found; otherwise calls `next()`
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 4.2 Write property test for membership enforcement on task endpoints
    - **Property 1: Membership check enforced on task access and mutation**
    - **Validates: Requirements 1.1, 1.3, 1.4**
    - In `backend/__tests__/tasks.test.js`, for both `GET /api/tasks?projectId=X` and `PUT /api/tasks/:id`, assert that a non-member user receives HTTP 403 with `{ "error": "Forbidden" }` and that a member user receives HTTP 200

- [ ] 5. Apply authorization enforcement to task and project routes
  - [ ] 5.1 Enforce membership on `GET /api/tasks` in `backend/routes/tasks.js`
    - Import `requireProjectMember` from `../middleware/auth`
    - Add `requireProjectMember(req => req.query.projectId || null)` middleware to the `GET /` route after `auth`
    - When `projectId` is absent, update the handler to filter tasks to only those whose `projectId` belongs to a project the authenticated user is a member of (mirror the dashboard query logic)
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 5.2 Enforce membership on `PUT /api/tasks/:id` in `backend/routes/tasks.js`
    - Add a pre-load middleware before `requireProjectMember` that fetches the task by `req.params.id`, attaches it as `req.task`, and returns 404 if not found
    - Add `requireProjectMember(req => req.task.projectId)` after the pre-load middleware
    - Update the PUT handler to use `req.task` instead of re-fetching
    - _Requirements: 1.3, 1.4_

  - [ ] 5.3 Enforce membership on `GET /api/projects` and `GET /api/projects/:id` in `backend/routes/projects.js`
    - In `GET /`, add a branch: if `req.user.role === 'admin'` return all projects; otherwise filter with a `members` include where `_id: req.user._id`
    - In `GET /:id`, after fetching the project, check `ProjectMembers` for `{ projectId: project._id, userId: req.user._id }` and return 403 if not found (skip for admins)
    - _Requirements: 1.5, 1.6, 1.7_

  - [ ]* 5.4 Write property test for project list scoping
    - **Property 3: Project list is scoped to member projects**
    - **Validates: Requirements 1.5, 1.6, 1.7**
    - In `backend/__tests__/projects.test.js`, seed two projects and add the test user as a member of only one; assert `GET /api/projects` returns exactly one project for the member user and both projects for an admin user

  - [ ]* 5.5 Write property test for task list scoping
    - **Property 2: Task list is scoped to member projects**
    - **Validates: Requirements 1.2**
    - In `backend/__tests__/tasks.test.js`, seed tasks across two projects and add the test user as a member of only one; assert `GET /api/tasks` (no `projectId` param) returns only tasks from the member project

- [ ] 6. Checkpoint — Ensure authorization tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Fix `Team.jsx` to use `api.js` service module
  - [x] 7.1 Add `userAPI.setRole` method to `frontend/src/services/api.js`
    - Add `setRole: (id, role) => api.put(\`/users/${id}/role\`, { role })` to the `userAPI` export object
    - _Requirements: 3.5_

  - [ ] 7.2 Migrate `frontend/src/pages/Team.jsx` off direct axios imports
    - Remove `import axios from 'axios'` and any `import API_URL` / config imports used only for axios calls
    - Replace `axios.post(...)` for signup with `authAPI.signup({ name, email, password })`
    - Replace `axios.put(...)` for role promotion with `userAPI.setRole(newUser._id, 'admin')`
    - Import `authAPI` and `userAPI` from `../services/api`
    - _Requirements: 3.5_

- [ ] 8. Fix Dashboard to use correct "To Do" count and dashboard endpoint
  - [ ] 8.1 Refactor `frontend/src/pages/Dashboard.jsx` data fetching
    - Replace the multi-call `Promise.all([taskAPI.getAll(), projectAPI.getAll(), activityAPI.getAll(), userAPI.getAll()])` pattern with a single `dashboardAPI.get()` call (plus `userAPI.getAll()` for avatar lookups)
    - Destructure `{ tasksByStatus, totalTasks, projectCount, teamSize, overdueTasks, tasksByProject, recentActivity }` from the dashboard response
    - Remove the `tasks` and `projects` local state arrays that were populated from the individual list endpoints
    - _Requirements: 4.3_

  - [ ] 8.2 Fix "To Do" count computation and pie chart data in `frontend/src/pages/Dashboard.jsx`
    - Derive counts as: `todoCount = tasksByStatus.todo ?? 0`, `inProgressCount = tasksByStatus['in-progress'] ?? 0`, `doneCount = tasksByStatus.done ?? 0`
    - Replace the buggy `totalTasks - completedTasks - pendingTasks` formula with `todoCount`
    - Update the pie chart data array to use `todoCount`, `inProgressCount`, `doneCount` as the `value` fields for the "To Do", "In Progress", and "Done" slices respectively
    - Update all stat card displays to use these derived counts
    - _Requirements: 4.1, 4.2_

  - [ ]* 8.3 Write property test for dashboard "To Do" count correctness
    - **Property 5: Dashboard "To Do" count matches actual task status**
    - **Validates: Requirements 4.1, 4.2**
    - In `backend/__tests__/dashboard.test.js`, seed tasks with known status distributions and assert that `tasksByStatus.todo` in the `GET /api/dashboard` response equals the exact count of tasks with `status === 'todo'`

- [ ] 9. Fix TopNav avatar dropdown and FilterBar outside-click
  - [ ] 9.1 Add avatar dropdown to `frontend/src/components/layout/TopNav.jsx`
    - Add `open` state (`useState(false)`) and `menuRef` (`useRef(null)`)
    - Add a `useEffect` that attaches a `mousedown` listener to `document` when `open` is true, calling `setOpen(false)` when the click target is outside `menuRef.current`; clean up the listener on effect teardown
    - Replace the direct `onLogout()` call on the avatar button with `setOpen(v => !v)` and add `aria-haspopup="true"` and `aria-expanded={open}` attributes
    - Render a dropdown panel when `open` is true, containing the user's name and a "Logout" button that calls `setOpen(false); onLogout()`
    - _Requirements: 4.4, 4.5_

  - [ ] 9.2 Add outside-click handler to `frontend/src/components/project/FilterBar.jsx`
    - Add `actionsRef` (`useRef(null)`) attached to the `filter-bar__actions` container div
    - Add a `useEffect` that attaches a `mousedown` listener to `document` when `openMenu` is non-null, calling `setOpenMenu(null)` when the click target is outside `actionsRef.current`; clean up the listener on effect teardown
    - _Requirements: 4.6_

- [ ] 10. Add inline status and assignee selects to TaskDetailPanel
  - [ ] 10.1 Add inline `<select>` elements for status and assignee in `frontend/src/components/task/TaskDetailPanel.jsx`
    - Inside the editor section, add a `<label>` + `<select>` for `status` with options `todo`, `in-progress`, `done`; bind `value` to `draft?.status || 'todo'` and `onChange` to `setDraft({ ...draft, status: e.target.value })`
    - Add a `<label>` + `<select>` for `assignedTo`; bind `value` to `draft?.assignedTo ?? ''` and `onChange` to `setDraft({ ...draft, assignedTo: e.target.value ? Number(e.target.value) : null })`; populate options from the `users` prop with an "Unassigned" option at the top
    - Verify that `draft` is initialized by spreading all task fields (including `status` and `assignedTo`) so `onSave(draft)` automatically includes the updated values
    - _Requirements: 4.7, 4.8, 4.9_

  - [ ]* 10.2 Write property test for TaskDetailPanel save payload
    - **Property 8: TaskDetailPanel save payload reflects inline edits**
    - **Validates: Requirements 4.7, 4.8, 4.9**
    - Using a React testing library or fast-check, generate random valid `status` and `assignedTo` values, simulate user selection in the selects, click "Save changes", and assert `onSave` was called with the updated values

- [ ] 11. Set up test infrastructure and write backend test suite
  - [x] 11.1 Configure Jest and Supertest in `backend/package.json`
    - Add `"jest": "^29.7.0"` and `"supertest": "^7.0.0"` to `devDependencies`
    - Set the `"test"` script to `"jest --forceExit"`
    - Add a `"jest"` config block: `{ "testEnvironment": "node", "testMatch": ["**/__tests__/**/*.test.js"] }`
    - _Requirements: 5.1, 5.2_

  - [ ] 11.2 Create test setup helper at `backend/__tests__/helpers/setup.js`
    - Export `makeToken(user, secret)` — signs a JWT with `{ _id, role }` using `jsonwebtoken`
    - Export `createTestApp()` — sets `process.env.NODE_ENV = 'test'` and `process.env.JWT_SECRET = 'test-secret'`, then requires `../server` and returns `{ app, sequelize }`; uses `sequelize.sync({ force: true })` to initialize an in-memory SQLite DB
    - _Requirements: 5.9_

  - [ ] 11.3 Write auth route tests in `backend/__tests__/auth.test.js`
    - `POST /api/auth/signup`: valid input returns HTTP 201 with a `token` property; duplicate email returns HTTP 400
    - `POST /api/auth/login`: valid credentials return HTTP 200 with a `token`; wrong password returns HTTP 401; unknown email returns HTTP 401
    - Use `beforeAll` to sync the in-memory DB; use `afterAll` to close the Sequelize connection
    - _Requirements: 5.3_

  - [ ] 11.4 Write project route tests in `backend/__tests__/projects.test.js`
    - `GET /api/projects`: unauthenticated request returns HTTP 401; authenticated member receives only their projects (not projects they don't belong to)
    - `POST /api/projects`: non-admin user receives HTTP 403; admin user can create a project and receives HTTP 201
    - Seed a member user, an admin user, and two projects (member belongs to one) in `beforeAll`
    - _Requirements: 5.4, 5.5_

  - [ ] 11.5 Write task route tests in `backend/__tests__/tasks.test.js`
    - `GET /api/tasks`: unauthenticated request returns HTTP 401; member requesting tasks with a `projectId` they don't belong to returns HTTP 403
    - `PUT /api/tasks/:id`: member attempting to update a task in a project they don't belong to returns HTTP 403
    - Seed a member user, two projects, and tasks in `beforeAll`
    - _Requirements: 5.6, 5.7_

  - [ ] 11.6 Write dashboard route tests in `backend/__tests__/dashboard.test.js`
    - `GET /api/dashboard`: authenticated user receives a response containing the keys `tasksByStatus`, `totalTasks`, `projectCount`, and `teamSize`
    - Seed at least one user, one project, and one task in `beforeAll`
    - _Requirements: 5.8_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests validate universal correctness invariants; unit/integration tests validate specific scenarios
- The migration runner replaces `sequelize.sync()` entirely — both SQLite (dev) and PostgreSQL (prod) go through migrations
- `server.js` must export `{ app }` behind a `require.main === module` guard before test tasks can run

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.4", "7.1", "11.1"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "7.2"] },
    { "id": 3, "tasks": ["2.5", "2.6", "4.2", "5.1", "5.2", "5.3", "11.2"] },
    { "id": 4, "tasks": ["5.4", "5.5", "8.1", "9.1", "9.2", "10.1", "11.3"] },
    { "id": 5, "tasks": ["8.2", "10.2", "11.4", "11.5"] },
    { "id": 6, "tasks": ["8.3", "11.6"] }
  ]
}
```

# Requirements Document

## Introduction

This document defines the production-readiness requirements for the Team Task Manager application. The scope covers five areas: authorization enforcement, database integrity and migrations, backend quality improvements, frontend bug fixes, and test infrastructure. No new product features are introduced — all requirements address existing defects, missing safeguards, or gaps that prevent the application from running reliably in a production environment.

## Glossary

- **API**: The Express.js REST backend running on the `/api` path prefix.
- **Authorization Middleware**: The `auth` and `adminAuth` functions in `backend/middleware/auth.js`.
- **Dashboard**: The `GET /api/dashboard` route and the `Dashboard.jsx` frontend page.
- **FilterBar**: The `FilterBar.jsx` component that renders filter, sort, and group-by menus in the project workspace.
- **Migration**: A Sequelize migration file that applies a schema change idempotently.
- **Project**: A record in the `Projects` table; identified by `_id`.
- **ProjectMembers**: The join table linking Users to Projects.
- **Sequelize**: The ORM used by the backend for database access.
- **Task**: A record in the `Tasks` table; identified by `_id`.
- **TaskDetailPanel**: The `TaskDetailPanel.jsx` slide-over component that displays and edits a single task.
- **TopNav**: The `TopNav.jsx` header component that contains the user avatar button.
- **User**: A record in the `Users` table; identified by `_id` and carrying a `role` field of either `"admin"` or `"member"`.
- **api.js**: The Axios service module at `frontend/src/services/api.js`.
- **serve.js**: The Node.js static file server at `frontend/serve.js` used for Railway deployment.
- **nixpacks.toml**: The Nixpacks build configuration file at `backend/nixpacks.toml`.

---

## Requirements

### Requirement 1: Project-Membership Authorization

**User Story:** As a security-conscious operator, I want all task and project endpoints to enforce project-membership checks, so that users cannot read or modify data belonging to projects they are not members of.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/tasks` with a `projectId` query parameter, THE API SHALL verify that the authenticated User is a member of the specified Project before returning tasks, unless the User's role is `"admin"`.

2. WHEN a request is made to `GET /api/tasks` without a `projectId` query parameter, THE API SHALL return only tasks whose `projectId` belongs to a Project of which the authenticated User is a member, unless the User's role is `"admin"`.

3. WHEN a request is made to `PUT /api/tasks/:id`, THE API SHALL verify that the authenticated User is a member of the Project that owns the Task before applying the update, unless the User's role is `"admin"`.

4. IF the authenticated User is not a member of the relevant Project and the User's role is not `"admin"`, THEN THE API SHALL return HTTP 403 with a JSON body containing the key `"error"` set to `"Forbidden"`.

5. WHEN a request is made to `GET /api/projects`, THE API SHALL return only Projects of which the authenticated User is a member, unless the User's role is `"admin"`, in which case THE API SHALL return all Projects.

6. WHEN a request is made to `GET /api/projects/:id`, THE API SHALL verify that the authenticated User is a member of the requested Project before returning it, unless the User's role is `"admin"`.

7. IF the authenticated User requests a Project to which the User does not belong and the User's role is not `"admin"`, THEN THE API SHALL return HTTP 403 with a JSON body containing the key `"error"` set to `"Forbidden"`.

---

### Requirement 2: Database Integrity and Migrations

**User Story:** As a DevOps engineer, I want the database schema to be managed by versioned migration files that run automatically on startup, so that schema changes are applied consistently across SQLite (development) and PostgreSQL (production) environments.

#### Acceptance Criteria

1. THE API SHALL include Sequelize migration files in `backend/migrations/` that create the `Users`, `Projects`, `ProjectMembers`, `Tasks`, `ActivityLogs`, `Comments`, and `Attachments` tables with all columns, constraints, and indexes defined in the current Sequelize models.

2. WHEN the API process starts, THE API SHALL execute all pending Sequelize migrations before accepting HTTP requests.

3. THE migration runner SHALL be compatible with both the `sqlite` dialect (when `DATABASE_URL` is absent) and the `postgres` dialect (when `DATABASE_URL` is present).

4. THE `Tasks` table migration SHALL define a foreign key from `Tasks.projectId` to `Projects._id` with `ON DELETE CASCADE`, so that deleting a Project automatically deletes all associated Tasks.

5. THE `Tasks` table migration SHALL define a database index on the `Tasks.projectId` column.

6. THE `ProjectMembers` table migration SHALL define a database index on the `ProjectMembers.userId` column.

7. IF a migration has already been applied, THEN THE migration runner SHALL skip that migration without error.

---

### Requirement 3: Backend Build and Runtime Quality

**User Story:** As a DevOps engineer, I want the backend build configuration and runtime setup to follow production best practices, so that deployments are reproducible and the server starts correctly in all environments.

#### Acceptance Criteria

1. THE `backend/nixpacks.toml` install phase SHALL use the command `npm ci` instead of `npm install`, so that dependencies are installed from the lock file.

2. WHEN the API process starts, THE API SHALL create the `backend/uploads/` directory if it does not already exist, before the HTTP server begins accepting requests.

3. WHEN the API serves a response for a static asset route (e.g., `GET /api/attachments/:filename`), THE API SHALL include a `Cache-Control` response header with a value of `"public, max-age=31536000, immutable"`.

4. THE API SHALL apply HTTP response compression (gzip or brotli) to all JSON and text responses with a body size greater than 1 KB.

5. THE `Team.jsx` frontend component SHALL use the `api.js` service module for all HTTP requests, replacing all direct `axios` imports and calls.

---

### Requirement 4: Frontend Bug Fixes

**User Story:** As a user, I want the dashboard statistics, pie chart, avatar menu, and filter bar to work correctly, so that I can trust the data I see and navigate the application without unexpected behavior.

#### Acceptance Criteria

1. WHEN the Dashboard page renders the "To Do" count in the Task Distribution panel, THE Dashboard SHALL compute the "To Do" value as the count of tasks whose `status` field equals `"todo"`, not as `totalTasks - completedTasks - pendingTasks`.

2. WHEN the Dashboard page renders the pie chart, THE Dashboard SHALL use the count of tasks with `status === "todo"` as the value for the "To Do" slice, so that the slice is non-zero whenever such tasks exist.

3. WHEN the Dashboard page fetches task and project data, THE Dashboard SHALL use the paginated `GET /api/dashboard` endpoint to obtain pre-aggregated counts, so that the displayed totals reflect all records and not only the first page returned by the individual task and project list endpoints.

4. WHEN a user clicks the avatar button in TopNav, THE TopNav SHALL display a dropdown menu containing at minimum a "Logout" option and a display of the current user's name, instead of immediately triggering logout.

5. WHEN the dropdown menu in TopNav is open and the user clicks outside the menu, THE TopNav SHALL close the dropdown menu.

6. WHEN a FilterBar dropdown menu is open and the user clicks outside the FilterBar component, THE FilterBar SHALL close the open menu.

7. WHEN the TaskDetailPanel is open, THE TaskDetailPanel SHALL display an inline `<select>` element for the task `status` field, pre-populated with the current status value, allowing the user to change the status without navigating away.

8. WHEN the TaskDetailPanel is open and the task has an `assignedTo` value, THE TaskDetailPanel SHALL display an inline `<select>` element for the assignee field, pre-populated with the current assignee, allowing the user to reassign the task without navigating away.

9. WHEN the user changes the status or assignee inline in TaskDetailPanel and clicks "Save changes", THE TaskDetailPanel SHALL include the updated `status` and `assignedTo` values in the payload passed to `onSave`.

---

### Requirement 5: Test Infrastructure and CI

**User Story:** As a developer, I want a complete backend test suite and a working `npm test` script, so that CI pipelines pass and regressions are caught automatically.

#### Acceptance Criteria

1. THE backend `package.json` `"test"` script SHALL invoke Jest with the `--forceExit` flag so that the process exits with code 0 after all tests pass.

2. THE backend SHALL include Jest and Supertest as `devDependencies` in `package.json`.

3. THE backend test suite SHALL include tests for the `POST /api/auth/signup` and `POST /api/auth/login` routes, verifying that valid credentials return HTTP 200 with a JWT token and that invalid credentials return HTTP 400 or HTTP 401.

4. THE backend test suite SHALL include tests for the `GET /api/projects` route, verifying that an unauthenticated request returns HTTP 401 and that an authenticated member receives only projects the member belongs to.

5. THE backend test suite SHALL include tests for the `POST /api/projects` route, verifying that a non-admin user receives HTTP 403 and that an admin user can create a project.

6. THE backend test suite SHALL include tests for the `GET /api/tasks` route, verifying that an unauthenticated request returns HTTP 401 and that a member cannot retrieve tasks from a project the member does not belong to.

7. THE backend test suite SHALL include tests for the `PUT /api/tasks/:id` route, verifying that a member cannot update a task in a project the member does not belong to and receives HTTP 403.

8. THE backend test suite SHALL include tests for the `GET /api/dashboard` route, verifying that an authenticated user receives a response containing the keys `tasksByStatus`, `totalTasks`, `projectCount`, and `teamSize`.

9. WHEN the test suite runs, THE test runner SHALL use an in-memory SQLite database so that tests do not modify the development or production database.

10. IF any test assertion fails, THEN THE `npm test` command SHALL exit with a non-zero exit code so that CI pipelines correctly report the failure.

# Requirements Document

## Introduction

This document specifies the requirements for fixing all identified security vulnerabilities and bugs in the Team Task Manager codebase. The fixes are grouped into four priority tiers — Critical, High, Medium, and Low — and cover the backend (Node.js/Express/Sequelize) and frontend (React/Vite). The goal is to eliminate privilege-escalation vectors, input-validation gaps, unsafe file handling, information-disclosure risks, data-integrity bugs, and dead/broken UI code without altering the application's intended feature set.

---

## Glossary

- **System**: The Team Task Manager application (backend API + React frontend).
- **Auth Service**: The Express routes and middleware in `backend/routes/auth.js` and `backend/middleware/auth.js`.
- **Validate Middleware**: The Joi-based `backend/middleware/validate.js` middleware.
- **Upload Handler**: The multer configuration in `backend/routes/tasks.js`.
- **Attachment Endpoint**: The dedicated Express route that serves uploaded files.
- **Config Module**: `backend/config/index.js`, the single source of truth for environment variables.
- **Dashboard Route**: `backend/routes/dashboard.js`.
- **Activities Endpoint**: The `GET /api/activities` handler in `backend/server.js`.
- **Email Utility**: `backend/utils/email.js`.
- **DB Module**: `backend/models/index.js`.
- **Socket Context**: A shared React context/singleton that wraps a single Socket.IO client connection.
- **useAuth Hook**: `frontend/src/hooks/useAuth.js`.
- **Admin**: A user whose `role` field equals `"admin"`.
- **Member**: A user whose `role` field equals `"member"`.

---

## Requirements

### Requirement 1: Prevent Self-Assignable Admin Role at Signup (C1)

**User Story:** As a system administrator, I want new user registrations to always default to the `member` role, so that no one can grant themselves admin privileges through the signup form.

#### Acceptance Criteria

1. THE Auth Service SHALL ignore any `role` field present in the signup request body and always create new users with `role = "member"`.
2. THE Auth Service SHALL expose a separate, admin-only `PUT /api/users/:id/role` endpoint that allows an Admin to promote or demote a user's role.
3. WHEN a non-Admin calls `PUT /api/users/:id/role`, THE Auth Service SHALL return HTTP 403.
4. THE frontend Login component SHALL remove the role selector from the signup form.

---

### Requirement 2: Input Validation on Auth Routes (C2)

**User Story:** As a security engineer, I want all auth endpoints to validate incoming payloads, so that malformed or malicious input is rejected before reaching business logic.

#### Acceptance Criteria

1. THE Auth Service SHALL apply the Validate Middleware to `POST /api/auth/signup` using a Joi schema that requires: `name` (string, min 1, max 100, required), `email` (valid email format, required), `password` (string, min 8 characters, required).
2. THE Auth Service SHALL apply the Validate Middleware to `POST /api/auth/login` using a Joi schema that requires: `email` (valid email format, required), `password` (string, min 1, required).
3. WHEN validation fails on either auth route, THE Auth Service SHALL return HTTP 422 with a structured error body listing each failing field.

---

### Requirement 3: Input Validation on Task and Project Routes (C3)

**User Story:** As a security engineer, I want all task and project mutation endpoints to validate payloads, so that oversized or invalid data cannot corrupt the database.

#### Acceptance Criteria

1. THE System SHALL apply the Validate Middleware to `POST /api/tasks` and `PUT /api/tasks/:id` using a Joi schema that enforces: `title` (string, max 200, required on POST), `description` (string, max 2000, optional), `status` (one of `"todo"`, `"in-progress"`, `"done"`, optional).
2. THE System SHALL apply the Validate Middleware to `POST /api/projects` and `PUT /api/projects/:id` using a Joi schema that enforces: `name` (string, max 200, required on POST), `description` (string, max 2000, optional).
3. WHEN validation fails on any task or project mutation, THE System SHALL return HTTP 422 with a structured error body.

---

### Requirement 4: Restricted File Upload (C4)

**User Story:** As a security engineer, I want file uploads to be restricted by type and size, so that attackers cannot upload malicious executables or exhaust disk space.

#### Acceptance Criteria

1. THE Upload Handler SHALL reject any file whose MIME type is not in the whitelist: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
2. THE Upload Handler SHALL enforce a maximum file size of 5 MB per upload.
3. THE Upload Handler SHALL enforce a maximum of 1 file per request.
4. THE Upload Handler SHALL sanitize the stored filename by replacing all characters that are not alphanumeric, hyphens, underscores, or dots with underscores, and prepending a timestamp to ensure uniqueness.
5. WHEN a file is rejected by the filter or size limit, THE Upload Handler SHALL return HTTP 400 with a descriptive error message.

---

### Requirement 5: Path Traversal Prevention for Attachments (C5)

**User Story:** As a security engineer, I want attachment URLs to be safe, so that an attacker cannot use path traversal sequences to read arbitrary files from the server.

#### Acceptance Criteria

1. THE Upload Handler SHALL store only the sanitized filename (not the full filesystem path) in the `Attachment.path` database column.
2. THE System SHALL expose a dedicated `GET /api/attachments/:filename` endpoint that serves attachment files.
3. WHEN `GET /api/attachments/:filename` is called, THE Attachment Endpoint SHALL strip all directory separators and path traversal sequences (`..`, `/`, `\`) from the filename parameter before constructing the filesystem path.
4. IF the resolved filesystem path falls outside the designated uploads directory, THEN THE Attachment Endpoint SHALL return HTTP 400.
5. THE frontend TaskBoard component SHALL construct attachment URLs using the `/api/attachments/:filename` pattern instead of directly referencing `att.path`.

---

### Requirement 6: Centralised JWT Secret (C6)

**User Story:** As a developer, I want all JWT operations to read the secret from the Config Module, so that there is a single source of truth and no risk of divergence.

#### Acceptance Criteria

1. THE Auth Service (`backend/routes/auth.js`) SHALL import `JWT_SECRET` from the Config Module (`config/index.js`) instead of reading `process.env.JWT_SECRET` directly.
2. THE Auth Middleware (`backend/middleware/auth.js`) SHALL import `JWT_SECRET` from the Config Module instead of reading `process.env.JWT_SECRET` directly.
3. THE System SHALL not contain any other direct reads of `process.env.JWT_SECRET` outside the Config Module.

---

### Requirement 7: Scoped Activities Endpoint (C7)

**User Story:** As a security engineer, I want the activities endpoint to enforce role-based access, so that members cannot read activity logs for projects they do not belong to.

#### Acceptance Criteria

1. WHEN an Admin calls `GET /api/activities`, THE Activities Endpoint SHALL return all activity logs.
2. WHEN a Member calls `GET /api/activities`, THE Activities Endpoint SHALL return only activity logs whose associated task belongs to a project of which the Member is a member.
3. THE Activities Endpoint SHALL include the existing `limit: 50` cap on results returned.

---

### Requirement 8: Paginated and Scoped Dashboard (C8)

**User Story:** As a developer, I want the dashboard endpoint to paginate results and scope data to the requesting user, so that it does not perform unbounded full-table scans.

#### Acceptance Criteria

1. THE Dashboard Route SHALL accept optional `limit` (default 20, max 100) and `offset` (default 0) query parameters and apply them to all database queries.
2. WHEN a Member calls `GET /api/dashboard`, THE Dashboard Route SHALL scope task and project data to projects of which the Member is a member.
3. WHEN an Admin calls `GET /api/dashboard`, THE Dashboard Route SHALL return data across all projects.
4. THE Dashboard Route SHALL include `WHERE` clauses on all `findAll` calls rather than loading entire tables into memory.

---

### Requirement 9: Persistent Email Transporter (H1)

**User Story:** As a developer, I want the email utility to create its transporter once at module load, so that a new Ethereal account is not created on every email send.

#### Acceptance Criteria

1. THE Email Utility SHALL initialise the nodemailer transporter once when the module is first loaded, not inside the `sendEmail` function.
2. WHILE `NODE_ENV` equals `"production"`, THE Email Utility SHALL use the SMTP credentials from the Config Module (`config.smtp`).
3. WHILE `NODE_ENV` does not equal `"production"`, THE Email Utility SHALL use an Ethereal test account created once at module load.

---

### Requirement 10: Guarded sequelize.sync() (H2)

**User Story:** As a developer, I want `sequelize.sync()` to be disabled in production, so that the ORM cannot accidentally alter or drop production tables.

#### Acceptance Criteria

1. WHEN `NODE_ENV` equals `"production"`, THE System SHALL skip the `sequelize.sync()` call entirely and proceed directly to starting the HTTP server.
2. WHEN `NODE_ENV` does not equal `"production"`, THE System SHALL call `sequelize.sync()` as before.

---

### Requirement 11: Configurable Database Dialect (H3)

**User Story:** As a developer, I want the DB Module to read dialect and connection settings from the Config Module, so that PostgreSQL can be used in production without code changes.

#### Acceptance Criteria

1. THE DB Module SHALL read `dialect` from `config.db.dialect` and `DATABASE_URL` / `storage` from `config.db`.
2. WHEN `config.db.dialect` equals `"postgres"`, THE DB Module SHALL initialise Sequelize with the `DATABASE_URL` connection string.
3. WHEN `config.db.dialect` equals `"sqlite"`, THE DB Module SHALL initialise Sequelize with the `storage` file path.

---

### Requirement 12: Single-Project Fetch Endpoint (H4)

**User Story:** As a frontend developer, I want a `GET /api/projects/:id` endpoint, so that the ProjectWorkspace page can fetch a single project without loading all projects.

#### Acceptance Criteria

1. THE System SHALL expose `GET /api/projects/:id` that returns the project matching the given ID, including owner and members.
2. IF the project does not exist, THEN THE System SHALL return HTTP 404.
3. THE ProjectWorkspace frontend component SHALL call `GET /api/projects/:id` instead of fetching all projects and filtering client-side.

---

### Requirement 13: Stale Closure Fix in TaskBoard (H5)

**User Story:** As a developer, I want the `useEffect` in TaskBoard that syncs the task details modal to include `showTaskDetailsModal` in its dependency array, so that the effect always operates on the current modal state.

#### Acceptance Criteria

1. THE TaskBoard component's `useEffect` that updates `showTaskDetailsModal` when `tasks` changes SHALL list `showTaskDetailsModal` in its dependency array.

---

### Requirement 14: Optimistic Update Rollback (H6)

**User Story:** As a user, I want failed task status updates to revert the board to its previous state and show an error, so that the UI never displays incorrect data after a network failure.

#### Acceptance Criteria

1. WHEN `updateTaskStatus` is called in TaskBoard, THE TaskBoard component SHALL capture the previous task list state before applying the optimistic update.
2. IF the API call in `updateTaskStatus` fails, THEN THE TaskBoard component SHALL restore the previous task list state and display an error toast.

---

### Requirement 15: ProjectHeader Save Handler (H7)

**User Story:** As a user, I want edits to the project title in the ProjectHeader to be saved to the server, so that changes are not silently lost on navigation.

#### Acceptance Criteria

1. THE ProjectHeader component SHALL add an `onBlur` handler to the `contentEditable` title element that calls the update-project API with the new name.
2. WHEN the save API call is in progress, THE ProjectHeader component SHALL display a visual save indicator.
3. IF the save API call fails, THEN THE ProjectHeader component SHALL display an error toast and revert the displayed title to the last saved value.

---

### Requirement 16: Remove alert() Stubs from FilterBar (H8)

**User Story:** As a user, I want filter buttons to either work or be visually disabled, so that clicking them does not produce browser alert dialogs.

#### Acceptance Criteria

1. THE FilterBar component SHALL remove all `alert()` calls from filter button `onClick` handlers.
2. THE FilterBar component SHALL implement functional filtering for the "Assignees" button (filter tasks by selected assignee) and the "Filters" button (filter by status).
3. Filter buttons whose functionality is not yet implemented SHALL be rendered with `disabled` attribute and a `title` tooltip indicating they are coming soon.

---

### Requirement 17: Correct HTTP Status for Invalid Token (H9)

**User Story:** As an API consumer, I want invalid or expired JWT tokens to return HTTP 401, so that clients can distinguish authentication failures from bad requests.

#### Acceptance Criteria

1. WHEN the Auth Middleware catches a JWT verification error, THE Auth Middleware SHALL return HTTP 401 instead of HTTP 400.

---

### Requirement 18: Null-Safe adminAuth Middleware (H10)

**User Story:** As a developer, I want the `adminAuth` middleware to handle the case where `req.user` is undefined, so that the server does not crash with an unhandled TypeError.

#### Acceptance Criteria

1. THE `adminAuth` middleware SHALL check that `req.user` is defined before accessing `req.user.role`.
2. IF `req.user` is undefined when `adminAuth` runs, THEN THE `adminAuth` middleware SHALL return HTTP 401.

---

### Requirement 19: Shared Socket.IO Context (M1)

**User Story:** As a developer, I want all components that use Socket.IO to share a single connection, so that the browser does not open multiple redundant WebSocket connections.

#### Acceptance Criteria

1. THE System SHALL provide a single Socket Context (React context or singleton module) that creates one Socket.IO client connection per browser session.
2. THE Dashboard page, Projects page, and TaskBoard page SHALL consume the Socket Context instead of each calling `io(API_URL)` independently.
3. WHEN the last consumer unmounts, THE Socket Context SHALL disconnect the shared socket.

---

### Requirement 20: Remove Math.random() from Chart Data (M2)

**User Story:** As a user, I want dashboard charts to display only real data, so that the charts are accurate and not misleading.

#### Acceptance Criteria

1. THE Dashboard page SHALL remove all `Math.random()` calls from chart data computation.
2. THE Dashboard page SHALL derive the "Task Activity (7 Days)" chart data solely from `task.createdAt` and `task.updatedAt` timestamps without adding random offsets.

---

### Requirement 21: Safe localStorage Access (M3)

**User Story:** As a developer, I want all localStorage reads to be wrapped in error handling, so that a corrupted stored value does not crash the application.

#### Acceptance Criteria

1. THE System SHALL use the useAuth Hook for reading user and token data in all components that currently call `localStorage.getItem` directly.
2. WHERE the useAuth Hook is not applicable, THE System SHALL wrap `localStorage.getItem` calls in try/catch blocks.

---

### Requirement 22: Re-enable updatedAt on Task Model (M4)

**User Story:** As a developer, I want the Task model to track `updatedAt`, so that sorting by last-updated works correctly and the TableRow component can display the field.

#### Acceptance Criteria

1. THE Task model SHALL have `updatedAt` enabled (the `updatedAt: false` option SHALL be removed).
2. THE Task model SHALL include `updatedAt` in its Sequelize definition with `timestamps: true`.

---

### Requirement 23: Exclude database.sqlite from Version Control (M5)

**User Story:** As a developer, I want the SQLite database file excluded from the repository, so that local development data is not committed.

#### Acceptance Criteria

1. THE `backend/.gitignore` file SHALL contain an entry for `database.sqlite`.

---

### Requirement 24: Keyboard Accessibility for Interactive Elements (M6)

**User Story:** As a keyboard user, I want all interactive `div` and `article` elements with `role="button"` to respond to Enter and Space key presses, so that the application is keyboard accessible.

#### Acceptance Criteria

1. THE System SHALL add `onKeyDown` handlers to all interactive `div` or `article` elements that have `role="button"` or an `onClick` handler but are not native `<button>` elements.
2. THE `onKeyDown` handler SHALL call the element's action when the pressed key is `Enter` or `Space`.

---

### Requirement 25: Remove Unused Variables (M7)

**User Story:** As a developer, I want unused variables removed, so that the codebase is clean and linting passes without warnings.

#### Acceptance Criteria

1. THE ProjectWorkspace component SHALL remove the unused `headers` variable declared inside the `fetchData` function.

---

### Requirement 26: Fix Missing useEffect Dependency (M8)

**User Story:** As a developer, I want all `useEffect` dependency arrays to be complete, so that effects re-run correctly when their dependencies change.

#### Acceptance Criteria

1. THE ProjectWorkspace component's `useEffect` that registers the keyboard shortcut SHALL include `openNewTask` in its dependency array.

---

### Requirement 27: Delete Dead Dashboard Component (L1)

**User Story:** As a developer, I want dead code removed, so that the codebase does not contain unused files that confuse contributors.

#### Acceptance Criteria

1. THE file `frontend/src/components/Dashboard.jsx` SHALL be deleted from the repository.

---

### Requirement 28: Consistent useAuth Hook Usage (L2)

**User Story:** As a developer, I want all components to use the useAuth Hook for authentication state, so that auth logic is centralised and consistent.

#### Acceptance Criteria

1. THE System SHALL replace direct `localStorage.getItem('user')` and `localStorage.getItem('token')` calls in components with the useAuth Hook where feasible.

---

### Requirement 29: Shared GitHubMark SVG Component (L3)

**User Story:** As a developer, I want the GitHubMark SVG extracted into a shared component, so that it is not duplicated across files.

#### Acceptance Criteria

1. THE System SHALL create a shared `GitHubMark` component in `frontend/src/components/shared/GitHubMark.jsx`.
2. THE Login component SHALL import and use the shared `GitHubMark` component.

---

### Requirement 30: Remove Duplicate Assignee Column from TableView (L4)

**User Story:** As a user, I want the task table to show each column only once, so that the table is not confusing.

#### Acceptance Criteria

1. THE TableRow component SHALL display the Assignee information in exactly one column (the read-only display column), and the duplicate editable assignee `<select>` column SHALL be removed or merged.

---

### Requirement 31: Align Task Model with TableRow Columns (L5)

**User Story:** As a developer, I want the Task model and the TableRow component to be consistent, so that columns do not display undefined data.

#### Acceptance Criteria

1. THE System SHALL either add `labels` (array/JSON) and `milestone` (string) fields to the Task model and the task creation/update API, OR remove the `labels` and `milestone` columns from the TableRow component.

---

### Requirement 32: Hide error.message in Production (L6)

**User Story:** As a security engineer, I want raw error messages hidden from API responses in production, so that internal implementation details are not leaked to clients.

#### Acceptance Criteria

1. WHILE `NODE_ENV` equals `"production"`, THE System SHALL not include `error.message` in any API response body.
2. THE existing global error handler in `server.js` already implements this pattern; THE System SHALL apply the same pattern to inline `catch` blocks in route handlers that currently return `res.status(500).json({ error: error.message })`.

---

### Requirement 33: Remove Empty useEffect from Login (L7)

**User Story:** As a developer, I want empty or no-op `useEffect` calls removed, so that the code does not contain misleading dead code.

#### Acceptance Criteria

1. THE Login component SHALL remove the `useEffect` whose cleanup function is empty and whose body contains no logic.

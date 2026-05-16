# Implementation Plan: Codebase Security & Bug Fixes

## Overview

Refreshed after full end-to-end codebase verification (June 2026). All items marked `[x]` have been confirmed present in the actual source files. Items marked `[ ]` are verified as still missing and need to be implemented.

---

## Tasks

### ── CRITICAL ──────────────────────────────────────────────────────────────

- [x] 1. Fix self-assignable admin role at signup (C1)
  - [x] 1.1 Remove `role` from signup payload in `backend/routes/auth.js`
    - Destructures only `{ name, email, password }` from `req.body`; hard-codes `role: 'member'` in `User.create`
    - _Requirements: 1.1_
  - [x] 1.3 Add `PUT /api/users/:id/role` admin-only endpoint in `backend/routes/users.js`
    - Protected by `adminAuth` and `validate(roleSchema)`; returns 404 if user not found
    - _Requirements: 1.2, 1.3_
  - [x] 1.5 Remove role selector from `frontend/src/components/Login.jsx`
    - No role state, no role select, no role in signup payload
    - _Requirements: 1.4_

- [x] 2. Add input validation to auth routes (C2)
  - [x] 2.1 Joi schemas applied to auth routes in `backend/routes/auth.js`
    - `signupSchema`: name min 1 max 100, email, password min 8
    - `loginSchema`: email, password min 1
    - Both routes use `validate(schema)` middleware
    - _Requirements: 2.1, 2.2_

- [x] 3. Add input validation to task and project routes (C3)
  - [x] 3.1 Joi schemas applied to task routes in `backend/routes/tasks.js`
    - `taskCreateSchema` and `taskUpdateSchema` with all field constraints including `labels` and `milestone`
    - Applied to `POST /api/tasks` and `PUT /api/tasks/:id`
    - _Requirements: 3.1_
  - [x] 3.2 Joi schemas applied to project routes in `backend/routes/projects.js`
    - `projectCreateSchema` and `projectUpdateSchema`
    - Applied to `POST /api/projects` and `PUT /api/projects/:id`
    - _Requirements: 3.2_

- [x] 4. Restrict file uploads (C4)
  - [x] 4.1 `fileFilter`, `limits`, and `sanitizeFilename` added to multer config in `backend/routes/tasks.js`
    - `ALLOWED_MIME_TYPES` Set with 8 whitelisted types
    - `sanitizeFilename` strips unsafe chars, prepends `Date.now()_`
    - `limits: { fileSize: 5MB, files: 1 }`
    - Multer error handler returns 400
    - _Requirements: 4.1–4.5_

- [x] 5. Prevent path traversal in attachment serving (C5)
  - [x] 5.1 Attachment storage saves only filename (not full path) in `backend/routes/tasks.js`
    - `path: req.file.filename` in `Attachment.create`
    - _Requirements: 5.1_
  - [x] 5.2 `GET /api/attachments/:filename` endpoint in `backend/server.js`
    - `path.basename` + regex strip, `UPLOADS_DIR` prefix check, `auth` middleware
    - _Requirements: 5.2–5.4_
  - [x] 5.4 Attachment URL uses `/api/attachments/` prefix in `frontend/src/pages/TaskBoard.jsx`
    - _Requirements: 5.5_

- [x] 6. Centralise JWT secret (C6)
  - [x] 6.1 Both `backend/routes/auth.js` and `backend/middleware/auth.js` use `config.jwt.secret`
    - _Requirements: 6.1–6.3_

- [x] 7. Scope the activities endpoint (C7)
  - [x] 7.1 Role-based filtering in `GET /api/activities` in `backend/server.js`
    - Admin: all logs; member: only logs for tasks in their projects
    - _Requirements: 7.1–7.3_

- [x] 8. Paginate and scope the dashboard endpoint (C8)
  - [x] 8.1 Pagination and user scoping in `backend/routes/dashboard.js`
    - `limit`/`offset` from query, member project filtering via `ProjectMembers`
    - _Requirements: 8.1–8.4_

- [x] 9. Fix validate middleware not sanitizing req.body (CRITICAL — new)
  - [x] 9.1 Assign `req.body = value` after successful validation in `backend/middleware/validate.js`
    - Change `const { error } = schema.validate(...)` to `const { error, value } = schema.validate(...)`
    - On success, assign `req.body = value` before calling `next()`
    - Without this, `stripUnknown: true` is a no-op — extra fields like `role` still reach route handlers
    - This is the critical defense-in-depth fix for role injection
    - _Requirements: 2.1, 3.1_

- [x] 10. Checkpoint — Critical fixes complete

---

### ── HIGH ──────────────────────────────────────────────────────────────────

- [x] 11. Fix email transporter initialisation (H1)
  - [x] 11.1 `backend/utils/email.js` uses lazy-init `getTransporter()` singleton
    - Production: real SMTP via `config.smtp`; development: Ethereal created once
    - _Requirements: 9.1–9.3_

- [x] 12. Guard sequelize.sync() in production (H2)
  - [x] 12.1 `backend/server.js` only calls `sequelize.sync()` when `NODE_ENV !== 'production'`
    - `startServer()` called directly in production
    - _Requirements: 10.1, 10.2_

- [x] 13. Make database dialect configurable (H3)
  - [x] 13.1 `backend/models/index.js` reads dialect from config module
    - Postgres when `config.db.dialect === 'postgres'` and URL set; otherwise SQLite
    - _Requirements: 11.1–11.3_

- [x] 14. Add single-project fetch endpoint (H4)
  - [x] 14.1 `GET /api/projects/:id` route in `backend/routes/projects.js`
    - Returns 404 if not found, includes owner and members via `formatProject`
    - _Requirements: 12.1, 12.2_
  - [x] 14.2 `frontend/src/services/api.js` has `projectAPI.getById(id)`
    - `ProjectWorkspace` uses `projectAPI.getById(id)` with fallback to `getAll`
    - _Requirements: 12.3, 25.1_

- [x] 15. Fix stale closure in TaskBoard useEffect (H5)
  - [x] 15.1 `showTaskDetailsModal` in dependency array of modal-sync `useEffect` in `TaskBoard.jsx`
    - _Requirements: 13.1_

- [x] 16. Implement optimistic update rollback in TaskBoard (H6)
  - [x] 16.1 `previousTasks` captured before optimistic update; reverted in `catch` in `TaskBoard.jsx`
    - _Requirements: 14.1, 14.2_

- [x] 17. Add save handler to ProjectHeader (H7)
  - [x] 17.1 `onBlur` save logic in `frontend/src/components/project/ProjectHeader.jsx`
    - `saving` state, `lastSavedName` ref, revert on failure, toast feedback
    - _Requirements: 15.1–15.3_

- [x] 18. Replace alert() stubs in FilterBar (H8)
  - [x] 18.1 `frontend/src/components/project/FilterBar.jsx` has functional status/assignee selects
    - Labels, Milestones, Group by, Sort, Fields, View options are functional dropdown menus
    - _Requirements: 16.1–16.3_

- [x] 19. Fix HTTP status codes and null safety in auth middleware (H9, H10)
  - [x] 19.1 Invalid token returns 401 (not 400) in `backend/middleware/auth.js`
    - _Requirements: 17.1_
  - [x] 19.2 `adminAuth` null-checks `req.user` before accessing `.role`
    - _Requirements: 18.1, 18.2_

- [x] 20. Fix Team.jsx sending role in signup payload (HIGH — new)
  - [x] 20.1 Remove `role` from the add-member form and use role promotion endpoint after signup in `frontend/src/pages/Team.jsx`
    - Signup payload sends only name, email, password — role excluded
    - After signup, if admin role selected, calls `PUT /api/users/:id/role` with `{ role: 'admin' }`
    - _Requirements: 1.1, 1.2_

- [x] 21. Fix password minLength mismatch in Team.jsx (HIGH — new)
  - [x] 21.1 Change `minLength={6}` to `minLength={8}` on the password input in `frontend/src/pages/Team.jsx`
    - Server requires `password.min(8)` via Joi; the form currently allows 6-char passwords which fail with a 422 error
    - _Requirements: 2.1_

- [x] 22. Checkpoint — High fixes complete

---

### ── MEDIUM ────────────────────────────────────────────────────────────────

- [x] 23. Shared Socket.IO singleton (M1)
  - [x] 23.1 `frontend/src/services/socket.js` exports `getSocket` / `releaseSocket`
    - Singleton pattern; `releaseSocket` is a no-op to keep connection alive across route changes
    - _Requirements: 19.1_
  - [x] 23.2 `frontend/src/pages/Dashboard.jsx` uses shared socket
    - _Requirements: 19.2, 19.3_
  - [x] 23.3 `frontend/src/pages/TaskBoard.jsx` uses shared socket
    - _Requirements: 19.2, 19.3_

- [x] 24. Remove Math.random() from chart data (M2)
  - [x] 24.1 No `Math.random()` calls in `frontend/src/pages/Dashboard.jsx` chart data
    - Chart derives data solely from `task.createdAt` and `task.updatedAt`
    - _Requirements: 20.1, 20.2_

- [x] 25. Use useAuth hook / centralized api.js (M3)
  - [x] 25.1 `frontend/src/pages/TaskBoard.jsx` uses `useAuth` for current user
    - _Requirements: 21.1_
  - [x] 25.2 Migrate remaining raw `axios` + `localStorage.getItem('token')` calls to `api.js`
    - `frontend/src/pages/Dashboard.jsx`: migrated to `taskAPI`, `projectAPI`, `activityAPI`, `userAPI`
    - `frontend/src/pages/Projects.jsx`: migrated to `projectAPI.*` and `taskAPI.getAll()`
    - `frontend/src/pages/TaskBoard.jsx`: migrated to `taskAPI.*`, `projectAPI.getAll()`, `userAPI.getAll()`
    - `frontend/src/pages/Team.jsx`: signup uses explicit payload (no role); role promotion via axios with token
    - All `localStorage.getItem('token')` calls removed from these files after migration
    - _Requirements: 21.1, 21.2_

- [x] 26. Re-enable updatedAt on Task model (M4)
  - [x] 26.1 `backend/models/Task.js` has `timestamps: true` with no `updatedAt: false`
    - _Requirements: 22.1, 22.2_

- [x] 27. Exclude database.sqlite from version control (M5)
  - [x] 27.1 `backend/.gitignore` contains `database.sqlite` and `*.sqlite`
    - _Requirements: 23.1_

- [x] 28. Add keyboard accessibility to interactive elements (M6)
  - [x] 28.1 Add `onKeyDown`, `role="button"`, `tabIndex={0}` to task items in `frontend/src/pages/Dashboard.jsx`
    - Recent Tasks list items now have `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space, `cursor: pointer`
    - _Requirements: 24.1, 24.2_
  - [x] 28.2 Board cards in `frontend/src/components/board/BoardCard.jsx` have `onKeyDown`, `role="button"`, `tabIndex={0}`
    - _Requirements: 24.1, 24.2_

- [x] 29. Fix missing useEffect dependency in ProjectWorkspace (M8)
  - [x] 29.1 `openNewTask` is in the keyboard shortcut `useEffect` dependency array
    - `openNewTask` is wrapped in `useCallback`
    - _Requirements: 26.1_

- [x] 30. Fix invalid HTML: fragment as tbody child in TableView.jsx (MEDIUM — new)
  - [x] 30.1 Replace shorthand React fragment `<>` with `<React.Fragment key={...}>` in `frontend/src/components/table/TableView.jsx`
    - Added `Fragment` to React import; replaced `<>` with `<Fragment key={group.key}>` in tbody map
    - Removed `key` from inner `<tr>` since key is now on the Fragment
    - _Requirements: 3.2 (code quality / valid DOM)_

- [x] 31. Fix stale draft in TaskDetailPanel (MEDIUM — new)
  - [x] 31.1 Sync draft state when `task` prop changes in `frontend/src/components/task/TaskDetailPanel.jsx`
    - Added `useEffect` that resets `draft` when `task._id` or `task.updatedAt` changes
    - _Requirements: 22.1_

- [x] 32. Fix activities endpoint using require() inside route handler (MEDIUM — new)
  - [x] 32.1 Move `require()` calls to top of `backend/server.js`
    - `Task` and `ProjectMembers` now imported at top level; inline requires removed from handler
    - _Requirements: 7.1 (code quality)_

- [x] 33. Fix attachment serving path check in server.js (MEDIUM — new)
  - [x] 33.1 Correct the redundant path guard in `GET /api/attachments/:filename` in `backend/server.js`
    - Simplified guard to `!filePath.startsWith(UPLOADS_DIR + path.sep)`; added empty-filename guard
    - _Requirements: 5.3, 5.4_

- [x] 34. Fix comment text validation missing (MEDIUM — new)
  - [x] 34.1 Add Joi validation to `POST /api/tasks/:id/comments` route in `backend/routes/tasks.js`
    - `commentSchema` added; `validate(commentSchema)` applied to comments route
    - _Requirements: 3.1_

- [x] 35. Checkpoint — Medium fixes complete

---

### ── LOW ───────────────────────────────────────────────────────────────────

- [x] 36. Low-priority fixes
  - [x] 36.1 No dead `frontend/src/components/Dashboard.jsx` file exists
    - _Requirements: 27.1_
  - [x] 36.2 `frontend/src/components/shared/GitHubMark.jsx` exists and is imported by `Login.jsx`
    - _Requirements: 29.1, 29.2_
  - [x] 36.3 Duplicate read-only assignee `<td>` removed from `frontend/src/components/table/TableRow.jsx`
    - _Requirements: 30.1_
  - [x] 36.4 Labels and milestone columns present in `TableRow.jsx` and `TableView.jsx` with `visibleFields` guards
    - _Requirements: 31.1_
  - [x] 36.5 All route handlers use `process.env.NODE_ENV === 'production'` guard on 500 errors
    - _Requirements: 32.1, 32.2_
  - [x] 36.6 `frontend/src/components/Login.jsx` has no empty `useEffect`
    - _Requirements: 33.1_

- [x] 37. Fix missing error handling in fetchData (LOW — new)
  - [x] 37.1 Add user-visible error feedback to `fetchData` in `frontend/src/pages/Dashboard.jsx`
    - `toast.error('Failed to load dashboard data')` added to catch block
    - _Requirements: 8.1 (UX)_
  - [x] 37.2 Add user-visible error feedback to `fetchUsers` in `frontend/src/pages/Team.jsx`
    - `toast.error('Failed to load team members')` added to catch block
    - _Requirements: 21.1 (UX)_

- [x] 38. Final checkpoint — All fixes complete

---

## Summary of What's Already Done vs Still Needed

### ✅ Already complete (verified in source)
1.1, 1.3, 1.5, 2.1, 3.1, 3.2, 4.1, 5.1, 5.2, 5.4, 6.1, 7.1, 8.1, 11.1, 12.1, 13.1, 14.1, 14.2, 15.1, 16.1, 17.1, 18.1, 19.1, 19.2, 23.1, 23.2, 23.3, 24.1, 25.1, 26.1, 27.1, 28.2, 29.1, 36.1–36.6

### ❌ Still needed (in priority order)
| Task | Severity | File(s) | Description |
|------|----------|---------|-------------|
| 9.1 | Critical | `backend/middleware/validate.js` | Assign `req.body = value` so `stripUnknown` actually works |
| 20.1 | High | `frontend/src/pages/Team.jsx` | Remove role select; use role promotion endpoint after signup |
| 21.1 | High | `frontend/src/pages/Team.jsx` | Fix password minLength 6→8 |
| 25.2 | Medium | `Dashboard.jsx`, `Projects.jsx`, `TaskBoard.jsx`, `Team.jsx` | Migrate raw axios to centralized `api.js` |
| 28.1 | Medium | `frontend/src/pages/Dashboard.jsx` | Add keyboard accessibility to recent task list items |
| 30.1 | Medium | `frontend/src/components/table/TableView.jsx` | Fix fragment key warning in tbody |
| 31.1 | Medium | `frontend/src/components/task/TaskDetailPanel.jsx` | Sync draft on task prop change |
| 32.1 | Medium | `backend/server.js` | Move `require()` calls out of activities route handler |
| 33.1 | Medium | `backend/server.js` | Fix redundant path guard in attachment endpoint |
| 34.1 | Medium | `backend/routes/tasks.js` | Add Joi validation to comments route |
| 37.1 | Low | `frontend/src/pages/Dashboard.jsx` | Add toast on fetchData error |
| 37.2 | Low | `frontend/src/pages/Team.jsx` | Add toast on fetchUsers error |

---

## Notes

- **Task 9.1** is the most impactful remaining backend fix. Without it, `stripUnknown: true` is a no-op and any extra fields in request bodies (including `role`) still reach route handlers. The only protection is the destructuring in each route handler, which is fragile.
- **Tasks 20.1 + 21.1** are both in `Team.jsx` and should be done together. The role select is misleading (server ignores it), and the minLength mismatch causes silent 422 failures.
- **Task 25.2** is the largest remaining task — it touches four files. It can be done incrementally per file without breaking anything.
- **Task 30.1** (`TableView.jsx` fragment) produces React key warnings and invalid HTML. `<tbody>` must only contain `<tr>` elements; shorthand fragments without keys violate this.
- **Task 31.1** (`TaskDetailPanel` draft sync) is partially mitigated by the `key` prop in `ProjectWorkspace.jsx` which remounts the panel on `updatedAt` change — but only works if `updatedAt` is populated (which it now is since task 26.1 is done).
- **Task 32.1** (`require()` inside handler) is a code quality issue — Node.js caches modules so it's not a correctness bug, but it's misleading and should be at the top level.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["9.1", "21.1"] },
    { "id": 1, "tasks": ["20.1", "34.1", "32.1", "33.1"] },
    { "id": 2, "tasks": ["25.2", "30.1", "31.1", "28.1"] },
    { "id": 3, "tasks": ["37.1", "37.2"] }
  ]
}
```

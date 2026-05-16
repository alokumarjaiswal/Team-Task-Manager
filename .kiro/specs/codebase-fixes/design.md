# Design Document — Codebase Security & Bug Fixes

## Overview

This document describes the technical design for all security vulnerability and bug fixes identified in the Team Task Manager codebase. The fixes are grouped by priority tier (Critical → High → Medium → Low) and cover the Node.js/Express backend and the React/Vite frontend. No new user-facing features are introduced; the goal is correctness, security, and code quality.

The dominant language is **JavaScript** (Node.js backend, React frontend).

---

## Architecture

The application follows a standard three-tier architecture:

```
Browser (React SPA)
      │  REST + WebSocket (Socket.IO)
      ▼
Express API Server (Node.js)
      │  Sequelize ORM
      ▼
SQLite (dev) / PostgreSQL (prod)
```

All fixes operate within this existing architecture. No new services or infrastructure are introduced.

---

## Critical Fixes Design

### C1 — Self-Assignable Admin Role at Signup

**Problem:** `backend/routes/auth.js` reads `role` from `req.body` and passes it to `User.create`, allowing any caller to self-assign `role: "admin"`.

**Fix:**
- Remove `role` from the destructured signup payload.
- Always pass `role: 'member'` to `User.create`.
- Add a new `PUT /api/users/:id/role` route protected by `adminAuth` that accepts `{ role: 'admin' | 'member' }`.
- Remove the role `<select>` from `frontend/src/components/Login.jsx`.

```javascript
// backend/routes/auth.js — signup handler (after fix)
router.post('/signup', validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body; // role intentionally excluded
  // ...
  const user = await User.create({ name, email, password: hashedPassword, role: 'member' });
  // ...
});

// backend/routes/users.js — new role promotion endpoint
router.put('/:id/role', adminAuth, validate(roleSchema), async (req, res) => {
  const { role } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.role = role;
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});
```

---

### C2 — Input Validation on Auth Routes

**Problem:** `/signup` and `/login` accept arbitrary payloads with no schema enforcement.

**Fix:** Define Joi schemas and apply `validate` middleware.

```javascript
// backend/routes/auth.js — Joi schemas
const Joi = require('joi');

const signupSchema = Joi.object({
  name:     Joi.string().min(1).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

router.post('/signup', validate(signupSchema), async (req, res) => { /* ... */ });
router.post('/login',  validate(loginSchema),  async (req, res) => { /* ... */ });
```

---

### C3 — Input Validation on Task and Project Routes

**Problem:** POST/PUT on tasks and projects accept arbitrary payloads.

**Fix:** Define Joi schemas and apply `validate` middleware.

```javascript
// backend/routes/tasks.js — Joi schemas
const taskCreateSchema = Joi.object({
  title:       Joi.string().max(200).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  status:      Joi.string().valid('todo', 'in-progress', 'done').optional(),
  projectId:   Joi.number().integer().required(),
  assignedTo:  Joi.number().integer().allow(null).optional(),
  dueDate:     Joi.date().iso().allow(null).optional(),
});

const taskUpdateSchema = Joi.object({
  title:       Joi.string().max(200).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  status:      Joi.string().valid('todo', 'in-progress', 'done').optional(),
  assignedTo:  Joi.number().integer().allow(null).optional(),
  dueDate:     Joi.date().iso().allow(null).optional(),
});

// backend/routes/projects.js — Joi schemas
const projectCreateSchema = Joi.object({
  name:        Joi.string().max(200).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  members:     Joi.array().items(Joi.number().integer()).optional(),
});

const projectUpdateSchema = Joi.object({
  name:        Joi.string().max(200).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  members:     Joi.array().items(Joi.number().integer()).optional(),
});
```

---

### C4 — Restricted File Upload

**Problem:** multer accepts any file type and has no size limit.

**Fix:** Add `fileFilter`, `limits`, and filename sanitization.

```javascript
// backend/routes/tasks.js — secure multer config
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const sanitizeFilename = (original) => {
  const ext  = path.extname(original).toLowerCase();
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${Date.now()}_${base}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, sanitizeFilename(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed`), false);
    }
  },
});
```

---

### C5 — Path Traversal Prevention

**Problem:** The full filesystem path is stored in `Attachment.path` and used directly in frontend URLs, enabling path traversal.

**Fix:**
1. Store only the sanitized filename in `Attachment.path`.
2. Add a dedicated `GET /api/attachments/:filename` endpoint with traversal protection.
3. Update the frontend to use the new endpoint.

```javascript
// backend/server.js — attachment serving endpoint
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

app.get('/api/attachments/:filename', auth, (req, res) => {
  // Strip all traversal sequences
  const safe = path.basename(req.params.filename.replace(/\.\./g, '').replace(/[/\\]/g, ''));
  const filePath = path.join(UPLOADS_DIR, safe);

  // Ensure resolved path is inside uploads dir
  if (!filePath.startsWith(UPLOADS_DIR + path.sep) && filePath !== UPLOADS_DIR) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).json({ error: 'File not found' });
  });
});

// backend/routes/tasks.js — store only filename
const attachment = await Attachment.create({
  filename: req.file.originalname,
  path:     req.file.filename, // sanitized filename only, not full path
  userId:   req.user._id,
  taskId:   req.params.id,
});
```

```jsx
// frontend — attachment URL construction (after fix)
<a href={`${API_URL}/api/attachments/${att.path}`} target="_blank" rel="noreferrer">
  <Paperclip size={12} /> {att.filename}
</a>
```

---

### C6 — Centralised JWT Secret

**Problem:** Both `auth.js` route and `auth.js` middleware read `process.env.JWT_SECRET` directly, bypassing the Config Module.

**Fix:** Import from `config/index.js` in both files.

```javascript
// backend/routes/auth.js (after fix)
const config = require('../config');
// Use config.jwt.secret everywhere JWT_SECRET was used

// backend/middleware/auth.js (after fix)
const config = require('../config');
// Use config.jwt.secret everywhere JWT_SECRET was used
```

---

### C7 — Scoped Activities Endpoint

**Problem:** `GET /api/activities` returns all logs to any authenticated user.

**Fix:** Add role-based filtering using the user's project memberships.

```javascript
// backend/server.js — scoped activities endpoint
app.get('/api/activities', auth, async (req, res) => {
  try {
    let activities;
    if (req.user.role === 'admin') {
      activities = await ActivityLog.findAll({
        include: [{ model: User, as: 'user', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
    } else {
      // Find projects the member belongs to
      const memberProjects = await ProjectMembers.findAll({ where: { userId: req.user._id } });
      const projectIds = memberProjects.map(pm => pm.projectId);
      const memberTasks = await Task.findAll({ where: { projectId: projectIds }, attributes: ['_id'] });
      const taskIds = memberTasks.map(t => t._id);

      activities = await ActivityLog.findAll({
        where: { taskId: taskIds },
        include: [{ model: User, as: 'user', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
    }
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
  }
});
```

---

### C8 — Paginated and Scoped Dashboard

**Problem:** `GET /api/dashboard` runs full-table scans with no pagination or user scoping.

**Fix:** Add pagination query params and scope queries to the requesting user's projects.

```javascript
// backend/routes/dashboard.js (after fix)
router.get('/', auth, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit,  10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  let projectWhere = {};
  if (req.user.role !== 'admin') {
    const memberProjects = await ProjectMembers.findAll({ where: { userId: req.user._id } });
    const projectIds = memberProjects.map(pm => pm.projectId);
    projectWhere = { _id: projectIds };
  }

  const [tasks, projects, users, activities] = await Promise.all([
    Task.findAll({ where: { projectId: Object.keys(projectWhere).length ? projectWhere._id : undefined }, limit, offset }),
    Project.findAll({ where: projectWhere, limit, offset }),
    User.findAll({ attributes: { exclude: ['password'] }, limit, offset }),
    ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 20,
    }),
  ]);
  // ... aggregate and respond
});
```

---

## High Fixes Design

### H1 — Persistent Email Transporter

**Problem:** `nodemailer.createTestAccount()` is called inside `sendEmail`, creating a new Ethereal account on every email.

**Fix:** Initialise the transporter once at module load using an IIFE.

```javascript
// backend/utils/email.js (after fix)
const nodemailer = require('nodemailer');
const config = require('../config');

let transporterPromise;

const getTransporter = () => {
  if (!transporterPromise) {
    if (config.env === 'production' && config.smtp.host) {
      transporterPromise = Promise.resolve(nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      }));
    } else {
      transporterPromise = nodemailer.createTestAccount().then(account =>
        nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: account.user, pass: account.pass },
        })
      );
    }
  }
  return transporterPromise;
};

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: '"ProFlow Tasks" <no-reply@proflow.com>', to, subject, text });
    if (config.env !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Email error:', error);
  }
};

module.exports = sendEmail;
```

---

### H2 — Guarded sequelize.sync()

```javascript
// backend/server.js (after fix)
const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
  });
};

if (process.env.NODE_ENV !== 'production') {
  sequelize.sync().then(() => {
    logger.info('Database synced successfully');
    startServer();
  }).catch(err => {
    logger.error('Failed to sync database', { error: err.message });
    process.exit(1);
  });
} else {
  startServer();
}
```

---

### H3 — Configurable Database Dialect

```javascript
// backend/models/index.js (after fix)
const { Sequelize } = require('sequelize');
const config = require('../config');

let sequelize;
if (config.db.dialect === 'postgres' && config.db.url) {
  sequelize = new Sequelize(config.db.url, {
    dialect: 'postgres',
    logging: config.db.logging,
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.db.storage,
    logging: config.db.logging,
  });
}

module.exports = sequelize;
```

---

### H4 — Single-Project Fetch Endpoint

```javascript
// backend/routes/projects.js — new GET /:id route
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner',   attributes: ['_id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['_id', 'name', 'email'], through: { attributes: [] } },
      ],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});
```

```javascript
// frontend/src/services/api.js — add getById
projectAPI.getById = (id) => axios.get(`${API_URL}/api/projects/${id}`, { headers: authHeaders() });
```

```jsx
// frontend/src/pages/ProjectWorkspace.jsx (after fix)
const projectRes = await projectAPI.getById(id);
setProject(projectRes.data);
```

---

### H5 — Stale Closure Fix in TaskBoard

```jsx
// frontend/src/pages/TaskBoard.jsx (after fix)
useEffect(() => {
  if (showTaskDetailsModal) {
    const updatedTask = tasks.find(t => t._id === showTaskDetailsModal._id);
    if (updatedTask) setShowTaskDetailsModal(updatedTask);
  }
}, [tasks, showTaskDetailsModal]); // showTaskDetailsModal added
```

---

### H6 — Optimistic Update Rollback

```jsx
// frontend/src/pages/TaskBoard.jsx (after fix)
const updateTaskStatus = async (taskId, newStatus) => {
  const previousTasks = [...tasks]; // capture before optimistic update
  try {
    const token = localStorage.getItem('token');
    await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Task updated');
  } catch (err) {
    setTasks(previousTasks); // revert
    toast.error('Failed to update task status');
  }
};
```

---

### H7 — ProjectHeader Save Handler

```jsx
// frontend/src/components/project/ProjectHeader.jsx (after fix)
import { useState, useRef } from 'react';
import { projectAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProjectHeader({ project, view, onViewChange, search, onSearch, onNewItem }) {
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(project?.name || 'Project');
  const lastSavedName = useRef(project?.name || 'Project');

  const handleTitleBlur = async (e) => {
    const newName = e.currentTarget.textContent.trim();
    if (!newName || newName === lastSavedName.current) return;
    setSaving(true);
    try {
      await projectAPI.update(project._id, { name: newName });
      lastSavedName.current = newName;
      toast.success('Project name saved');
    } catch {
      e.currentTarget.textContent = lastSavedName.current;
      toast.error('Failed to save project name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="project-header-shell">
      <div className="project-header-shell__title-block">
        <h1
          className="project-header-shell__title"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
        >
          {project?.name || 'Project'}
        </h1>
        {saving && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Saving…</span>}
        {/* ... rest unchanged */}
      </div>
      {/* ... */}
    </header>
  );
}
```

---

### H8 — Remove alert() Stubs from FilterBar

The FilterBar will implement Assignee and Status filters. Unimplemented buttons (Labels, Milestones, Group by, Sort, Fields, View options) will be disabled with a tooltip.

```jsx
// frontend/src/components/project/FilterBar.jsx (after fix)
export default function FilterBar({ search, onSearch, onNewItem, users = [], filterAssignee, onFilterAssignee, filterStatus, onFilterStatus }) {
  return (
    <div className="filter-bar">
      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
        placeholder="Filter by keyword" aria-label="Filter by keyword" className="filter-bar__search" />
      <div className="filter-bar__actions">
        <select value={filterStatus} onChange={(e) => onFilterStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filterAssignee} onChange={(e) => onFilterAssignee(e.target.value)} aria-label="Filter by assignee">
          <option value="">All assignees</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
        {['Labels', 'Milestones', 'Group by', 'Sort', 'Fields', 'View options'].map(label => (
          <button key={label} type="button" className="btn" disabled title={`${label} — coming soon`}>{label}</button>
        ))}
        <button type="button" className="btn btn--primary" onClick={onNewItem} title="Shortcut: N">New item</button>
      </div>
    </div>
  );
}
```

---

### H9 — Correct HTTP Status for Invalid Token

```javascript
// backend/middleware/auth.js (after fix)
} catch (error) {
  res.status(401).json({ error: 'Invalid or expired token' }); // was 400
}
```

---

### H10 — Null-Safe adminAuth

```javascript
// backend/middleware/auth.js (after fix)
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};
```

---

## Medium Fixes Design

### M1 — Shared Socket.IO Context

Create a singleton module that manages a single Socket.IO connection.

```javascript
// frontend/src/services/socket.js
import { io } from 'socket.io-client';
import API_URL from '../config';

let socket = null;
let refCount = 0;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, { autoConnect: true });
  }
  refCount++;
  return socket;
};

export const releaseSocket = () => {
  refCount--;
  if (refCount <= 0 && socket) {
    socket.disconnect();
    socket = null;
    refCount = 0;
  }
};
```

Each component that previously called `io(API_URL)` will instead call `getSocket()` on mount and `releaseSocket()` on unmount.

---

### M2 — Remove Math.random() from Chart Data

The "Task Activity (7 Days)" area chart in `frontend/src/pages/Dashboard.jsx` adds `Math.random()` offsets to real data. Remove these additions entirely. The chart will show only actual `createdAt` and `updatedAt` counts per day.

```jsx
// After fix — no Math.random()
{
  day: d.toLocaleDateString('en-US', { weekday: 'short' }),
  Created:   tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateStr)).length,
  Completed: tasks.filter(t => t.status === 'done' && t.updatedAt && t.updatedAt.startsWith(dateStr)).length,
}
```

---

### M3 — Safe localStorage Access

Replace direct `localStorage.getItem('user')` calls in components with the `useAuth` hook. For the TaskBoard component (which currently uses `JSON.parse(localStorage.getItem('user'))` without error handling), use the hook instead.

---

### M4 — Re-enable updatedAt on Task Model

```javascript
// backend/models/Task.js (after fix)
}, {
  timestamps: true,
  // updatedAt: false  <-- remove this line
});
```

---

### M5 — Exclude database.sqlite from Version Control

Add to `backend/.gitignore`:
```
database.sqlite
```

---

### M6 — Keyboard Accessibility

For every interactive `div` or `article` with an `onClick` handler that is not a native `<button>`, add:

```jsx
onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); /* same action as onClick */ } }}
role="button"
tabIndex={0}
```

Primary locations: project list items in `components/Dashboard.jsx`, task cards in `components/board/BoardCard.jsx`, and any other `div` elements with click handlers.

---

### M7 — Remove Unused headers Variable

```jsx
// frontend/src/pages/ProjectWorkspace.jsx (after fix)
// Remove: const headers = { Authorization: `Bearer ${token}` };
// (token variable itself can also be removed if only used for headers)
```

---

### M8 — Fix Missing useEffect Dependency

```jsx
// frontend/src/pages/ProjectWorkspace.jsx (after fix)
useEffect(() => {
  // keyboard shortcut handler
}, [selectedTaskId, showNewTaskModal, view, openNewTask]); // openNewTask added
```

---

## Low Fixes Design

### L1 — Delete Dead Dashboard Component

Delete `frontend/src/components/Dashboard.jsx`. This file is the old monolithic dashboard and is no longer imported anywhere; the active dashboard is `frontend/src/pages/Dashboard.jsx`.

### L2 — Consistent useAuth Hook Usage

Replace remaining direct `localStorage` reads in components with the `useAuth` hook. The hook already handles JSON parse errors gracefully.

### L3 — Shared GitHubMark SVG Component

Extract the `GitHubMark` function from `Login.jsx` into `frontend/src/components/shared/GitHubMark.jsx` and import it back.

### L4 — Remove Duplicate Assignee Column from TableView

`TableRow` renders both a read-only `assignee?.name` column and an editable `<select>` for `assignedTo`. Remove the read-only display column; keep only the editable `<select>` (which already shows the current assignee).

### L5 — Align Task Model with TableRow Columns

Remove the `labels` and `milestone` columns from `TableRow` since neither field exists on the Task model. This is simpler than adding new model fields and migrations.

### L6 — Hide error.message in Production

Audit all inline `catch` blocks in route handlers that return `res.status(500).json({ error: error.message })` and replace with the same pattern used in the global error handler:

```javascript
res.status(500).json({
  error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
});
```

### L7 — Remove Empty useEffect from Login

```jsx
// frontend/src/components/Login.jsx (after fix)
// Remove entirely:
useEffect(() => {
  return () => {
  };
}, []);
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Signup always produces member role

*For any* signup payload — regardless of whether it includes a `role` field and regardless of the value of that field — the created user's role SHALL equal `"member"`.

**Validates: Requirements 1.1**

---

### Property 2: Auth validation rejects invalid payloads

*For any* signup or login request payload that violates the Joi schema (missing required field, email not in valid format, password shorter than 8 characters), the Auth Service SHALL return HTTP 422.

**Validates: Requirements 2.1, 2.2**

---

### Property 3: Task and project validation rejects invalid payloads

*For any* task or project mutation payload that violates the Joi schema (title exceeding 200 characters, description exceeding 2000 characters, status not in the allowed enum), the System SHALL return HTTP 422.

**Validates: Requirements 3.1, 3.2**

---

### Property 4: File upload rejects non-whitelisted MIME types

*For any* file upload request whose MIME type is not in the whitelist, the Upload Handler SHALL reject the request with HTTP 400 and SHALL NOT write any file to disk.

**Validates: Requirements 4.1, 4.5**

---

### Property 5: Filename sanitization produces safe filenames

*For any* original filename string, the sanitized filename SHALL contain only alphanumeric characters, hyphens, underscores, and a single dot before the extension, and SHALL NOT contain path separators or traversal sequences.

**Validates: Requirements 4.4**

---

### Property 6: Attachment endpoint neutralises path traversal

*For any* filename parameter passed to `GET /api/attachments/:filename` — including strings containing `..`, `/`, `\`, or URL-encoded variants — the resolved filesystem path SHALL remain within the designated uploads directory.

**Validates: Requirements 5.3, 5.4**

---

### Property 7: Member activity scoping

*For any* Member user, the activities returned by `GET /api/activities` SHALL contain only logs whose associated task belongs to a project of which that Member is a member.

**Validates: Requirements 7.2**

---

### Property 8: Dashboard pagination bounds

*For any* `limit` value between 1 and 100 and any `offset` value, the number of tasks returned by `GET /api/dashboard` SHALL not exceed `limit`.

**Validates: Requirements 8.1**

---

### Property 9: Dashboard member scoping

*For any* Member user, the tasks and projects returned by `GET /api/dashboard` SHALL belong only to projects of which that Member is a member.

**Validates: Requirements 8.2**

---

### Property 10: Chart data is deterministic

*For any* fixed set of tasks, computing the "Task Activity (7 Days)" chart data twice in succession SHALL produce identical results (no random component).

**Validates: Requirements 20.1**

---

### Property 11: Production responses hide raw error messages

*For any* error thrown inside a route handler while `NODE_ENV` equals `"production"`, the HTTP response body SHALL NOT contain the raw `error.message` string from the thrown error.

**Validates: Requirements 32.1**


---

## Components and Interfaces

### Backend Components

| Component | File | Responsibility |
|---|---|---|
| Auth Routes | `backend/routes/auth.js` | Signup, login, JWT issuance |
| Auth Middleware | `backend/middleware/auth.js` | JWT verification, role guards |
| Validate Middleware | `backend/middleware/validate.js` | Joi schema enforcement |
| Task Routes | `backend/routes/tasks.js` | Task CRUD, file upload |
| Project Routes | `backend/routes/projects.js` | Project CRUD, member management |
| Dashboard Route | `backend/routes/dashboard.js` | Aggregated stats |
| Activities Endpoint | `backend/server.js` | Activity log access |
| Attachment Endpoint | `backend/server.js` | Safe file serving |
| Email Utility | `backend/utils/email.js` | Email sending |
| DB Module | `backend/models/index.js` | Sequelize initialisation |
| Config Module | `backend/config/index.js` | Centralised env vars |
| Task Model | `backend/models/Task.js` | Task schema |

### Frontend Components

| Component | File | Responsibility |
|---|---|---|
| Login | `frontend/src/components/Login.jsx` | Auth forms |
| TaskBoard | `frontend/src/pages/TaskBoard.jsx` | Kanban board |
| ProjectWorkspace | `frontend/src/pages/ProjectWorkspace.jsx` | Project view |
| ProjectHeader | `frontend/src/components/project/ProjectHeader.jsx` | Project title editing |
| FilterBar | `frontend/src/components/project/FilterBar.jsx` | Task filtering |
| TableRow | `frontend/src/components/table/TableRow.jsx` | Table row rendering |
| Dashboard | `frontend/src/pages/Dashboard.jsx` | Dashboard charts |
| Socket Singleton | `frontend/src/services/socket.js` | Shared WebSocket |
| GitHubMark | `frontend/src/components/shared/GitHubMark.jsx` | Shared SVG icon |
| useAuth Hook | `frontend/src/hooks/useAuth.js` | Auth state |

### Key Interfaces

```javascript
// Role promotion endpoint
PUT /api/users/:id/role
Body: { role: 'admin' | 'member' }
Auth: adminAuth
Response: { _id, name, email, role }

// Single project fetch
GET /api/projects/:id
Auth: auth
Response: { _id, name, description, createdBy, owner, members, createdAt }

// Safe attachment serving
GET /api/attachments/:filename
Auth: auth
Response: file stream or 400/404

// Scoped activities
GET /api/activities
Auth: auth
Response: ActivityLog[] (scoped by role)

// Paginated dashboard
GET /api/dashboard?limit=20&offset=0
Auth: auth
Response: { tasksByStatus, totalTasks, projectCount, teamSize, overdueTasks, tasksByProject, recentActivity }
```

---

## Data Models

### Task Model (after M4 fix)

```javascript
Task {
  _id:         INTEGER PRIMARY KEY AUTOINCREMENT
  title:       STRING NOT NULL          // max 200 chars (validated)
  description: TEXT                     // max 2000 chars (validated)
  status:      ENUM('todo','in-progress','done') DEFAULT 'todo'
  dueDate:     DATE
  projectId:   INTEGER FK → Project._id
  assignedTo:  INTEGER FK → User._id (nullable)
  createdAt:   DATETIME                 // auto
  updatedAt:   DATETIME                 // auto (re-enabled by M4)
}
```

### Attachment Model (after C5 fix)

```javascript
Attachment {
  _id:      INTEGER PRIMARY KEY AUTOINCREMENT
  filename: STRING NOT NULL   // original display name
  path:     STRING NOT NULL   // sanitized filename only (not full path)
  userId:   INTEGER FK → User._id
  taskId:   INTEGER FK → Task._id
  createdAt: DATETIME
}
```

### User Model (unchanged)

```javascript
User {
  _id:       INTEGER PRIMARY KEY AUTOINCREMENT
  name:      STRING NOT NULL
  email:     STRING NOT NULL UNIQUE
  password:  STRING NOT NULL   // bcrypt hash
  role:      ENUM('admin','member') DEFAULT 'member'
  createdAt: DATETIME
}
```

---

## Error Handling

### Backend Error Handling Strategy

All route handlers follow this pattern after the fixes:

```javascript
} catch (error) {
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
}
```

Specific error cases:

| Scenario | HTTP Status | Response |
|---|---|---|
| Validation failure (Joi) | 422 | `{ error: 'Validation failed', code: 'VALIDATION_ERROR', details: [...] }` |
| Invalid/expired JWT | 401 | `{ error: 'Invalid or expired token' }` |
| Missing JWT | 401 | `{ error: 'Access denied' }` |
| Non-admin on admin route | 403 | `{ error: 'Admin access required' }` |
| Resource not found | 404 | `{ error: 'X not found' }` |
| Invalid file type | 400 | `{ error: 'File type "..." is not allowed' }` |
| Path traversal attempt | 400 | `{ error: 'Invalid filename' }` |
| Internal server error | 500 | `{ error: 'Internal server error' }` (production) |

### Frontend Error Handling Strategy

- All API failures display a `toast.error(...)` message.
- Optimistic UI updates (drag-and-drop status changes) revert to previous state on failure.
- `localStorage` reads use the `useAuth` hook which wraps JSON.parse in try/catch.
- The `ProjectHeader` save handler reverts the displayed title on API failure.

---

## Testing Strategy

### Unit / Example Tests

- Signup with `role: 'admin'` in payload → created user has `role === 'member'`
- Non-admin calling `PUT /api/users/:id/role` → 403
- Invalid JWT → 401 (not 400)
- `adminAuth` with `req.user = undefined` → 401
- `sequelize.sync()` not called when `NODE_ENV=production`
- DB Module initialises with PostgreSQL URL when `dialect=postgres`
- Email transporter created once (spy on `createTestAccount` — called at most once)
- Task `updatedAt` populated after update

### Property-Based Tests

See Correctness Properties section. Key properties to implement:

1. Signup always produces member role (any payload)
2. Auth validation rejects invalid payloads (generated invalid inputs)
3. Task/project validation rejects invalid payloads (generated oversized/invalid inputs)
4. File upload rejects non-whitelisted MIME types (generated MIME strings)
5. Filename sanitization produces safe filenames (generated filenames with special chars)
6. Attachment endpoint neutralises path traversal (generated traversal strings)
7. Member activity scoping (generated member/project/activity combinations)
8. Dashboard pagination bounds (generated limit/offset values)
9. Dashboard member scoping (generated member/project combinations)
10. Chart data is deterministic (same task set → same chart output)
11. Production responses hide raw error messages (generated errors in production mode)


# Team Task Manager — Quick Start

Purpose
- Minimal task/project manager (frontend + backend) with real-time updates made for Ethara's Internal Full-Stack Assessment. I went with the GitHub's style to handle team and projects.

Quick setup (dev)
- Backend:
	- cd backend
	- npm install
	- create a `.env` (or set env vars): `DATABASE_URL`, `JWT_SECRET`
	- run migrations: `npm run migrate`
	- start: `npm start`
- Frontend:
	- cd frontend
	- npm install
	- set `VITE_API_URL` to the backend URL (e.g. http://localhost:3000)
	- dev server: `npm run dev`

Test accounts for quick login:
- Admin: admin@test.com / Admin1234!
- Member: member@test.com / Member1234!

Architecture & config
- Frontend: Vite + React. Uses `VITE_API_URL` at build/runtime. Start with `npm run dev`.
- Backend: Express + Sequelize. Expects `DATABASE_URL` (Postgres) and `JWT_SECRET`.
- Database: Postgres (or sqlite when `DATABASE_URL` is absent for local quick dev).

Railway deployment notes
- Services used: `Postgres`, `backend`, `frontend` (static build).
- Railway wiring:
	- `Postgres` provides `DATABASE_URL` to `backend` (internal) and `DATABASE_PUBLIC_URL` for external access.
	- `backend` requires `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `FRONTEND_URL`.
	- `frontend` build should be configured with `VITE_API_URL` pointing at the backend public URL; set `FRONTEND_URL` to the deployed frontend domain.
- Troubleshooting: Railway internal hostnames (e.g. `postgres.railway.internal`) resolve only inside Railway; use `DATABASE_PUBLIC_URL` for local scripts or external DB clients.

Assumptions & limitations
- Node 24 is targeted by the repo; use Node 24.x.
- Uploads are stored in `backend/uploads` (ephemeral on containers). Use external object storage in production.
- Demo seed scripts are idempotent but assume the two test users exist before seeding the demo project.
- This README is intentionally compact; see `backend/scripts` for seed scripts and `DEPLOYMENT_RAILWAY.md` for full deployment steps.

## 🚀 Live Demo
- **Frontend**: [https://team-task-manager-ethara.up.railway.app](https://team-task-manager-ethara.up.railway.app)
- **Backend API**: [[https://backend-production-8c1c.up.railway.app](https://team-task-manager-ethara-backend.up.railway.app/)]([https://backend-production-8c1c.up.railway.app](https://team-task-manager-ethara-backend.up.railway.app/))

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Recharts, Framer Motion, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO, Sequelize ORM |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + bcrypt |
| Deployment | Railway (backend) |

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Backend
```bash
cd backend
cp .env.example .env    # configure your environment
npm install
node server.js          # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # runs on http://localhost:5173
```

## Features
- 🔐 JWT authentication with role-based access (Admin/Member)
- 📋 Kanban-style task board with drag-and-drop
- 📊 Real-time dashboard with analytics charts
- 👥 Team management with admin controls
- 💬 Task comments and file attachments
- 🔔 Real-time updates via WebSockets
- 📧 Email notifications on task assignment

With love, light and laughter!
Alok Kumar Jaiswal
Special thanks to [Saswat](https://www.linkedin.com/in/saswat-kumar-das-069a51187)!

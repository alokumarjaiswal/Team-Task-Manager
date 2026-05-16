# Railway Deployment Guide — Team Task Manager

Prerequisites:
- Install Railway CLI: `npm i -g @railway/cli` and log in with `railway login`.
- Ensure GitHub repo is connected to Railway (for auto-deploy) or use `railway up`.

Overview:
-- We'll create one Railway project with three services: `postgres` (plugin), `backend` (Node API), and `frontend` (static Vite build served by `serve.js`).

1) Create project

```bash
railway login
railway init --name team-task-manager
```

2) Provision Postgres (plugin)

Via CLI:
```bash
railway plugin add postgres
# note the returned variable name (typically DATABASE_URL)
```

Or via Dashboard: Project -> Plugins -> PostgreSQL -> Provision

3) Create backend service

From repo root (backend folder):

```bash
cd backend
railway up --detach --name backend
# In the Railway service settings set the build to use NIXPACKS (railway.json exists)
# Ensure start command is: npm run start:prod
```

- `DATABASE_URL` (automatically set if plugin linked)
- `NODE_ENV=production`
- `JWT_SECRET` (generate a secure value)
- `FRONTEND_URL` = the frontend service URL (set after frontend creation)
- Optional: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `REDIS_URL`
Set environment variables for backend in Railway (Project -> Services -> backend -> Variables):
- `DATABASE_URL` (automatically set if plugin linked)
- `NODE_ENV=production`
- `JWT_SECRET` (generate a secure value)
- `FRONTEND_URL` = the frontend service URL (set after frontend creation)
- Optional: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `REDIS_URL`
- `DATABASE_URL` (automatically set if plugin linked)
- `NODE_ENV=production`
- `JWT_SECRET` (generate a secure value)
- `FRONTEND_URL` = the frontend service URL (set after frontend creation)
- Optional: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `REDIS_URL`

4) Create frontend service

From repo root (frontend folder):

```bash
cd frontend
railway up --detach --name frontend
# Ensure build phase runs `npm install` and `npm run build` (nixpacks.toml present)
# Start command: node serve.js (railway.json exists)
```

Set environment variables for frontend in Railway (Project -> Services -> frontend -> Variables):
- `VITE_API_URL` = `https://<backend-service>.up.railway.app` (set to backend public URL after backend deploy)

5) Link plugin to backend (if not auto-linked)

Via CLI:
```bash
railway link --service backend --plugin postgres
```

6) Auto-deploy on push

In Railway Dashboard -> Deployments, connect your GitHub repo and enable auto-deploy on `main`.

7) Post-deploy verification

- Check backend logs: `railway logs --service backend --follow`
- Confirm migrations applied (look for "Migrations applied successfully" in logs or check `SequelizeMeta` table in Postgres).
- Curl health endpoint:

```bash
curl https://<backend-service>.up.railway.app/health
```

- Visit frontend URL; ensure the app loads and API calls succeed.

8) Environment Variables (summary)

- Backend (required): `DATABASE_URL`, `NODE_ENV=production`, `JWT_SECRET`, `FRONTEND_URL`
- Backend (optional): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `REDIS_URL`
- Frontend: `VITE_API_URL`

9) Rollback / safety

- Avoid destructive migrations; backup DB if doing destructive changes.
- Use Railway Deployments to rollback to a previous revision if necessary.

10) Local test commands

```bash
# frontend
cd frontend
npm ci
npm run build
npm run preview

# backend
cd backend
npm ci
npm run migrate
NODE_ENV=production DATABASE_URL=<local_pg_url> npm run start:prod
```

If you want, I can now create a ready-to-run `railway` deployment script or PR with these changes and the exact env values to set. 

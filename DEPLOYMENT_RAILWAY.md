Railway deployment guide for Team-Task-Manager
============================================

This repository is deployed on Railway as three services in one project:
`Postgres` (managed database), `backend` (Node/Express API), and `frontend` (Vite app served by `serve.js`).

Prerequisites
- Railway CLI installed and logged in: `railway login`
- Node 24 available locally for the repo tooling
- A Railway project linked to this workspace, or a fresh project created from the script below

Recommended path
1. Use the scripted deployment flow in [scripts/railway-deploy.mjs](scripts/railway-deploy.mjs).
2. Run it from the repo root:

```powershell
node .\scripts\railway-deploy.mjs
```

3. If your GitHub repo is connected and you want Railway to store the source repo plus branch, pass the repo slug:

```powershell
node .\scripts\railway-deploy.mjs --repo owner/repo --branch main
```

What the script does
- Creates the project if needed
- Creates `backend` and `frontend` services if missing
- Pins each service to its monorepo root directory
- Wires `backend` to `Postgres` with `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- Deploys backend first, then frontend
- Generates public Railway domains for both services
- Updates backend `FRONTEND_URL` to the final frontend origin

Required environment variables
- Backend: `DATABASE_URL`, `NODE_ENV=production`, `JWT_SECRET`, `FRONTEND_URL`
- Frontend: `VITE_API_URL`
- Optional backend vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `REDIS_URL`

Bootstrap order
1. Backend deploys with a temporary `FRONTEND_URL=*` so it can start.
2. Frontend deploys with `VITE_API_URL` pointing at the backend public domain.
3. Backend `FRONTEND_URL` is updated to the frontend public domain and redeployed.

Manual one-time steps
- Generate a Railway token only if you are scripting against the API directly; the CLI workflow in this repo uses your logged-in Railway session.
- If you want auto-deploy on git push, connect the GitHub repo in the Railway dashboard after the services exist.

Best practices
- Keep secrets in Railway variables, never in the repo.
- Use the managed Postgres service and the internal `DATABASE_URL` template reference.
- Keep the backend health check at `/health`.
- Leave restart policy as `ON_FAILURE`.
- Set `VITE_API_URL` before any frontend build; the frontend now fails fast if it is missing in production.

Troubleshooting
- If the backend build fails with a missing module, check the backend logs first; runtime dependencies now include `pg` and `glob`.
- If the frontend build fails, verify `VITE_API_URL` is set in the Railway frontend service before deployment.
- If CORS errors appear, update `FRONTEND_URL` to the exact frontend domain and redeploy the backend.
- If Railway times out during deploy, retry the `railway up` command; the control plane has been intermittently slow during this run.

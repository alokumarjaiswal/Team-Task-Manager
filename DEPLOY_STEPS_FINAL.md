# Railway Deployment — Final Steps

All code changes are complete and committed. This guide provides exact copy/paste commands for deploying to Railway.

## Prerequisites

- Railway CLI installed: `npm i -g @railway/cli`
- Logged into Railway: `railway login` (will prompt interactively)
- GitHub repo connected to Railway for auto-deploy (optional but recommended)

## Step 1: Create Railway Project

```bash
cd C:\Users\Admin\Desktop\ethara.ai\Team-Task-Manager
railway login
railway init --name team-task-manager
```

Select or create the project when prompted. You'll be assigned a project ID.

## Step 2: Provision PostgreSQL Plugin

```bash
railway plugin add postgres
```

This creates a `DATABASE_URL` environment variable accessible to the backend service.

## Step 3: Deploy Backend Service

```bash
cd backend
railway up --detach --name backend
```

This:
- Uses `backend/nixpacks.toml` for build (npm ci + npm run build if needed)
- Uses `npm run start:prod` as the start command (runs migrations, then starts server)
- Automatically sets `PORT` and links to Postgres plugin

**After deploy, set environment variables in Railway Dashboard or CLI:**

```bash
railway variables add NODE_ENV=production JWT_SECRET=<generate-a-secure-value>
```

Example secure value generation:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Deploy Frontend Service

```bash
cd ../frontend
railway up --detach --name frontend
```

This:
- Uses `frontend/nixpacks.toml` for build (npm ci + npm run build)
- Uses `node serve.js` as the start command (serves dist/ as static files)
- Automatically sets `PORT`

## Step 5: Get Service URLs and Link Variables

After both services are deployed, get their public URLs:

```bash
railway domains --service backend
railway domains --service frontend
```

Or check Railway Dashboard for service URLs (typically `<service>.up.railway.app`).

Set environment variables:

**Backend variables (Railway Dashboard -> Services -> backend -> Variables):**
- `DATABASE_URL` (auto-set if plugin linked)
- `NODE_ENV=production`
- `JWT_SECRET` (your generated secure value)
- `FRONTEND_URL=https://<frontend-service>.up.railway.app`
- Optional: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `REDIS_URL`

**Frontend variables (Railway Dashboard -> Services -> frontend -> Variables):**
- `VITE_API_URL=https://<backend-service>.up.railway.app`

Or use CLI:
```bash
railway variables add FRONTEND_URL=https://<frontend-service>.up.railway.app --service backend
railway variables add VITE_API_URL=https://<backend-service>.up.railway.app --service frontend
```

## Step 6: Verify Deployment

**Check backend logs for successful migration:**
```bash
railway logs --service backend --follow
```

Look for: `Migrations applied successfully` or similar.

**Test health endpoint:**
```bash
curl https://<backend-service>.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": <seconds>,
  "timestamp": "2026-05-16T...",
  "database": "connected"
}
```

**Open frontend in browser:**
Navigate to `https://<frontend-service>.up.railway.app` and verify:
- Page loads without errors
- Can log in with test credentials (if seeded) or create account
- API calls to backend succeed (check Network tab in DevTools)
- WebSocket connections establish (for real-time features)

## Step 7: Enable Auto-Deploy (Optional but Recommended)

In Railway Dashboard:
1. Go to your project
2. Select **Deployments**
3. Click **Connect GitHub**
4. Select your repo and branch (e.g., `main`)
5. Enable auto-deploy on push

## Rollback / Safety

If something breaks:
- Check logs: `railway logs --service <service> --follow`
- View previous deployments: `railway deployments`
- Rollback to previous: `railway rollback` (from Railway Dashboard)
- Avoid destructive migrations without backup

## Environment Variables Reference

**Backend (required for production):**
- `DATABASE_URL` — Postgres connection string (set by plugin)
- `NODE_ENV=production` — Sets production mode
- `JWT_SECRET` — Secure random string for token signing
- `FRONTEND_URL` — Frontend origin for CORS

**Backend (optional):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Email service
- `REDIS_URL` — Redis cache (if used)

**Frontend:**
- `VITE_API_URL` — Backend API URL for Vite env substitution

## Troubleshooting

**Migration fails on deploy:**
- Check backend logs: `railway logs --service backend --follow`
- Ensure database is running: check Postgres plugin status in Dashboard
- Manually trigger migration via Railway console if needed

**Frontend can't reach backend:**
- Verify `VITE_API_URL` is set to correct backend public URL
- Check browser console for CORS errors
- Verify backend `FRONTEND_URL` includes frontend origin

**Native module build errors:**
- Node 24 is pinned in `nixpacks.toml`; ensure plugins don't downgrade Node
- Rebuild: redeploy service via Railway Dashboard

## Done

Your app is live on Railway. Monitor logs, set up alerts, and enjoy your deployment!

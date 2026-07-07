# Deployment Guide

This guide deploys the user and admin frontends to Vercel, the API to Render or Railway, and MongoDB to Atlas. Docker Compose is included for container-based deployments.

## 1. Prerequisites

- Node.js 22 or 24
- Docker Desktop with Docker Compose for container deployment
- MongoDB Atlas account
- Vercel account
- Render or Railway account
- A Git repository containing this project

Generate a production JWT secret with at least 32 random characters. Do not reuse database passwords or commit secrets.

## 2. MongoDB Atlas

1. Create an Atlas project and production cluster.
2. Create a dedicated database user with read/write access only to the Skills Tracker database.
3. Configure Network Access for the backend provider. Prefer provider static outbound IPs or private networking. Use `0.0.0.0/0` only when the provider has dynamic egress, with strong credentials and TLS.
4. Copy the SRV connection string and include a database name:

```text
mongodb+srv://app_user:PASSWORD@cluster.example.mongodb.net/skills_tracker?retryWrites=true&w=majority
```

5. Store this value as `MONGO_URI` on Render or Railway. Never expose it through a `VITE_` variable.

After the first backend deployment, open the provider shell and create indexes:

```powershell
npm.cmd run db:indexes
```

The command creates missing indexes and does not drop unrelated indexes.

## 3. Backend On Render

The root [render.yaml](./render.yaml) deploys `server/Dockerfile`.

1. In Render, create a new Blueprint from this repository.
2. Confirm the `skills-tracker-api` web service.
3. Set all environment values marked `sync: false`:
   - `MONGO_URI`
   - `ADMIN_EMAILS`
   - `CORS_ORIGINS`
4. Render generates `JWT_SECRET`. Verify it remains stable across deployments.
5. Deploy and confirm `https://YOUR-API.onrender.com/health` returns HTTP 200.
6. Run `npm run db:indexes` from the Render shell.

Use [server/.env.render.example](./server/.env.render.example) as the variable checklist.

## 4. Backend On Railway

The root [railway.json](./railway.json) selects `server/Dockerfile` and `/health`.

1. Create a Railway project from this repository.
2. Keep the repository root as the service root.
3. Add variables from [server/.env.railway.example](./server/.env.railway.example).
4. Generate a public Railway domain.
5. Confirm `https://YOUR-API.up.railway.app/health` returns HTTP 200.
6. Run `npm run db:indexes` in the Railway shell.

Do not set a fixed `PORT`; Render and Railway inject it automatically.

## 5. User Frontend On Vercel

Create a Vercel project with:

- Repository: this repository
- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set this Production environment variable:

```text
VITE_API_BASE=https://YOUR-BACKEND-DOMAIN/api
```

The included `client/vercel.json` provides SPA rewrites, immutable asset caching, and security headers.

## 6. Admin Frontend On Vercel

Create a second Vercel project with:

- Root Directory: `admin`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- `VITE_API_BASE=https://YOUR-BACKEND-DOMAIN/api`

The included `admin/vercel.json` prevents indexing and provides SPA rewrites and security headers.

After both Vercel domains exist, set the backend variable to the exact origins:

```text
CORS_ORIGINS=https://YOUR-USER-APP.vercel.app,https://YOUR-ADMIN-APP.vercel.app
```

Redeploy or restart the backend after changing CORS.

## 7. Admin Account

Set `ADMIN_EMAILS` to comma-separated authorized addresses. An account also needs an `admin` database role.

To create or update an admin from a trusted provider shell, set temporary variables and run:

```powershell
$env:ADMIN_SEED_EMAIL='admin@example.com'
$env:ADMIN_SEED_PASSWORD='use-a-strong-temporary-value'
npm.cmd run seed:admin
Remove-Item Env:ADMIN_SEED_EMAIL
Remove-Item Env:ADMIN_SEED_PASSWORD
```

Only allowlisted admin emails can use `/api/admin/*`, even if stale database records contain an admin role.

## 8. Docker Compose Deployment

Copy the Docker variable template without committing the resulting file:

```powershell
Copy-Item .env.docker.example .env.docker
```

Replace every placeholder, then build and start:

```powershell
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
```

Default endpoints:

- User app: `http://localhost:8080`
- Admin app: `http://localhost:8081`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/health`

The frontends call same-origin `/api` and Nginx proxies requests to the API container.

Inspect status and logs:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f api
```

Stop without deleting Atlas data:

```powershell
docker compose --env-file .env.docker down
```

## 9. Custom Domains And HTTPS

1. Attach the user and admin domains in Vercel.
2. Attach the API domain in Render or Railway.
3. Update `VITE_API_BASE` to the final API HTTPS URL and redeploy both frontends.
4. Update `CORS_ORIGINS` with exact HTTPS frontend origins and restart the API.
5. Confirm browser requests have no mixed-content or CORS errors.

## 10. Release Checklist

- `/health` returns 200 with `database: connected`.
- User registration/login works on the user domain.
- Admin login works only for an allowlisted admin.
- Create, update, search, and delete workflows work.
- Notes and resource links save and reopen correctly.
- Vercel assets return long-lived immutable cache headers.
- Admin pages return `X-Robots-Tag: noindex`.
- API logs contain request IDs and do not expose tokens/passwords.
- Atlas backups, alerts, and least-privilege database users are configured.

## 11. Rollback

- Vercel: promote the previous successful deployment.
- Render/Railway: redeploy the previous commit or image.
- Database: application deployments do not run destructive migrations. Restore Atlas snapshots only for confirmed data corruption.

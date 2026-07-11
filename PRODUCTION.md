# Production Guide

## Applications

- `client/`: user-facing Vite application
- `admin/`: isolated admin Vite application
- `server/`: Express and MongoDB API

## Environment Separation

Copy the matching templates and replace every placeholder:

- `server/.env.development.example` or `server/.env.production.example`
- `client/.env.development.example` or `client/.env.production.example`
- `admin/.env.development.example` or `admin/.env.production.example`

Never commit `.env` files. Production startup fails when the JWT secret is weak or CORS origins are not explicit.

## Build

```powershell
cd client
npm.cmd ci
npm.cmd run build
```

```powershell
cd admin
npm.cmd ci
npm.cmd run build
```

Serve each `dist/` directory behind HTTPS with immutable caching for hashed assets and SPA fallback to `index.html`.

## API Deployment

```powershell
cd server
npm.cmd ci --omit=dev
npm.cmd run db:indexes
$env:NODE_ENV='production'
npm.cmd start
```

Use a process manager or container orchestrator that sends `SIGTERM` and checks `GET /health`.

## Security And Performance

- Helmet, strict CORS, body-size limits, Mongo-safe key checks, JWT revocation, and API/auth rate limits are enabled.
- Pino writes structured JSON logs and redacts authorization headers, tokens, and password fields.
- GET response caching is short-lived and automatically invalidated after successful mutations.
- The included cache and rate-limit stores are process-local. Use Redis-backed stores before scaling the API to multiple instances.
- MongoDB indexes are declared in schemas. `db:indexes` creates missing indexes without dropping unrelated indexes.
- Vite emits route-level lazy chunks and separate React/router/HTTP vendor chunks.
- Runtime visual assets are SVG-only. Keep future raster images in WebP/AVIF, define dimensions, and use `loading="lazy"` plus `decoding="async"` below the fold.

## Reverse Proxy

- Forward `X-Forwarded-For` and enable `TRUST_PROXY=true` only behind a trusted proxy.
- Set long-lived immutable cache headers for `/assets/*`.
- Do not cache `index.html` or authenticated API responses at the proxy.

# Skills Tracker

Production-oriented MERN application with separate user and admin frontends.

## Structure

- `client/` - user-facing React and Vite application
- `admin/` - isolated admin React and Vite application
- `server/` - Express, MongoDB, and JWT API
- `deploy/nginx/` - SPA hosting and API reverse-proxy configuration
- `docker-compose.yml` - complete local/container deployment using MongoDB Atlas

## Local Development

Install all application dependencies:

```powershell
npm.cmd run install:all
```

Start each process in a separate terminal:

```powershell
npm.cmd run dev:server
npm.cmd run dev:client
npm.cmd run dev:admin
```

- User app: `http://127.0.0.1:5173`
- Admin app: `http://127.0.0.1:5174`
- API health: `http://127.0.0.1:5000/health`

## Production

- [Deployment guide](./DEPLOYMENT.md)
- [Production hardening guide](./PRODUCTION.md)

Never commit `.env` files. Use the checked-in `*.example` templates.

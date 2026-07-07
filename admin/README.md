# Skills Tracker Admin

Independent admin frontend for the Skills Tracker API.

## Run

1. Set `VITE_API_BASE` in `.env` when the API is not running at `http://localhost:5000/api`.
2. Run `npm install`.
3. Run `npm run dev`.

The admin app runs at `http://127.0.0.1:5174`.

Admin accounts are controlled by the backend `ADMIN_EMAILS` environment variable. Regular users cannot access admin APIs.

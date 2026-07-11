# Skills Tracker - Server

Express API with JWT authentication and email OTP verification.

## Usage

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASS`.
3. Add comma-separated admin emails to `ADMIN_EMAILS` to grant admin role.
4. Install dependencies: `npm install`
5. Run in development: `npm run dev`

For Gmail SMTP, use a Gmail App Password in `EMAIL_PASS`.

## Auth Endpoints

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-forgot-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Successful auth responses use:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

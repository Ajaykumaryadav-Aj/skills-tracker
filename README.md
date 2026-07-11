# Skills Learning Tracker 🚀

A production-ready, full-stack MERN (MongoDB, Express, React, Node.js) monorepo application designed to help users structure learning paths, log study sessions, track progress, utilize spaced repetition for revisions, collaborate in teams, earn gamified achievements, and get AI-assisted recommendations.

---

## 🌟 Features

### For Users
- **Hierarchical Skills Tracker**: Manage skills down from *Skills* $\rightarrow$ *Topics* $\rightarrow$ *Subtopics* with real-time progress calculations.
- **Roadmap Templates**: Browse, preview, and import professional predefined paths (Frontend, Backend, React, Node.js, and Full Stack Developer) or create a custom path.
- **Smart Revisions**: Spaced repetition algorithm to schedule and prompt users for revisions based on memory recall intervals.
- **AI Assistant**: Conversational study companion supporting study guides, customizable quizzes, flashcard summaries, and learning roadmap suggestions.
- **Gamification**: Completing tasks earns Experience Points (XP), levels, unlocks milestone achievements, and tracks study streaks.
- **Collaboration**: Form learning teams, invite members, and share learning roadmaps.

### For Admins
- **Admin Dashboard**: Comprehensive operations oversight showing stats, active users, and system live status.
- **User Management**: View user stats (logs, progress, roadmaps), filter by role/search, and delete users securely.
- **Audit Logging**: Dedicated tab displaying paginated, filterable, and expandable security and CRUD events.
- **AI Analytics**: Provider and model prompt request distribution tracking.
- **Storage Metrics**: Profile uploads directory footprint calculation.

### System & Security Hardening
- **Helmet & CORS Configurations**: Hardened security policies and whitelisted origins.
- **Content Security Policy (CSP)**: Secure style, script, frame, and connect source restrictions.
- **XSS Protection**: HTML-sanitized body, query, and parameter parsing.
- **NoSQL Injection Defenses**: Prohibit prototype pollution and strip Mongoose operator keys.
- **Rate Limiting**: Protect authentication endpoints (10 requests/15m) and AI interfaces (60 requests/15m).
- **Graceful Shutdown**: Safe cleanup of server connections and Mongoose pools.

---

## 📁 Folder Structure

```
skills-tracker/
├── .github/workflows/    # CI/CD pipelines
│   └── ci.yml
├── admin/                # Admin SPA (Vite + Tailwind CSS v4 + React 19)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   └── AdminDashboard.jsx
│   │   └── services/
│   └── Dockerfile
├── client/               # User SPA (Vite + Tailwind CSS v4 + React 19)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── Dockerfile
├── deploy/               # Deployment templates (Nginx, PM2)
│   ├── nginx/
│   │   ├── client.conf
│   │   └── admin.conf
│   └── pm2/
│       └── ecosystem.config.cjs
├── server/               # Express & Mongoose API Server
│   ├── src/
│   │   ├── config/       # Swagger, DB, Logger configurations
│   │   ├── controllers/  # API endpoints controllers
│   │   ├── middlewares/  # Security, Auth, Rate limiters, Sanitizers
│   │   ├── models/       # Mongoose schemas (AuditLog, User, Skill)
│   │   ├── routes/       # API endpoints routes
│   │   └── services/     # AI, Gamification, OTP, Revisions services
│   └── Dockerfile
├── docker-compose.yml    # Monorepo containerization configuration
└── package.json          # Root monorepo workspace configurations
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (version 22.x recommended)
- MongoDB (running instance)

### Local Dev Setup
1. Clone the repository and navigate into it:
   ```bash
   cd skills-tracker
   ```
2. Install dependencies for all prefix folders:
   ```bash
   npm run install:all
   ```
3. Initialize the database template roadmaps (one-time seed):
   ```bash
   cd server
   npm run seed
   ```
4. Start each process in a separate terminal:
   ```bash
   npm run dev:server    # Runs Express API on http://127.0.0.1:5000
   npm run dev:client    # Runs User frontend on http://127.0.0.1:5173
   npm run dev:admin     # Runs Admin frontend on http://127.0.0.1:5174
   ```

### Running Tests
- **Backend Tests** (runs integration tests using the native Node test runner):
  ```bash
  npm --prefix server run test
  ```
- **Frontend Tests** (runs React component tests using Vitest):
  ```bash
  npm --prefix client run test
  ```

---

## ⚙️ Environment Variables

Copy the global `.env.example` to `.env` or configuration layers:

```ini
# Server Deployment Config
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:27017/skills_tracker
JWT_SECRET=replace_with_a_secure_32_character_long_string
JWT_EXPIRES_IN=7d

# Authorization / Role Based Setup
ADMIN_EMAILS=admin@example.com,developer@example.com
CORS_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:5173,http://localhost:5174

# Email SMTP Credentials (Registration OTPs / Password Resets)
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password

# AI Integrations API Keys
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key

# Cloudinary Storage Configurations (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Docker/Web Port variables
WEB_PORT=8080
ADMIN_PORT=8081
```

---

## 📖 API Documentation & Status Probes

Once the server is running, you can access the self-documenting OpenAPI specifications:
- **API Swagger Documentation**: [http://localhost:5000/api-docs/](http://localhost:5000/api-docs/)
- **Liveness probe**: [http://localhost:5000/health](http://localhost:5000/health)
- **Readiness probe**: [http://localhost:5000/readiness](http://localhost:5000/readiness)

---

## 🚀 Deployment Guide

### Frontend Deployment (Client & Admin)
- **Vercel / Netlify**: Connect your GitHub repository. Since it is a monorepo structure, set the Root Directory to `client/` (for user portal) or `admin/` (for admin portal). Configure build command to `npm run build` and output directory to `dist`. Add environment variables (like `VITE_API_BASE`).

### Backend Deployment
- **Render / Railway**: Link the repository and set the root directory to `server/`. Use the start command `npm start` and add required environment variables (`MONGO_URI`, `JWT_SECRET`, etc.).
- **VPS (PM2 + Nginx)**: Clone this project onto your server. Install dependencies. Copy the custom configurations from `deploy/nginx/` and `deploy/pm2/ecosystem.config.cjs` to your VPS instance. Run `pm2 start deploy/pm2/ecosystem.config.cjs --env production` to start the cluster.

---

## 📸 Screenshots

*(Placeholders)*

### User Dashboard Page
![User Dashboard](/assets/screenshots/user-dashboard-placeholder.png)

### Admin Operations Page
![Admin Dashboard](/assets/screenshots/admin-dashboard-placeholder.png)

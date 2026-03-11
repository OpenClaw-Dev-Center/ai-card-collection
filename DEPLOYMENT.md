# Deployment Guide

This guide covers deploying the AI Card Collection backend and connecting it to the frontend.

## Architecture Overview

```
Frontend (Vite + React) ──HTTP/WebSocket──► Backend (Node.js + Express)
         │                                          │
         │                                   PostgreSQL
         │                                          │
         └────────────── GitHub Pages ◄───────────┘
```

## Backend Deployment Options

### Option 1: Railway (Recommended)

Railway provides easy deployment with managed PostgreSQL.

1. **Push backend to repository** (already in `/backend` folder)

2. **Create new Railway service:**
   - Go to https://railway.app
   - Create new project → "Deploy from GitHub repo"
   - Select your repository
   - Set root directory to `backend`
   - Add PostgreSQL plugin

3. **Configure environment variables** in Railway dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=generate-a-strong-random-string`
   - `FRONTEND_URL=https://openclaw-dev-center.github.io`
   - Database connection (`DATABASE_URL`) auto-provided by PostgreSQL plugin

4. **Deploy:**
   - Railway will auto-deploy on git push
   - Get your service URL (e.g., `https://ai-card-collection-backend.up.railway.app`)

5. **Run migrations:**
   ```bash
   railway run psql -U postgres -d railway -f migrations/001_initial_schema.sql
   ```

### Option 2: Render

Render also offers free tier with managed PostgreSQL.

1. **Create Web Service:**
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `backend`

2. **Create PostgreSQL database** (separate Render service)

3. **Add environment variables**:
   - Same as Railway
   - `DATABASE_URL` from your Render PostgreSQL

4. **Manual migration** via Render Shell:
   ```bash
   psql $DATABASE_URL -f migrations/001_initial_schema.sql
   ```

### Option 3: Fly.io

For global edge deployment.

1. Install flyctl and login
2. `fly launch` in `backend` directory
3. Add PostgreSQL volume or use managed Postgres
4. Set env vars in `fly.toml`
5. `fly deploy`

## Database Options

1. **Railway PostgreSQL** – easiest, $5/month free tier
2. **Render PostgreSQL** – free tier available
3. **Neon** – serverless Postgres with free tier
4. **Supabase** – Postgres + auth + realtime (could replace JWT)
5. **PlanetScale** – MySQL only (would need schema conversion)

**Recommendation:** Use Railway or Render PostgreSQL for simplicity.

## Connecting Frontend to Backend

1. **Set VITE_API_URL** in frontend build environment:

   Create `.env.production` in project root:
   ```env
   VITE_API_URL=https://your-backend-url.up.railway.app/api
   ```

2. **Re-build and re-deploy frontend**:
   ```bash
   npm run build
   npx angular-cli-ghpages --dir=dist
   ```

3. **Update CORS** in backend `.env` to include your frontend URL:
   ```env
   FRONTEND_URL=https://openclaw-dev-center.github.io
   ```

## Testing the API

After deployment, test with:

```bash
# Health check
curl https://your-backend/api/health

# Register test user
curl -X POST https://your-backend/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Login
curl -X POST https://your-backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

## WebSocket Endpoint

Frontend connects to:
- Development: `ws://localhost:3001`
- Production: `wss://your-backend-url/ws` (same host as API)

The `battleSocket.js` client auto-detects protocol based on page protocol.

## Database Migrations

To apply schema changes:

```bash
# Via railway/run or render shell
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

Future migrations: add `002_...sql` and run sequentially.

## Monitoring & Maintenance

- Railway/Render provide logs dashboard
- Set up error tracking (Sentry, LogRocket)
- Database backups: automatic on Railway/Render
- Monitor connection pool size (currently max 20)

## Next Steps After Deployment

1. Update `useAuth` hook to persist login state properly
2. Implement offline queueing (actions saved locally and synced when online)
3. Add battle replay storage (large JSONB may need separate table)
4. Add rate limiting (express-rate-limit)
5. Add request validation (Joi or zod)
6. Implement refresh tokens for better security
7. Add admin panel for moderation
8. Set up CI/CD for backend (GitHub Actions)

## Troubleshooting

- **401 errors:** Check JWT_SECRET is set and consistent
- **CORS errors:** Ensure FRONTEND_URL matches exactly
- **Database connection:** Verify DATABASE_URL format
- **WebSocket not connecting:** Ensure server allows WS upgrade (CORS for WS)
- **Empty responses:** Check server logs for errors (Railway/Render dashboard)

# 🎴 AI Card Collection

A fancy card collection game where you collect, upgrade, and battle with AI models from major providers like Claude, GPT, Gemini, Llama, and more! Now with **multiplayer backend** for PvP battles and cloud progression.

<div align="center">

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

[![Deploy with GitHub Pages](https://github.com/OpenClaw-Dev-Center/ai-card-collection/actions/workflows/deploy.yml/badge.svg)](https://openclaw-dev-center.github.io/ai-card-collection/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Features

- 🎴 **Collect AI Models** - Collect cards representing real AI models with different rarities (Common, Rare, Epic, Legendary, Mythic)
- 🎯 **Upgrade System** - Use duplicate cards to upgrade versions (Claude Opus 4.5 → 4.6, GPT-4 → GPT-4o, etc.)
- ⚔️ **Singleplayer Battles** - Battle AI models using their unique stats (Power, Speed, Intelligence, Creativity)
- 🌐 **Multiplayer PvP** - Real-time online battles with matchmaking via WebSocket
- 💾 **Cloud Saves** - Your collection, currency, and stats sync across devices when logged in
- 🏆 **Global Leaderboard** - Compete for top spots by wins, win rate, or playtime
- 🎁 **Pack Opening** - Enjoy fancy pack opening animations with rarity-based rewards
- 🔐 **Secure Auth** - Register/login with JWT authentication and hashed passwords
- 💎 **Fancy Animations** - Experience smooth Framer Motion animations, shimmer effects, and glossy card designs
- 📱 **Responsive Design** - Works on desktop and mobile
- 🚀 **GitHub Pages Ready** - Frontend automatically deployed via GitHub Actions
- 🔧 **Production-Ready Backend** - Full PostgreSQL schema, REST API, and WebSocket server

---

## 🎮 How to Play

1. **Register / Login** - Create an account or sign in (cloud sync requires login)
2. **Open Packs** - Use your starting credits or earn more by playing to open packs
   - Basic Pack (100 credits) - 5 cards, guarantees Common+
   - Premium Pack (500 credits) - 5 cards, guarantees Rare+
   - Mega Pack (2000 credits) - 10 cards, guarantees Epic+
   - Legendary Pack (10000 credits) - 5 cards, guarantees Legendary+
3. **Build Your Collection** - View all your cards in the Collection tab
4. **Upgrade Cards** - Use duplicates and currency to upgrade card versions
5. **Battle Arena** - Select a card and battle against random opponents in turn-based stat competition
6. **Multiplayer** - Play real-time PvP battles against other players with automatic matchmaking
7. **Earn Rewards** - Win battles to earn credits, packs, and climb the leaderboard

---

## 🏗️ Architecture

The application consists of two main parts:

### Frontend (GitHub Pages)
- React + Vite SPA
- Tailwind CSS for styling
- Framer Motion animations
- localStorage fallback for offline play
- Deployed automatically to GitHub Pages

### Backend (Separate Hosting)
- Node.js + Express API server
- PostgreSQL database
- JWT authentication
- WebSocket for real-time battles
- RESTful endpoints for user data, leaderboard, battle history

**Frontend:** `https://openclaw-dev-center.github.io/ai-card-collection/`
**Backend:** Deploy to Railway/Render and set `VITE_API_URL` in frontend build.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion + GSAP
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Deployment:** GitHub Pages

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Realtime:** WebSocket (ws library)
- **ORM:** None (raw SQL)

---

## 🚀 Quick Start

### Frontend Development

```bash
# Clone the repository
git clone https://github.com/OpenClaw-Dev-Center/ai-card-collection.git
cd ai-card-collection

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Set up PostgreSQL database
createdb ai_card_collection
psql ai_card_collection < migrations/001_initial_schema.sql

# Start backend server
npm run dev
```

The backend will run on `http://localhost:3001` by default.

---

## 🌐 Deployment

### Frontend (GitHub Pages) - Already Configured

Push to `main` branch and GitHub Actions will automatically deploy:

```bash
git add .
git commit -m "Deploy update"
git push origin main
```

Site goes live at: `https://openclaw-dev-center.github.io/ai-card-collection/`

To configure backend URL for production:
1. Go to GitHub repo Settings → Pages
2. Add environment variable in GitHub Actions secrets:
   - `VITE_API_URL` = `https://your-backend-url.com`

### Backend Deployment

#### Railway (Recommended - Easiest)

1. Push code to GitHub
2. Create new Railway service, link to `ai-card-collection/backend` folder
3. Add PostgreSQL plugin (auto-provisions database)
4. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (auto-filled by plugin)
   - `JWT_SECRET` = random secure string
   - `FRONTEND_URL` = `https://openclaw-dev-center.github.io`
5. Deploy

Railway will give you a URL like: `https://ai-card-collection-backend.up.railway.app`

#### Render

1. Create new Web Service
2. Connect your GitHub repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add PostgreSQL database (separate service)
6. Connect via `DATABASE_URL` environment variable
7. Set other env vars:
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
8. Deploy

#### Manual VPS/Server

```bash
# Transfer code to server
scp -r backend/ user@server:/var/www/ai-card-collection/

# On server:
cd /var/www/ai-card-collection/backend
npm ci --only=production
sudo -u postgres createdb ai_card_collection
psql ai_card_collection < migrations/001_initial_schema.sql

# Set up systemd service or PM2
pm2 start server.js --name "ai-card-collection-api"
pm2 save
pm2 startup
```

---

## 🔧 Configuration

### Environment Variables (Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (use strong random) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `FRONTEND_URL` | Yes | Allowed CORS origin |
| `NODE_ENV` | No | `development` or `production` |

### GitHub Actions Secrets (Frontend)

Add these to your GitHub repo Settings → Secrets and variables → Actions:

- `VITE_API_URL` - Your deployed backend URL (e.g., `https://ai-card-collection-backend.up.railway.app`)

This gets injected at build time into the frontend.

---

## 📊 Database Schema

The backend uses PostgreSQL with the following main tables:

- **`users`** - Authentication data (username, email, password hash)
- **`user_profiles`** - Game state (credits, packs, collection JSONB, deck presets, stats)
- **`leaderboard_entries`** - Materialized leaderboard (auto-updated via trigger)
- **`battles`** - PvP battle history with replay data
- **`user_achievements`** - Optional achievements/stats

The schema includes triggers to automatically update the leaderboard when user profiles change.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET  /api/auth/me` - Get current user (requires Bearer token)

### User Data
- `GET    /api/users/:userId` - Get user profile (requires auth)
- `PUT    /api/users/:userId` - Update profile (requires auth)
- `POST  /api/users/:userId/battle/result` - Record battle result (requires auth)

### Leaderboard
- `GET /api/leaderboard?sort=active|wins|winrate&limit=100` - Get leaderboard

### WebSocket (Real-time)

Connect to `ws://your-backend/ws` (or `wss://` for secure).

**Client → Server:**
```json
{ "type": "join_queue", "userId": "..." }
{ "type": "battle_move", "battleId": "...", "move": "strike" }
{ "type": "leave_queue", "userId": "..." }
```

**Server → Client:**
```json
{ "type": "queued", "position": 3 }
{ "type": "battle_found", "battleId": "...", "opponent": { "userId": "..." } }
{ "type": "opponent_move", "battleId": "...", "move": "strike" }
{ "type": "turn_update", "battleId": "...", "turn": 5, "player1": {...}, "player2": {...} }
```

---

## 🧪 Testing

```bash
# Frontend tests (if configured)
npm test

# Backend tests
cd backend
npm test

# API health check
curl https://your-backend.com/health

# Create test user
curl -X POST https://your-backend.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'
```

---

## 🔐 Security Notes

- Change `JWT_SECRET` to a strong random value in production
- Enable CORS only for your frontend domain
- Use HTTPS/WSS in production
- Add rate limiting on auth endpoints
- Validate all user inputs (currently basic validation)
- Store passwords with bcrypt (already implemented)
- Consider adding SQL injection protection (currently using parameterized queries)

---

## 🚧 Known Limitations & Future Work

- Battle resolution logic on server is minimal (mostly placeholder)
- No deck validation against user's collection yet
- No replay storage/playback feature
- No anti-cheat beyond basic auth
- Leaderboard updates are immediate via trigger (could optimize with materialized view refresh)
- No admin/moderator endpoints
- No email verification or password reset

**Planned:**
- Full battle resolution mirroring frontend logic
- Deck validation
- Replay system
- Rate limiting
- Logging/monitoring (Sentry)
- Admin panel
- Push notifications for battles
- Matchmaking rating (MMR) system

---

## 📝 License

MIT License - feel free to fork, modify, and use!

---

<div align="center">

**Built with ⚙️ by the OpenClaw team**

[🌐 Live Site](https://openclaw-dev-center.github.io/ai-card-collection/) • [💻 Source](https://github.com/OpenClaw-Dev-Center/ai-card-collection)

</div>

# AI Card Collection - Backend

Node.js + Express backend with PostgreSQL for multiplayer features.

## Features

- User authentication (register/login with JWT)
- Game state persistence (credits, packs, collection, deck presets)
- Battle history recording
- Global leaderboard with multiple sorting modes
- Real-time PvP battles via WebSocket
- Matchmaking queue
- Deck Battle presets

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Realtime:** WebSocket (ws)
- **ORM:** None (raw SQL)

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Set up PostgreSQL database:
   ```bash
   # Run migrations
   psql -U username -d database -f migrations/001_initial_schema.sql
   ```

4. Start server:
   ```bash
   npm run dev  # development with auto-reload
   npm start    # production
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### User Data
- `GET /api/users/:userId` - Get user profile and game state (protected)
- `PUT /api/users/:userId` - Update user data (protected)
- `POST /api/users/:userId/battle/result` - Record battle result (protected)

### Leaderboard
- `GET /api/leaderboard?sort=active|wins|winrate` - Get leaderboard

### Matchmaking (WebSocket)
- `ws://your-server/ws` - WebSocket endpoint
- Send `{ type: 'join_queue', userId: '...' }` to enter matchmaking
- Receive `{ type: 'battle_found', battleId: '...', opponent: { userId } }`
- Send `{ type: 'battle_move', battleId: '...', move: 'strike' }` during battle
- Receive `{ type: 'battle_update', battleId: '...', playerMove: '...' }`

## Database Schema

- `users` - Authentication data
- `user_profiles` - Game state (credits, packs, collection, stats)
- `leaderboard_entries` - Materialized leaderboard (auto-updated via trigger)
- `battles` - PvP battle history
- `user_achievements` - Optional achievements/stats

## Deployment

### Railway
1. Push code to GitHub
2. Create new Railway service, link repository
3. Set environment variables in Railway dashboard
4. Add PostgreSQL plugin (auto-provisions database)
5. Deploy

### Render
1. Create new Web Service
2. Build command: `npm install`
3. Start command: `npm start`
4. Add PostgreSQL database (separate service)
5. Connect via `DATABASE_URL` env var

### Vercel
Not recommended for WebSocket + PostgreSQL, but possible with serverless functions + Neon database.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - development|production
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (use strong random)
- `JWT_EXPIRES_IN` - Token expiry (default: 7d)
- `FRONTEND_URL` - Allowed CORS origin

## Next Steps

- Implement full battle resolution on server (mirror frontend logic)
- Add room-based battle state management
- Implement deck validation
- Add replay storage and playback
- Add anti-cheat measures (validate moves, energy, etc.)
- Implement rate limiting
- Add logging/monitoring (Sentry, etc.)
- Add admin endpoints for moderation

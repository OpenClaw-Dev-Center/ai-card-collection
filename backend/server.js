import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import leaderboardRoutes from './routes/leaderboard.js';
import { query } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Return a clear error for oversized payloads instead of a generic 500.
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      details: 'Request body exceeds server limit. Try sending smaller updates.'
    });
  }
  return next(err);
});

// In-memory stores (will be replaced with proper state management)
const activeBattles = new Map(); // battleId -> battle state
const waitingQueue = []; // players waiting for match
const wsConnections = new Map(); // userId -> WebSocket

// WebSocket handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { type, userId, battleId, move } = data;

      // Store connection by userId if provided
      if (userId) {
        wsConnections.set(userId, ws);
      }

      switch (type) {
        case 'join_queue':
          if (userId) {
            // Remove any existing queue entry for this user
            const existingIdx = waitingQueue.findIndex(p => p.userId === userId);
            if (existingIdx !== -1) {
              waitingQueue.splice(existingIdx, 1);
            }
            waitingQueue.push({ userId, joinedAt: Date.now() });
            ws.send(JSON.stringify({ type: 'queued', position: waitingQueue.length }));
            console.log(`User ${userId} joined queue. Queue size: ${waitingQueue.length}`);

            // Try to match players
            if (waitingQueue.length >= 2) {
              const player1 = waitingQueue.shift();
              const player2 = waitingQueue.shift();
              const battleId = 'battle_' + Math.random().toString(36).substr(2, 9);

              // Create battle state
              activeBattles.set(battleId, {
                id: battleId,
                player1: { userId: player1.userId, hp: 100, energy: 100, move: null, deck: [] },
                player2: { userId: player2.userId, hp: 100, energy: 100, move: null, deck: [] },
                turn: 1,
                status: 'active'
              });

              // Notify both players
              [player1.userId, player2.userId].forEach(uid => {
                const wsConn = wsConnections.get(uid);
                if (wsConn && wsConn.readyState === 1) {
                  wsConn.send(JSON.stringify({
                    type: 'battle_found',
                    battleId,
                    opponent: { userId: uid === player1.userId ? player2.userId : player1.userId }
                  }));
                }
              });

              console.log(`Battle started: ${battleId}`);
            }
          }
          break;

        case 'battle_move':
          const battle = activeBattles.get(battleId);
          if (battle) {
            const playerKey = battle.player1.userId === userId ? 'player1' : battle.player2.userId === userId ? 'player2' : null;
            if (playerKey) {
              battle[playerKey].move = move;

              // Broadcast to opponent
              const opponentUserId = playerKey === 'player1' ? battle.player2.userId : battle.player1.userId;
              const opponentWs = wsConnections.get(opponentUserId);
              if (opponentWs && opponentWs.readyState === 1) {
                opponentWs.send(JSON.stringify({
                  type: 'opponent_move',
                  battleId,
                  move
                }));
              }

              // If both players moved, resolve turn
              if (battle.player1.move && battle.player2.move) {
                resolveBattleTurn(battle, wss);
              }
            }
          }
          break;

        case 'leave_queue':
          const idx = waitingQueue.findIndex(p => p.userId === userId);
          if (idx !== -1) {
            waitingQueue.splice(idx, 1);
          }
          break;
      }
    } catch (err) {
      console.error('WebSocket error:', err);
    }
  });

  ws.on('close', () => {
    // Clean up connection
    for (const [userId, connection] of wsConnections.entries()) {
      if (connection === ws) {
        wsConnections.delete(userId);
        break;
      }
    }
  });
});

async function resolveBattleTurn(battle, wss) {
  // Basic resolution (energy regen and move clearing for now)
  // Full implementation will mirror frontend's resolveTurn logic

  const { player1, player2 } = battle;

  // Energy regeneration (25 base, +37 if Gemini Flux synergy)
  const energyRegen1 = 25; // TODO: calculate based on deck synergies
  const energyRegen2 = 25;

  player1.energy = Math.min(100, player1.energy + energyRegen1);
  player2.energy = Math.min(100, player2.energy + energyRegen2);

  // Clear moves for next turn
  player1.move = null;
  player2.move = null;
  battle.turn++;

  // Send turn update to both players
  const update = {
    type: 'turn_update',
    battleId: battle.id,
    turn: battle.turn,
    player1: { hp: player1.hp, energy: player1.energy },
    player2: { hp: player2.hp, energy: player2.energy }
  };

  [player1.userId, player2.userId].forEach(uid => {
    const ws = wsConnections.get(uid);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(update));
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`WebSocket ready for real-time battles`);
});

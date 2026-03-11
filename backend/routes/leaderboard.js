import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Get leaderboard with sorting
// Supported sort: 'active' (default, by playtimeHours), 'wins', 'winrate'
router.get('/', async (req, res) => {
  try {
    const { sort = 'active', limit = 100 } = req.query;
    let orderBy;

    switch (sort) {
      case 'wins':
        orderBy = 'wins DESC, win_rate DESC';
        break;
      case 'winrate':
        orderBy = 'win_rate DESC, wins DESC';
        break;
      case 'active':
      default:
        orderBy = 'playtime_hours DESC, total_battles DESC';
        break;
    }

    const result = await query(
      `SELECT l.user_id, l.wins, l.losses, l.total_battles, l.win_rate, l.playtime_hours,
              u.username
       FROM leaderboard_entries l
       JOIN users u ON u.id = l.user_id
       ORDER BY ${orderBy}
       LIMIT $1`,
      [ parseInt(limit) ]
    );

    // Get overall stats
    const playersResult = await query('SELECT COUNT(*) as total_players FROM users');
    const battlesResult = await query('SELECT COUNT(*) as total_battles FROM battles');

    const totalPlayers = parseInt(playersResult.rows[0].total_players);
    const totalBattles = parseInt(battlesResult.rows[0].total_battles);

    res.json({
      leaderboard: result.rows.map(row => ({
        userId: row.user_id,
        username: row.username,
        wins: row.wins,
        losses: row.losses,
        totalBattles: row.total_battles,
        winRate: parseFloat(row.win_rate).toFixed(1),
        playtimeHours: parseFloat(row.playtime_hours).toFixed(1)
      })),
      stats: {
        totalPlayers,
        totalBattles
      }
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;

import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Helper: authenticate JWT
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user profile + game state
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req;

    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only access your own profile' });
    }

    const profileResult = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    let profile;
    if (profileResult.rows.length === 0) {
      // Auto-create profile for users that pre-date profile creation
      const insertResult = await query(
        `INSERT INTO user_profiles (user_id, credits, packs, collection, stats)
         VALUES ($1, 0, '{"basic": 1}'::jsonb, '[]'::jsonb, '{"wins": 0, "losses": 0, "totalBattles": 0, "playtimeHours": 0}'::jsonb)
         RETURNING *`,
        [userId]
      );
      profile = insertResult.rows[0];
    } else {
      profile = profileResult.rows[0];
    }

    res.json({
      credits: profile.credits,
      prestigeCrystals: profile.prestige_crystals,
      packs: profile.packs,
      collection: profile.collection,
      deckPresets: profile.deck_presets,
      stats: profile.stats
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (currency, packs, collection)
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req;

    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only update your own profile' });
    }

    const { credits, prestigeCrystals, packs, collection, deckPresets, stats } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (credits !== undefined) {
      updates.push(`credits = $${paramCount++}`);
      values.push(credits);
    }
    if (prestigeCrystals !== undefined) {
      updates.push(`prestige_crystals = $${paramCount++}`);
      values.push(prestigeCrystals);
    }
    if (packs !== undefined) {
      updates.push(`packs = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(packs));
    }
    if (collection !== undefined) {
      updates.push(`collection = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(collection));
    }
    if (deckPresets !== undefined) {
      updates.push(`deck_presets = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(deckPresets));
    }
    if (stats !== undefined) {
      // Merge into existing stats so partial updates don't wipe other fields
      updates.push(`stats = stats || $${paramCount++}::jsonb`);
      values.push(JSON.stringify(stats));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const sql = `
      UPDATE user_profiles
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);

    res.json({
      message: 'Profile updated',
      profile: result.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Record battle result (wins, losses, playtime)
router.post('/:userId/battle/result', authenticate, async (req, res) => {
  try {
    const { userId } = req;

    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only record your own battles' });
    }

    const { result } = req.body; // 'win' | 'loss' | 'draw'
    const turnCount = req.body.turnCount || 0;
    const opponentId = req.body.opponentId;

    // Get current stats
    const profileResult = await query(
      'SELECT stats FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const stats = profileResult.rows[0].stats;

    // Update stats
    stats.totalBattles = (stats.totalBattles || 0) + 1;
    if (result === 'win') {
      stats.wins = (stats.wins || 0) + 1;
    } else if (result === 'loss') {
      stats.losses = (stats.losses || 0) + 1;
    }
    // Playtime: 0.1 hours per battle
    stats.playtimeHours = (stats.playtimeHours || 0) + 0.1;

    // Save updated stats
    await query(
      'UPDATE user_profiles SET stats = $1, updated_at = NOW() WHERE user_id = $2',
      [JSON.stringify(stats), userId]
    );

    // Record battle in history table
    if (opponentId) {
      await query(
        `INSERT INTO battles (player1_id, player2_id, winner_id, turn_count, completed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          result === 'win' ? userId : opponentId,
          result === 'win' ? opponentId : userId,
          result === 'win' ? userId : result === 'loss' ? opponentId : null,
          turnCount
        ]
      );
    }

    res.json({
      message: 'Battle result recorded',
      stats
    });
  } catch (err) {
    console.error('Battle result error:', err);
    res.status(500).json({ error: 'Failed to record battle' });
  }
});

export default router;

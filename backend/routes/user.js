import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import {
  CARD_POOL,
  PACK_TYPES,
  PRESTIGE_CRYSTAL_VALUES,
  VERSION_PROGRESSION,
  getTotalDupesNeededToMax,
} from '../gameData.js';

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

    const { credits, prestigeCrystals, packs, collection, collectionAppend, deckPresets, stats } = req.body;

    // Security hardening: prevent clients from directly mutating economy/progression.
    // Sensitive fields are only changed through server-authoritative endpoints.
    const attemptedSensitiveUpdate = (
      credits !== undefined ||
      prestigeCrystals !== undefined ||
      packs !== undefined ||
      collection !== undefined ||
      collectionAppend !== undefined ||
      stats !== undefined
    );
    if (attemptedSensitiveUpdate) {
      return res.status(403).json({
        error: 'Direct profile mutation is not allowed for economy/progression fields'
      });
    }

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
    if (collection !== undefined || collectionAppend !== undefined) {
      return res.status(403).json({ error: 'Collection updates must use dedicated endpoints' });
    }
    if (deckPresets !== undefined) {
      updates.push(`deck_presets = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(deckPresets));
    }
    if (stats !== undefined) {
      return res.status(403).json({ error: 'Stats updates must use dedicated endpoints' });
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

function pickPackCard(pack, slotIndex) {
  const overrides = pack.probabilityOverrides || {};
  const rarityKeys = Object.keys(overrides);
  if (rarityKeys.length === 0) throw new Error('Invalid pack probability config');

  const rand = Math.random();
  let cumulative = 0;
  let chosenRarity = rarityKeys[rarityKeys.length - 1];
  for (const key of rarityKeys) {
    cumulative += overrides[key];
    if (rand <= cumulative) { chosenRarity = key; break; }
  }

  if (slotIndex === 0 && pack.guaranteedRarity) {
    const rarityOrder = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, MYTHIC: 4 };
    if ((rarityOrder[chosenRarity] ?? 0) < (rarityOrder[pack.guaranteedRarity] ?? 0)) {
      chosenRarity = pack.guaranteedRarity;
    }
  }

  const filtered = CARD_POOL.filter(c => {
    if (c.rarity !== chosenRarity) return false;
    if (pack.providerFilter && pack.providerFilter.length > 0) {
      return pack.providerFilter.includes(c.provider);
    }
    return true;
  });
  const fallback = CARD_POOL.filter(c => c.rarity === chosenRarity);
  const finalPool = filtered.length > 0 ? filtered : fallback;
  const base = finalPool[Math.floor(Math.random() * finalPool.length)];

  return {
    ...base,
    id: `${base.baseId}-${randomUUID()}`,
  };
}

function shouldConvertToPrestige(card, collection) {
  const sameCopies = collection.filter(c => c.baseId === card.baseId && c.rarity === card.rarity);
  const hasMaxedCopy = sameCopies.some(c => !VERSION_PROGRESSION[c.version]);
  if (hasMaxedCopy) return true;
  if (sameCopies.length === 0) return false;

  let minNeeded = Infinity;
  for (const c of sameCopies) {
    const needed = getTotalDupesNeededToMax(c);
    if (needed < minNeeded) minNeeded = needed;
  }
  return sameCopies.length >= minNeeded;
}

// Server-authoritative pack opening: validates stock/cost and generates cards server-side.
router.post('/:userId/packs/open', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only open packs for your own profile' });
    }

    const packKeyInput = String(req.body.packKey || '').trim();
    const fromStock = !!req.body.fromStock;
    if (!packKeyInput) return res.status(400).json({ error: 'packKey is required' });

    const packKeyUpper = packKeyInput.toUpperCase();
    const packKeyLower = packKeyInput.toLowerCase();
    const pack = PACK_TYPES[packKeyUpper];
    if (!pack) return res.status(400).json({ error: 'Invalid pack type' });

    const profileResult = await query(
      'SELECT credits, prestige_crystals, packs, collection FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = profileResult.rows[0];
    const packs = profile.packs || {};
    const collection = Array.isArray(profile.collection) ? profile.collection : [];
    let credits = Number(profile.credits || 0);
    let prestigeCrystals = Number(profile.prestige_crystals || 0);
    const nextPacks = { ...packs };

    if (fromStock) {
      const owned = Number(nextPacks[packKeyLower] || 0);
      if (owned <= 0) {
        return res.status(400).json({ error: 'No pack stock available' });
      }
      nextPacks[packKeyLower] = owned - 1;
    } else {
      if (pack.rewardOnly) {
        return res.status(400).json({ error: 'Reward-only packs cannot be purchased directly' });
      }
      if (credits < pack.cost) {
        return res.status(400).json({ error: 'Not enough credits' });
      }
      credits -= pack.cost;
    }

    const pulledCards = [];
    for (let i = 0; i < pack.cards; i++) {
      pulledCards.push(pickPackCard(pack, i));
    }

    const keptCards = [];
    let crystalsGained = 0;
    let workingCollection = [...collection];
    for (const card of pulledCards) {
      if (shouldConvertToPrestige(card, workingCollection)) {
        crystalsGained += PRESTIGE_CRYSTAL_VALUES[card.rarity] || 0;
      } else {
        keptCards.push(card);
        workingCollection.push(card);
      }
    }
    prestigeCrystals += crystalsGained;

    const updated = await query(
      `UPDATE user_profiles
       SET credits = $1,
           prestige_crystals = $2,
           packs = $3::jsonb,
           collection = $4::jsonb,
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [credits, prestigeCrystals, JSON.stringify(nextPacks), JSON.stringify(workingCollection), userId]
    );

    const row = updated.rows[0];
    return res.json({
      message: 'Pack opened',
      cards: keptCards,
      crystalsGained,
      profile: {
        credits: row.credits,
        prestigeCrystals: row.prestige_crystals,
        packs: row.packs,
        collection: row.collection,
        deckPresets: row.deck_presets,
        stats: row.stats,
      }
    });
  } catch (err) {
    console.error('Open pack error:', err);
    return res.status(500).json({ error: 'Failed to open pack' });
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
    const turnCount = Number(req.body.turnCount || 0);
    const opponentId = req.body.opponentId;

    if (!['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({ error: 'Invalid result value' });
    }
    if (!opponentId) {
      return res.status(400).json({ error: 'opponentId is required for result recording' });
    }
    if (opponentId === userId) {
      return res.status(400).json({ error: 'opponentId cannot be your own user id' });
    }
    if (!Number.isFinite(turnCount) || turnCount < 1 || turnCount > 500) {
      return res.status(400).json({ error: 'turnCount out of allowed range' });
    }

    const opponentCheck = await query('SELECT id FROM users WHERE id = $1', [opponentId]);
    if (opponentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid opponentId' });
    }

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

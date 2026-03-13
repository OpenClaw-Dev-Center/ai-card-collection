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
import { getBossForHour, getHourPeriodStart } from '../bossData.js';

const RARITY_ORDER = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5 };

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildBossRaidState(now = new Date()) {
  const boss = getBossForHour(now);
  return {
    periodStart: getHourPeriodStart(now),
    bossId: boss.id,
    bossName: boss.name,
    bossIcon: boss.icon,
    bossColor: boss.color,
    mechanic: boss.mechanic,
    gimmick: boss.gimmick,
    vulnerable: boss.vulnerable,
    resistant: boss.resistant,
    maxHp: boss.maxHp,
    hp: boss.maxHp,
    attemptsUsed: 0,
    maxAttempts: 5,
    usedCardIds: [],
    defeated: false,
    rewardGranted: false,
    consolationGranted: false,
  };
}

function normalizeBossRaid(stats, now = new Date()) {
  const normalized = clone(stats || {});
  const currentPeriod = getHourPeriodStart(now);
  if (!normalized.bossRaid || normalized.bossRaid.periodStart !== currentPeriod) {
    normalized.bossRaid = buildBossRaidState(now);
  } else if (normalized.bossRaid.consolationGranted === undefined) {
    // Backfill field for users created before consolation payouts existed.
    normalized.bossRaid.consolationGranted = false;
  }
  return normalized;
}

function getConsolationRewardsForExhaustedRaid(raid) {
  if (!raid || raid.defeated || raid.consolationGranted) return null;
  if (raid.attemptsUsed < raid.maxAttempts) return null;

  const maxHp = Math.max(1, Number(raid.maxHp || 1));
  const hp = Math.max(0, Number(raid.hp || 0));
  const damageDone = Math.max(0, maxHp - hp);
  const ratio = damageDone / maxHp;

  // Partial payout for effort: meaningful at high damage, but still below boss-kill rewards.
  const credits = Math.floor(1200 + ratio * 7800);          // 1200..9000
  const prestigeCrystals = Math.floor(20 + ratio * 120);    // 20..140
  const packs = {};
  if (ratio >= 0.95) {
    packs.elite_pack = 1;
    packs.legendary = 1;
    packs.mega = 1;
  } else if (ratio >= 0.9) {
    packs.elite_pack = 1;
    packs.mega = 1;
  } else if (ratio >= 0.75) {
    packs.mega = 1;
  } else if (ratio >= 0.5) {
    packs.premium = 1;
  } else if (ratio >= 0.25) {
    packs.basic = 1;
  }

  return {
    credits,
    prestigeCrystals,
    packs,
    damageDone,
    damageRatio: ratio,
  };
}

function applyRewardsToProfileState({ credits, prestigeCrystals, packs }, rewards) {
  let nextCredits = Number(credits || 0) + Number(rewards?.credits || 0);
  let nextCrystals = Number(prestigeCrystals || 0) + Number(rewards?.prestigeCrystals || 0);
  const nextPacks = { ...(packs || {}) };
  for (const [k, v] of Object.entries(rewards?.packs || {})) {
    nextPacks[k] = (nextPacks[k] || 0) + v;
  }
  return { nextCredits, nextCrystals, nextPacks };
}

function getCardByIdFromCollection(collection, id) {
  return collection.find(c => c.id === id);
}

function strategicBossDamage(deckCards, raidState, actions = []) {
  const providerCounts = {};
  deckCards.forEach(c => {
    providerCounts[c.provider] = (providerCounts[c.provider] || 0) + 1;
  });
  const uniqueProviders = Object.keys(providerCounts).length;
  const tacticalNotes = [];

  let teamMult = 1;
  if (uniqueProviders >= 5) {
    teamMult *= 1.35;
    tacticalNotes.push('Perfect provider spread: +35% team damage');
  } else if (uniqueProviders === 4) {
    teamMult *= 1.2;
    tacticalNotes.push('Strong provider spread: +20% team damage');
  } else if (uniqueProviders <= 2) {
    teamMult *= 0.78;
    tacticalNotes.push('Low provider diversity: -22% team damage');
  }

  const hasControlCard = deckCards.some(c => (c.stats?.intelligence || 0) >= 92);
  const hasTempoCard = deckCards.some(c => (c.stats?.speed || 0) >= 90);
  if (hasControlCard && hasTempoCard) {
    teamMult *= 1.12;
    tacticalNotes.push('Control + tempo pair found: +12% team damage');
  }

  // Boss gets more hostile after each failed attempt
  const enrageMult = Math.max(0.65, 1 - raidState.attemptsUsed * 0.08);
  if (raidState.attemptsUsed > 0) {
    tacticalNotes.push(`Boss enrage x${enrageMult.toFixed(2)} due to prior attempts`);
  }

  let baseTotal = 0;
  const perCard = [];
  const providerSeen = {};

  deckCards.forEach((card, idx) => {
    const stats = card.stats || {};
    const rarityVal = RARITY_ORDER[card.rarity] || 1;
    const power = stats.power || 0;
    const speed = stats.speed || 0;
    const intelligence = stats.intelligence || 0;
    const creativity = stats.creativity || 0;

    let dmg = power * 0.75 + intelligence * 0.52 + creativity * 0.40 + speed * 0.33;

    // Provider weakness / resistance
    let providerMult = 1;
    if ((raidState.vulnerable || []).includes(card.provider)) providerMult += 0.34;
    if ((raidState.resistant || []).includes(card.provider)) providerMult -= 0.3;

    // Duplicate provider diminishing returns
    const sameProviderCount = providerCounts[card.provider] || 1;
    const duplicatePenalty = Math.max(0.52, 1 - (sameProviderCount - 1) * 0.18);

    // Boss unique mechanics
    let mechanicMult = 1;
    if (raidState.mechanic === 'adaptive_matrix') {
      providerSeen[card.provider] = (providerSeen[card.provider] || 0) + 1;
      if (providerSeen[card.provider] > 1) mechanicMult *= Math.max(0.55, 1 - (providerSeen[card.provider] - 1) * 0.25);
    }
    if (raidState.mechanic === 'reflective_aegis') {
      if (power > intelligence + 8) mechanicMult *= 0.68;
      if (intelligence >= 90) mechanicMult *= 1.12;
    }
    if (raidState.mechanic === 'chrono_lock') {
      if (idx < 2 && speed < 86) mechanicMult *= 0.6;
      if (speed >= 92) mechanicMult *= 1.1;
    }
    if (raidState.mechanic === 'entropy_field') {
      if (uniqueProviders < 3) mechanicMult *= 0.62;
      if (uniqueProviders >= 4) mechanicMult *= 1.1;
    }
    if (raidState.mechanic === 'quantum_veto') {
      if (idx % 2 === 1 && creativity < 90) mechanicMult *= 0.7;
      if (creativity >= 95) mechanicMult *= 1.08;
    }
    if (raidState.mechanic === 'hunter_protocol') {
      if (rarityVal >= 4) mechanicMult *= 0.8;
      if (rarityVal <= 2) mechanicMult *= 1.12;
    }

    const final = Math.floor(dmg * providerMult * duplicatePenalty * mechanicMult * teamMult * enrageMult);
    const clamped = Math.max(40, final);
    baseTotal += clamped;
    perCard.push({
      cardId: card.id,
      name: card.name,
      provider: card.provider,
      damage: clamped,
    });
  });

  const normalizedActions = Array.isArray(actions)
    ? actions.map(a => String(a).toLowerCase()).filter(a => ['strike', 'focus', 'guard', 'burst'].includes(a)).slice(0, 16)
    : [];

  let tacticalTotal = 0;
  let energy = 100;
  let focus = 0;
  let consecutivePenalty = 1;
  let lastAction = null;
  let guards = 0;

  normalizedActions.forEach((action, turn) => {
    const card = deckCards[turn % deckCards.length];
    const stats = card?.stats || {};
    const power = stats.power || 0;
    const speed = stats.speed || 0;
    const intelligence = stats.intelligence || 0;
    const creativity = stats.creativity || 0;

    const cost = action === 'strike' ? 20 : action === 'focus' ? 15 : action === 'guard' ? 10 : 35;
    if (energy < cost) {
      energy = Math.min(100, energy + 14);
      return;
    }
    energy = Math.max(0, energy - cost);

    if (lastAction === action) consecutivePenalty = Math.max(0.7, consecutivePenalty - 0.08);
    else consecutivePenalty = Math.min(1, consecutivePenalty + 0.05);
    lastAction = action;

    let turnDmg = 0;
    if (action === 'focus') {
      focus = Math.min(3, focus + 1);
      turnDmg = intelligence * 0.22 + creativity * 0.15;
    } else if (action === 'guard') {
      guards += 1;
      turnDmg = speed * 0.2 + intelligence * 0.12;
    } else if (action === 'strike') {
      turnDmg = power * 0.95 + speed * 0.2 + focus * 22;
      focus = Math.max(0, focus - 1);
    } else if (action === 'burst') {
      turnDmg = power * 0.82 + creativity * 0.62 + focus * 28;
      focus = Math.max(0, focus - 2);
    }

    if ((raidState.vulnerable || []).includes(card.provider)) turnDmg *= 1.16;
    if ((raidState.resistant || []).includes(card.provider)) turnDmg *= 0.84;

    if (raidState.mechanic === 'chrono_lock' && turn < 2 && speed < 88) turnDmg *= 0.76;
    if (raidState.mechanic === 'reflective_aegis' && action === 'burst' && power > intelligence) turnDmg *= 0.72;
    if (raidState.mechanic === 'entropy_field' && uniqueProviders < 3) turnDmg *= 0.75;
    if (raidState.mechanic === 'quantum_veto' && turn % 2 === 1 && creativity < 90) turnDmg *= 0.78;
    if (raidState.mechanic === 'hunter_protocol' && (RARITY_ORDER[card.rarity] || 1) >= 4 && action === 'burst') turnDmg *= 0.8;
    if (raidState.mechanic === 'adaptive_matrix' && providerCounts[card.provider] > 1) turnDmg *= Math.max(0.7, 1 - (providerCounts[card.provider] - 1) * 0.1);

    turnDmg *= consecutivePenalty;
    tacticalTotal += Math.max(15, turnDmg);
    energy = Math.min(100, energy + 14);
  });

  if (normalizedActions.length >= 10) {
    tacticalNotes.push('Extended tactical chain: +8% combat contribution');
    tacticalTotal *= 1.08;
  }
  if (guards >= 2) {
    tacticalNotes.push('Defensive pacing stabilized the assault');
    tacticalTotal *= 1.05;
  }

  const actionContribution = normalizedActions.length > 0 ? tacticalTotal : baseTotal * 0.55;
  let total = baseTotal * 0.62 + actionContribution * 0.48;

  // Armor applies after strategic calculations.
  total = Math.max(120, Math.floor(total * (1 - (raidState.armor || 0.2))));
  if ((raidState.armor || 0) > 0) tacticalNotes.push(`Boss armor reduced total damage by ${Math.round((raidState.armor || 0) * 100)}%`);
  if (normalizedActions.length > 0) tacticalNotes.push(`Action sequence analyzed (${normalizedActions.length} turns)`);

  return { totalDamage: total, perCard, tacticalNotes, normalizedActions };
}

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

// Sync progression state (xp + unlocks + claimed levels) using guarded server merge.
router.post('/:userId/progression/sync', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only sync your own progression' });
    }

    const incomingXpRaw = req.body?.xp;
    const incomingUnlocksRaw = req.body?.unlockedFeatures;
    const incomingClaimedRaw = req.body?.claimedLevels;

    if (incomingXpRaw === undefined && incomingUnlocksRaw === undefined && incomingClaimedRaw === undefined) {
      return res.status(400).json({ error: 'No progression fields provided' });
    }

    const profileResult = await query(
      'SELECT stats FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const stats = { ...(profileResult.rows[0].stats || {}) };
    const currentXp = Number(stats.xp || 0);

    if (incomingXpRaw !== undefined) {
      const incomingXp = Number(incomingXpRaw);
      if (!Number.isFinite(incomingXp) || incomingXp < 0) {
        return res.status(400).json({ error: 'Invalid xp value' });
      }

      // Monotonic + bounded jump to reduce obvious tampering while allowing legit sessions.
      const maxForwardJump = 250000;
      if (incomingXp < currentXp) {
        return res.status(400).json({ error: 'xp cannot decrease' });
      }
      if (incomingXp - currentXp > maxForwardJump) {
        return res.status(400).json({ error: 'xp jump too large' });
      }
      stats.xp = incomingXp;
    }

    if (incomingUnlocksRaw !== undefined) {
      if (!Array.isArray(incomingUnlocksRaw) || incomingUnlocksRaw.length > 100) {
        return res.status(400).json({ error: 'Invalid unlockedFeatures' });
      }
      stats.unlockedFeatures = [...new Set(incomingUnlocksRaw.map(v => String(v).trim()).filter(Boolean))];
    }

    if (incomingClaimedRaw !== undefined) {
      if (!Array.isArray(incomingClaimedRaw) || incomingClaimedRaw.length > 200) {
        return res.status(400).json({ error: 'Invalid claimedLevels' });
      }
      const cleanClaimed = [...new Set(incomingClaimedRaw.map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 1 && v <= 999))]
        .sort((a, b) => a - b);
      stats.claimedLevels = cleanClaimed;
    }

    const updated = await query(
      'UPDATE user_profiles SET stats = $1::jsonb, updated_at = NOW() WHERE user_id = $2 RETURNING stats',
      [JSON.stringify(stats), userId]
    );

    return res.json({
      message: 'Progression synced',
      stats: updated.rows[0].stats,
    });
  } catch (err) {
    console.error('Progression sync error:', err);
    return res.status(500).json({ error: 'Failed to sync progression' });
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

// Get current hourly boss state.
router.get('/:userId/boss/current', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only access your own boss state' });
    }

    let profileResult = await query(
      'SELECT credits, prestige_crystals, packs, collection, deck_presets, stats FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    if (profileResult.rows.length === 0) {
      await query(
        `INSERT INTO user_profiles (user_id, credits, packs, collection, stats)
         VALUES ($1, 0, '{"basic": 1}'::jsonb, '[]'::jsonb, '{"wins": 0, "losses": 0, "totalBattles": 0, "playtimeHours": 0}'::jsonb)`,
        [userId]
      );
      profileResult = await query(
        'SELECT credits, prestige_crystals, packs, collection, deck_presets, stats FROM user_profiles WHERE user_id = $1',
        [userId]
      );
    }

    const row = profileResult.rows[0];
    const normalizedStats = normalizeBossRaid(row.stats || {}, new Date());
    let credits = Number(row.credits || 0);
    let prestigeCrystals = Number(row.prestige_crystals || 0);
    let packs = { ...(row.packs || {}) };
    let retroRewards = null;

    const consolation = getConsolationRewardsForExhaustedRaid(normalizedStats.bossRaid);
    if (consolation) {
      retroRewards = consolation;
      const applied = applyRewardsToProfileState({ credits, prestigeCrystals, packs }, consolation);
      credits = applied.nextCredits;
      prestigeCrystals = applied.nextCrystals;
      packs = applied.nextPacks;
      normalizedStats.bossRaid.consolationGranted = true;
    }

    await query(
      'UPDATE user_profiles SET credits = $1, prestige_crystals = $2, packs = $3::jsonb, stats = $4::jsonb, updated_at = NOW() WHERE user_id = $5',
      [credits, prestigeCrystals, JSON.stringify(packs), JSON.stringify(normalizedStats), userId]
    );

    return res.json({
      bossRaid: normalizedStats.bossRaid,
      retroRewards,
      profile: {
        credits,
        prestigeCrystals,
        packs,
        collection: row.collection,
        deckPresets: row.deck_presets,
        stats: normalizedStats,
      }
    });
  } catch (err) {
    console.error('Get current boss error:', err);
    return res.status(500).json({ error: 'Failed to fetch hourly boss state' });
  }
});

// Attack current hourly boss with a selected deck (max 5 cards, max 5 attempts total per hour).
router.post('/:userId/boss/attack', authenticate, async (req, res) => {
  try {
    const { userId } = req;
    if (userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Can only attack boss for your own profile' });
    }

    const deckCardIdsRaw = Array.isArray(req.body.deckCardIds) ? req.body.deckCardIds : [];
    const actions = Array.isArray(req.body.actions) ? req.body.actions : [];
    const deckCardIds = [...new Set(deckCardIdsRaw.map(String))];
    if (deckCardIds.length < 2 || deckCardIds.length > 5) {
      return res.status(400).json({ error: 'Deck must contain between 2 and 5 unique cards' });
    }

    const profileResult = await query(
      'SELECT credits, prestige_crystals, packs, collection, deck_presets, stats FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const row = profileResult.rows[0];
    const collection = Array.isArray(row.collection) ? row.collection : [];
    const normalizedStats = normalizeBossRaid(row.stats || {}, new Date());
    const raid = normalizedStats.bossRaid;

    if (raid.defeated) {
      return res.status(400).json({ error: 'Boss already defeated this hour', bossRaid: raid });
    }
    if (raid.attemptsUsed >= raid.maxAttempts) {
      return res.status(400).json({ error: 'No attempts remaining for this hour', bossRaid: raid });
    }

    const alreadyUsed = new Set(raid.usedCardIds || []);
    const invalidUsed = deckCardIds.filter(id => alreadyUsed.has(id));
    if (invalidUsed.length > 0) {
      return res.status(400).json({ error: 'Deck contains cards already used this hour', cardIds: invalidUsed });
    }

    const deckCards = deckCardIds.map(id => getCardByIdFromCollection(collection, id)).filter(Boolean);
    if (deckCards.length !== deckCardIds.length) {
      return res.status(400).json({ error: 'One or more selected cards are not owned by this user' });
    }

    const hpBefore = raid.hp;
    const sim = strategicBossDamage(deckCards, raid, actions);
    const hpAfter = Math.max(0, hpBefore - sim.totalDamage);

    raid.hp = hpAfter;
    raid.attemptsUsed += 1;
    raid.usedCardIds = [...(raid.usedCardIds || []), ...deckCardIds];
    raid.defeated = hpAfter <= 0;

    let credits = Number(row.credits || 0);
    let prestigeCrystals = Number(row.prestige_crystals || 0);
    const packs = { ...(row.packs || {}) };
    const rewards = {
      credits: 0,
      prestigeCrystals: 0,
      packs: {},
      type: null,
    };

    if (raid.defeated && !raid.rewardGranted) {
      const attemptBonus = Math.max(1, 6 - raid.attemptsUsed); // faster clear => better reward
      rewards.credits = 12000 + attemptBonus * 2500;
      rewards.prestigeCrystals = 150 + attemptBonus * 60;
      rewards.packs = {
        mythic_pack: attemptBonus >= 4 ? 2 : 1,
        elite_pack: 2,
        legendary: 1,
      };

      credits += rewards.credits;
      prestigeCrystals += rewards.prestigeCrystals;
      for (const [k, v] of Object.entries(rewards.packs)) {
        packs[k] = (packs[k] || 0) + v;
      }
      raid.rewardGranted = true;
      rewards.type = 'defeat';
      normalizedStats.bossRaidWins = (normalizedStats.bossRaidWins || 0) + 1;
    } else {
      const consolation = getConsolationRewardsForExhaustedRaid(raid);
      if (consolation) {
        rewards.credits = consolation.credits;
        rewards.prestigeCrystals = consolation.prestigeCrystals;
        rewards.packs = consolation.packs;
        rewards.type = 'exhausted';

        const applied = applyRewardsToProfileState({ credits, prestigeCrystals, packs }, consolation);
        credits = applied.nextCredits;
        prestigeCrystals = applied.nextCrystals;
        Object.assign(packs, applied.nextPacks);
        raid.consolationGranted = true;
      }
    }

    normalizedStats.bossRaid = raid;
    const updated = await query(
      `UPDATE user_profiles
       SET credits = $1,
           prestige_crystals = $2,
           packs = $3::jsonb,
           stats = $4::jsonb,
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING credits, prestige_crystals, packs, collection, deck_presets, stats`,
      [credits, prestigeCrystals, JSON.stringify(packs), JSON.stringify(normalizedStats), userId]
    );

    return res.json({
      attemptReport: {
        attemptNumber: raid.attemptsUsed,
        maxAttempts: raid.maxAttempts,
        damage: sim.totalDamage,
        hpBefore,
        hpAfter,
        consumedCardIds: deckCardIds,
        perCard: sim.perCard,
        tacticalNotes: sim.tacticalNotes,
        actionsUsed: sim.normalizedActions,
      },
      bossRaid: raid,
      rewards,
      profile: {
        credits: updated.rows[0].credits,
        prestigeCrystals: updated.rows[0].prestige_crystals,
        packs: updated.rows[0].packs,
        collection: updated.rows[0].collection,
        deckPresets: updated.rows[0].deck_presets,
        stats: updated.rows[0].stats,
      }
    });
  } catch (err) {
    console.error('Boss attack error:', err);
    return res.status(500).json({ error: 'Failed to process boss attack' });
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

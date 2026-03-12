// AI Model definitions with stats and rarities
export const RARITIES = {
  COMMON: { name: 'Common', color: '#9ca3af', probability: 0.45, glow: '#9ca3af' },
  RARE: { name: 'Rare', color: '#3b82f6', probability: 0.30, glow: '#3b82f6' },
  EPIC: { name: 'Epic', color: '#a855f7', probability: 0.15, glow: '#a855f7' },
  LEGENDARY: { name: 'Legendary', color: '#f59e0b', probability: 0.08, glow: '#f59e0b' },
  MYTHIC: { name: 'Mythic', color: '#ef4444', probability: 0.02, glow: '#ef4444' }
};

export const PROVIDERS = {
  CLAUDE: {
    name: 'Claude',
    color: '#d97706',
    icon: '🤖',
    image: 'https://cdn.jsdelivr.net/gh/satellite-chat/ai-icon-library@main/src/icons/claude.svg',
    ability: {
      name: 'Analytical Precision',
      description: 'When using Focus, 30% chance to reveal opponent\'s next move and gain +20% bonus damage.',
      icon: 'Eye'
    }
  },
  GPT: {
    name: 'GPT',
    color: '#10b981',
    icon: '🧠',
    image: 'https://cdn.jsdelivr.net/gh/satellite-chat/ai-icon-library@main/src/icons/chatgpt.svg',
    ability: {
      name: 'Adaptive Learning',
      description: 'At battle start and every 3 turns, randomly gains +10% to one stat (Power, Speed, Intelligence, or Creativity).',
      icon: 'Brain'
    }
  },
  GEMINI: {
    name: 'Gemini',
    color: '#3b82f6',
    icon: '✨',
    image: 'https://cdn.jsdelivr.net/gh/satellite-chat/ai-icon-library@main/src/icons/gemini.svg',
    ability: {
      name: 'Multimodal Mastery',
      description: 'Can use any stat for any move. Strike and Blitz damage reduced by 15%, but provides tactical flexibility.',
      icon: 'Sparkles'
    }
  },
  LLAMA: {
    name: 'Llama',
    color: '#8b5cf6',
    icon: '🦙',
    image: 'https://cdn.jsdelivr.net/gh/satellite-chat/ai-icon-library@main/src/icons/llama.svg',
    ability: {
      name: 'Versatile Tactician',
      description: 'Can switch stat allocation once per battle. Focus bonus persists until Strike is used (does not expire after 1 turn).',
      icon: 'Repeat'
    }
  },
  MISTRAL: {
    name: 'Mistral',
    color: '#ec4899',
    icon: '🌊',
    image: 'https://cdn.jsdelivr.net/gh/satellite-chat/ai-icon-library@main/src/icons/mistral.svg',
    ability: {
      name: 'Efficient Operations',
      description: 'Moves have 1 turn cooldown, allowing same move to be used in consecutive turns after cooldown.',
      icon: 'Zap'
    }
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    color: '#6366f1',
    icon: '🔮',
    image: 'https://cdn.jsdelivr.net/gh/satellite-chat/ai-icon-library@main/src/icons/deepseek.svg',
    ability: {
      name: 'Precognitive Analysis',
      description: '25% chance to predict opponent\'s move. If they attack, next strike gains +20% damage; if they defend, next attack ignores 30% defense.',
      icon: 'Eye'
    }
  }
};

// Base card definitions (before versioning)
const BASE_MODELS = [
  // Claude series
  { id: 'claude-sonnet', provider: 'CLAUDE', baseName: 'Claude Sonnet', baseVersion: '4.5', stats: { power: 75, speed: 70, intelligence: 85, creativity: 80 } },
  { id: 'claude-opus', provider: 'CLAUDE', baseName: 'Claude Opus', baseVersion: '4.5', stats: { power: 90, speed: 60, intelligence: 95, creativity: 90 } },
  { id: 'claude-haiku', provider: 'CLAUDE', baseName: 'Claude Haiku', baseVersion: '4.5', stats: { power: 60, speed: 90, intelligence: 70, creativity: 65 } },

  // GPT series
  { id: 'gpt-4', provider: 'GPT', baseName: 'GPT-4', baseVersion: 'turbo', stats: { power: 85, speed: 75, intelligence: 90, creativity: 85 } },
  { id: 'gpt-4o', provider: 'GPT', baseName: 'GPT-4o', baseVersion: '2024-08-06', stats: { power: 88, speed: 80, intelligence: 92, creativity: 88 } },
  { id: 'gpt-4o-mini', provider: 'GPT', baseName: 'GPT-4o Mini', baseVersion: '2024-07-18', stats: { power: 70, speed: 85, intelligence: 75, creativity: 70 } },

  // Gemini series
  { id: 'gemini-pro', provider: 'GEMINI', baseName: 'Gemini Pro', baseVersion: '1.5', stats: { power: 82, speed: 78, intelligence: 88, creativity: 82 } },
  { id: 'gemini-ultra', provider: 'GEMINI', baseName: 'Gemini Ultra', baseVersion: '1.5', stats: { power: 92, speed: 65, intelligence: 94, creativity: 90 } },

  // Llama series
  { id: 'llama-3-70b', provider: 'LLAMA', baseName: 'Llama 3 70B', baseVersion: 'instruct', stats: { power: 78, speed: 80, intelligence: 82, creativity: 78 } },
  { id: 'llama-3-405b', provider: 'LLAMA', baseName: 'Llama 3 405B', baseVersion: 'instruct', stats: { power: 88, speed: 65, intelligence: 90, creativity: 85 } },

  // Mistral series
  { id: 'mistral-large', provider: 'MISTRAL', baseName: 'Mistral Large', baseVersion: '2407', stats: { power: 84, speed: 76, intelligence: 86, creativity: 84 } },
  { id: 'mistral-medium', provider: 'MISTRAL', baseName: 'Mistral Medium', baseVersion: '2407', stats: { power: 76, speed: 82, intelligence: 78, creativity: 76 } },

  // DeepSeek series
  { id: 'deepseek-chat', provider: 'DEEPSEEK', baseName: 'DeepSeek Chat', baseVersion: 'v3', stats: { power: 80, speed: 84, intelligence: 84, creativity: 80 } },
  { id: 'deepseek-coder', provider: 'DEEPSEEK', baseName: 'DeepSeek Coder', baseVersion: 'v2.5', stats: { power: 85, speed: 75, intelligence: 88, creativity: 75 } }
];

// Version progression for each model
export const VERSION_PROGRESSION = {
  '4.5': { next: '4.6', tier: 1, powerBoost: 5, intelligenceBoost: 3 },
  '4.6': { next: '4.7', tier: 2, powerBoost: 6, intelligenceBoost: 4 },
  '4.7': { next: '4.8', tier: 3, powerBoost: 7, intelligenceBoost: 5 },
  'turbo': { next: 'turbo-2024-06', tier: 1, powerBoost: 4, speedBoost: 5 },
  '2024-06': { next: '2024-08', tier: 2, powerBoost: 5, intelligenceBoost: 3 },
  '2024-08': { next: '2024-12', tier: 3, powerBoost: 6, creativityBoost: 4 },
  '1.5': { next: '2.0', tier: 1, powerBoost: 8, intelligenceBoost: 5 },
  '2.0': { next: '2.5', tier: 2, powerBoost: 10, intelligenceBoost: 6 },
  '2.5': { next: '3.0', tier: 3, powerBoost: 12, creativityBoost: 8 },
  'instruct': { next: 'instruct-v2', tier: 1, powerBoost: 5, speedBoost: 3 },
  'v2': { next: 'v3', tier: 2, powerBoost: 7, intelligenceBoost: 4 },
  'v3': { next: 'v4', tier: 3, powerBoost: 9, creativityBoost: 6 },
  '2407': { next: '2412', tier: 1, powerBoost: 5, intelligenceBoost: 4 },
  '2412': { next: '2503', tier: 2, powerBoost: 7, creativityBoost: 5 },
  '2024-12': { next: '2025-06', tier: 2, powerBoost: 8, intelligenceBoost: 6 }
};

// Generate all possible cards with different rarities
export function generateCardPool() {
  const pool = [];
  let cardId = 0;

  BASE_MODELS.forEach(base => {
    Object.entries(RARITIES).forEach(([rarityKey, rarity]) => {
      // Only common-rare for weakest models, full range for strong ones
      const allowedRarities = base.stats.power >= 85
        ? ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']
        : base.stats.power >= 75
          ? ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
          : ['COMMON', 'RARE', 'EPIC'];

      if (allowedRarities.includes(rarityKey)) {
        const versionData = VERSION_PROGRESSION[base.baseVersion] || { tier: 1, next: base.baseVersion };
        const stats = { ...base.stats };

        // Rarity stat boost
        const rarityBoost = {
          COMMON: 0, RARE: 3, EPIC: 6, LEGENDARY: 10, MYTHIC: 15
        }[rarityKey];

        Object.keys(stats).forEach(stat => {
          stats[stat] += rarityBoost;
        });

        pool.push({
          id: `card-${cardId++}`,
          baseId: base.id,
          name: base.baseName,
          provider: base.provider,
          version: base.baseVersion,
          rarity: rarityKey,
          rarityInfo: rarity,
          providerInfo: PROVIDERS[base.provider],
          stats,
          image: PROVIDERS[base.provider].image,
          description: `${base.baseName} ${rarity.name} edition - Version ${base.baseVersion}`
        });
      }
    });
  });

  return pool;
}

// How many duplicate copies are needed to upgrade a card.
// Cost scales with both rarity and upgrade tier.
// tier 1 (first upgrade): base copies; tier 2: base * 2; tier 3: base * 3
export function getDuplicatesRequired(card) {
  const versionData = VERSION_PROGRESSION[card.version];
  if (!versionData) return null; // already max level

  const rarityBase = {
    COMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 6, MYTHIC: 10
  }[card.rarity];

  return rarityBase * versionData.tier;
}

// Returns how many extra copies of this base+rarity card are in the collection
export function getDuplicateCount(card, collection) {
  return collection.filter(
    c => c.baseId === card.baseId && c.rarity === card.rarity && c.id !== card.id
  ).length;
}

// Perform upgrade: remove required dupes, return upgraded card + pruned collection
export function upgradeCardWithDupes(card, collection) {
  const versionData = VERSION_PROGRESSION[card.version];
  if (!versionData) return null;

  const required = getDuplicatesRequired(card);
  const dupes = collection.filter(
    c => c.baseId === card.baseId && c.rarity === card.rarity && c.id !== card.id
  );
  if (dupes.length < required) return null;

  // Remove exactly `required` dupe copies
  const toRemove = new Set(dupes.slice(0, required).map(c => c.id));
  const newStats = { ...card.stats };
  if (versionData.powerBoost) newStats.power += versionData.powerBoost;
  if (versionData.speedBoost) newStats.speed += versionData.speedBoost;
  if (versionData.intelligenceBoost) newStats.intelligence += versionData.intelligenceBoost;
  if (versionData.creativityBoost) newStats.creativity += versionData.creativityBoost;

  const upgradedCard = {
    ...card,
    version: versionData.next,
    stats: newStats,
    description: `${card.name} ${card.rarityInfo.name} edition - Version ${versionData.next}`
  };

  // Also upgrade every remaining same-base+rarity copy (those not consumed as dupes)
  const newCollection = collection
    .filter(c => !toRemove.has(c.id))
    .map(c => {
      if (c.id === card.id) return upgradedCard;
      // Propagate upgrade to remaining copies of the same base card
      if (c.baseId === card.baseId && c.rarity === card.rarity) {
        const cStats = { ...c.stats };
        if (versionData.powerBoost) cStats.power += versionData.powerBoost;
        if (versionData.speedBoost) cStats.speed += versionData.speedBoost;
        if (versionData.intelligenceBoost) cStats.intelligence += versionData.intelligenceBoost;
        if (versionData.creativityBoost) cStats.creativity += versionData.creativityBoost;
        return {
          ...c,
          version: versionData.next,
          stats: cStats,
          description: `${c.name} ${c.rarityInfo.name} edition - Version ${versionData.next}`
        };
      }
      return c;
    });

  return { upgradedCard, newCollection };
}

// Prestige crystal payout when a maxed card would have been pulled
export const PRESTIGE_CRYSTAL_VALUES = {
  COMMON: 5,
  RARE: 20,
  EPIC: 75,
  LEGENDARY: 300,
  MYTHIC: 1000
};

// Returns true when no further upgrades exist for this card
export function isCardMaxed(card) {
  return !VERSION_PROGRESSION[card.version];
}

// Total duplicate copies needed to upgrade a card from its current version all the way to max
export function getTotalDupesNeededToMax(card) {
  let total = 0;
  let version = card.version;
  while (VERSION_PROGRESSION[version]) {
    const rarityBase = { COMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 6, MYTHIC: 10 }[card.rarity];
    total += rarityBase * VERSION_PROGRESSION[version].tier;
    version = VERSION_PROGRESSION[version].next;
  }
  return total;
}

// Legacy stub kept for any import that still uses getUpgradeCost (returns null = max)
export function getUpgradeCost() { return null; }
export function upgradeCard(card) {
  const versionData = VERSION_PROGRESSION[card.version];
  if (!versionData) return null;
  const newStats = { ...card.stats };
  if (versionData.powerBoost) newStats.power += versionData.powerBoost;
  if (versionData.speedBoost) newStats.speed += versionData.speedBoost;
  if (versionData.intelligenceBoost) newStats.intelligence += versionData.intelligenceBoost;
  if (versionData.creativityBoost) newStats.creativity += versionData.creativityBoost;
  return { ...card, version: versionData.next, stats: newStats, description: `${card.name} ${card.rarityInfo.name} edition - Version ${versionData.next}` };
}

// Pack types with probabilities
export const PACK_TYPES = {
  BASIC: {
    name: 'Basic Pack',
    cost: 100,
    cards: 3,
    guaranteedRarity: 'COMMON',
    // ~1 in 200 Epic, ~1 in 2000 Legendary, ~1 in 20000 Mythic
    probabilityOverrides: { MYTHIC: 0.00005, LEGENDARY: 0.0005, EPIC: 0.005, RARE: 0.12, COMMON: 0.8745 }
  },
  PREMIUM: {
    name: 'Premium Pack',
    cost: 500,
    cards: 5,
    guaranteedRarity: 'RARE',
    // ~1 in 50 Epic, ~1 in 500 Legendary, ~1 in 2000 Mythic
    probabilityOverrides: { MYTHIC: 0.0005, LEGENDARY: 0.002, EPIC: 0.02, RARE: 0.35, COMMON: 0.6275 }
  },
  MEGA: {
    name: 'Mega Pack',
    cost: 2000,
    cards: 10,
    guaranteedRarity: 'EPIC',
    // ~1 in 10 Legendary, ~1 in 100 Mythic per card
    probabilityOverrides: { MYTHIC: 0.01, LEGENDARY: 0.10, EPIC: 0.30, RARE: 0.40, COMMON: 0.19 }
  },
  LEGENDARY: {
    name: 'Legendary Pack',
    cost: 10000,
    cards: 12,
    guaranteedRarity: 'LEGENDARY',
    probabilityOverrides: { MYTHIC: 0.12, LEGENDARY: 0.45, EPIC: 0.30, RARE: 0.12, COMMON: 0.01 }
  },
  // ── Reward-only custom packs (cannot be purchased) ──────────────────────────
  CLAUDE_PACK: {
    name: 'Claude Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'RARE',
    providerFilter: ['CLAUDE'],
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.08, EPIC: 0.20, RARE: 0.35, COMMON: 0.35 }
  },
  GPT_PACK: {
    name: 'GPT Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'RARE',
    providerFilter: ['GPT'],
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.08, EPIC: 0.20, RARE: 0.35, COMMON: 0.35 }
  },
  GEMINI_PACK: {
    name: 'Gemini Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'RARE',
    providerFilter: ['GEMINI'],
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.08, EPIC: 0.20, RARE: 0.35, COMMON: 0.35 }
  },
  OPENSOURCE_PACK: {
    name: 'Open Source Pack',
    cost: 0,
    cards: 6,
    rewardOnly: true,
    guaranteedRarity: 'EPIC',
    providerFilter: ['LLAMA', 'DEEPSEEK', 'MISTRAL'],
    probabilityOverrides: { MYTHIC: 0.03, LEGENDARY: 0.12, EPIC: 0.30, RARE: 0.40, COMMON: 0.15 }
  },
  RIVALS_PACK: {
    name: 'Rivals Pack',
    cost: 0,
    cards: 6,
    rewardOnly: true,
    guaranteedRarity: 'EPIC',
    providerFilter: ['CLAUDE', 'GPT'],
    probabilityOverrides: { MYTHIC: 0.04, LEGENDARY: 0.15, EPIC: 0.30, RARE: 0.35, COMMON: 0.16 }
  },
  DEEPSEEK_PACK: {
    name: 'DeepSeek Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'RARE',
    providerFilter: ['DEEPSEEK'],
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.08, EPIC: 0.20, RARE: 0.35, COMMON: 0.35 }
  },
  MISTRAL_PACK: {
    name: 'Mistral Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'RARE',
    providerFilter: ['MISTRAL'],
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.08, EPIC: 0.20, RARE: 0.35, COMMON: 0.35 }
  },
  LLAMA_PACK: {
    name: 'Llama Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'RARE',
    providerFilter: ['LLAMA'],
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.08, EPIC: 0.20, RARE: 0.35, COMMON: 0.35 }
  },
  ELITE_PACK: {
    name: 'Elite Pack',
    cost: 0,
    cards: 8,
    rewardOnly: true,
    guaranteedRarity: 'EPIC',
    probabilityOverrides: { MYTHIC: 0.06, LEGENDARY: 0.20, EPIC: 0.35, RARE: 0.30, COMMON: 0.09 }
  },
  MYTHIC_PACK: {
    name: 'Mythic Pack',
    cost: 0,
    cards: 5,
    rewardOnly: true,
    guaranteedRarity: 'LEGENDARY',
    probabilityOverrides: { MYTHIC: 0.25, LEGENDARY: 0.50, EPIC: 0.20, RARE: 0.04, COMMON: 0.01 }
  }
};

// Full card pool
export const CARD_POOL = generateCardPool();

// ── XP & Level system ────────────────────────────────────────────────────────
// XP needed to go from level N to N+1: 150 * N
// Cumulative XP to reach level N: 75 * (N-1) * N
export function xpToNextLevel(level) { return 150 * level; }
export function xpForLevel(level) { return 75 * (level - 1) * level; }
export function levelFromXp(xp) {
  // solve 75*(n-1)*n <= xp  =>  n^2 - n - xp/75 <= 0
  return Math.max(1, Math.floor(0.5 + Math.sqrt(0.25 + xp / 75)));
}

// Level rewards.  'packs' keys must match PACK_TYPES keys (lowercase).
// 'unlock' is written into unlockedFeatures set.
export const LEVEL_REWARDS = {
  2:  { label: 'First Steps',      packs: { basic: 3 },                     crystals: 0   },
  3:  { label: 'Strategist',       packs: { premium: 1 },                   crystals: 10,  unlock: 'deck-battle',   unlockLabel: '⚔️ Deck Battle Unlocked!' },
  4:  { label: 'Rising Star',      packs: { premium: 2, basic: 2 },         crystals: 15  },
  5:  { label: 'AI Devotee',       packs: { claude_pack: 1, premium: 1 },   crystals: 20,  unlock: 'tower-defense', unlockLabel: '🏰 Tower Defense Unlocked!' },
  6:  { label: 'Pack Opener',      packs: { premium: 2 },                   crystals: 25  },
  7:  { label: 'Veteran',          packs: { premium: 3, gpt_pack: 1 },      crystals: 30  },
  8:  { label: 'Champion',         packs: { mega: 1 },                      crystals: 40,  unlock: 'leaderboard',   unlockLabel: '🏆 Leaderboard Unlocked!' },
  9:  { label: 'Innovator',        packs: { mega: 1, gemini_pack: 1 },      crystals: 50  },
  10: { label: 'Elite Collector',  packs: { mega: 2, elite_pack: 1 },       crystals: 75  },
  11: { label: 'Tech Pioneer',     packs: { premium: 3 },                   crystals: 60  },
  12: { label: 'Power Surge',      packs: { mega: 2, deepseek_pack: 1 },    crystals: 80  },
  13: { label: 'Data Hoarder',     packs: { premium: 4 },                   crystals: 70  },
  14: { label: 'Transformer',      packs: { mega: 2, mistral_pack: 1 },     crystals: 90  },
  15: { label: 'Legend',           packs: { legendary: 1, elite_pack: 1 },  crystals: 150 },
  16: { label: 'Apex Trainer',     packs: { mega: 3 },                      crystals: 100 },
  17: { label: 'Model Whisperer',  packs: { llama_pack: 1, mega: 2 },       crystals: 110 },
  18: { label: 'Open Source Hero', packs: { opensource_pack: 1, mega: 2 },  crystals: 120 },
  19: { label: 'Boundary Pusher',  packs: { mega: 3 },                      crystals: 130 },
  20: { label: 'Rival Breaker',    packs: { legendary: 2, rivals_pack: 1 }, crystals: 200 },
  21: { label: 'Compute Lord',     packs: { mega: 3 },                      crystals: 150 },
  22: { label: 'Token Master',     packs: { mega: 4 },                      crystals: 160 },
  23: { label: 'Alignment Sage',   packs: { elite_pack: 2 },                crystals: 175 },
  24: { label: 'Singularity Near', packs: { legendary: 1, elite_pack: 1 },  crystals: 200 },
  25: { label: 'Mega Collector',   packs: { legendary: 2, mythic_pack: 1 }, crystals: 300 },
  26: { label: 'Deep Thinker',     packs: { mega: 4 },                      crystals: 200 },
  27: { label: 'Neural Architect', packs: { elite_pack: 2 },                crystals: 225 },
  28: { label: 'Parameter God',    packs: { legendary: 2 },                 crystals: 250 },
  29: { label: 'Hallucination Free',packs: { mega: 5 },                     crystals: 275 },
  30: { label: 'Grand Master',     packs: { legendary: 3, mythic_pack: 2 }, crystals: 500 },
};

// ── Type effectiveness chart ─────────────────────────────────────────────────
// Each provider has strengths (1.3×) and weaknesses (0.7×) against others.
// Think of it like a rock-paper-scissors cycle plus unique cross-matchups.
//
// Story rationale:
//   CLAUDE  → strong analytical reasoning beats DEEPSEEK's pattern tricks
//   DEEPSEEK→ deep code insight outsmarts LLAMA's open versatility
//   LLAMA   → open-source swarm pressure overwhelms MISTRAL's efficiency
//   MISTRAL → European precision efficiency counters GEMINI's multimodal sprawl
//   GEMINI  → Google's multimodal scale overpowers GPT's text focus
//   GPT     → broad world knowledge and RLHF overpowers CLAUDE's caution
export const TYPE_CHART = {
  //           vs CLAUDE  DEEPSEEK  GEMINI  GPT   LLAMA  MISTRAL
  CLAUDE:   { CLAUDE:1.0, DEEPSEEK:1.3, GEMINI:0.85, GPT:0.75, LLAMA:1.0,  MISTRAL:1.1  },
  DEEPSEEK: { CLAUDE:0.75, DEEPSEEK:1.0, GEMINI:1.0,  GPT:1.0,  LLAMA:1.3,  MISTRAL:0.9  },
  GEMINI:   { CLAUDE:1.15, DEEPSEEK:1.0, GEMINI:1.0,  GPT:1.3,  LLAMA:0.9,  MISTRAL:0.75 },
  GPT:      { CLAUDE:1.3,  DEEPSEEK:1.0, GEMINI:0.75, GPT:1.0,  LLAMA:1.0,  MISTRAL:1.0  },
  LLAMA:    { CLAUDE:1.0,  DEEPSEEK:0.75,GEMINI:1.1,  GPT:1.0,  LLAMA:1.0,  MISTRAL:1.3  },
  MISTRAL:  { CLAUDE:0.9,  DEEPSEEK:1.1, GEMINI:1.3,  GPT:1.0,  LLAMA:0.75, MISTRAL:1.0  },
};

// Returns the type damage multiplier when `attackerProvider` attacks `defenderProvider`
export function getTypeMultiplier(attackerProvider, defenderProvider) {
  return TYPE_CHART[attackerProvider]?.[defenderProvider] ?? 1.0;
}

// Human-readable type matchup description
export function getTypeMatchupText(attackerProvider, defenderProvider) {
  const mult = getTypeMultiplier(attackerProvider, defenderProvider);
  if (mult >= 1.25) return { label: 'Super Effective!', color: '#22c55e', emoji: '🔥' };
  if (mult >= 1.1)  return { label: 'Effective',        color: '#86efac', emoji: '✅' };
  if (mult <= 0.76) return { label: 'Not Very Effective', color: '#f87171', emoji: '❌' };
  if (mult <= 0.9)  return { label: 'Slightly Weak',    color: '#fca5a5', emoji: '⚠️' };
  return { label: 'Normal',              color: '#9ca3af', emoji: '➖' };
}

// Battle moves - each uses a specific stat and has unique effects
export const MOVES = {
  STRIKE: {
    id: 'strike',
    name: 'Strike',
    icon: '⚡',
    stat: 'power',
    description: 'Attack with raw power. Deals damage based on Power.',
    energyCost: 40,
    damageFactor: 0.5, // damage = stat * 0.5
    defenseFactor: 1.0 // affected normally by defense
  },
  BLOCK: {
    id: 'block',
    name: 'Block',
    icon: '🛡️',
    stat: 'speed',
    description: 'Take a defensive stance. Reduces incoming damage by 70% this turn.',
    energyCost: 15,
    damageFactor: 0,
    defenseReduction: 0.7
  },
  FOCUS: {
    id: 'focus',
    name: 'Focus',
    icon: '🔮',
    stat: 'intelligence',
    description: 'Channel intelligence to power up your next Strike. Bonus scales with Intelligence.',
    energyCost: 20,
    damageFactor: 0,
    bonusFactor: 0.01 // bonus multiplier = int * 0.01 (i.e., 80 int = 0.8 = +80% damage)
  },
  BLITZ: {
    id: 'blitz',
    name: 'Blitz',
    icon: '🌀',
    stat: 'creativity',
    description: 'A creative, unpredictable assault. Deals damage based on Creativity with 50% defense penetration.',
    energyCost: 35,
    damageFactor: 0.45,
    defensePenetration: 0.5 // ignores 50% of opponent's defense
  }
};

// Helper to calculate starting HP from card stats
export function calculateHP(card) {
  const sum = Object.values(card.stats).reduce((a, b) => a + b, 0);
  return Math.floor(100 + sum / 2); // e.g., sum 320 => HP 260
}

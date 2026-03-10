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
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Anthropic_Logo.svg/512px-Anthropic_Logo.svg.png', // placeholder - to be updated
    ability: {
      name: 'Analytical Precision',
      description: 'Focus grants +20% bonus damage and reveals opponent\'s next move with 30% chance',
      type: 'passive'
    }
  },
  GPT: {
    name: 'GPT',
    color: '#10b981',
    icon: '🧠',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png',
    ability: {
      name: 'Adaptive Learning',
      description: 'At battle start, randomly gains +10% to one stat (Power, Speed, or Intelligence). Adapts between rounds.',
      type: 'passive'
    }
  },
  GEMINI: {
    name: 'Gemini',
    color: '#3b82f6',
    icon: '✨',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Google_Gemini_logo.svg/512px-Google_Gemini_logo.svg.png',
    ability: {
      name: 'Multimodal Mastery',
      description: 'Can use any stat for any move. Strike and Blitz damage reduced by 15%, but stat flexibility provides tactical advantage.',
      type: 'passive'
    }
  },
  LLAMA: {
    name: 'Llama',
    color: '#8b5cf6',
    icon: '🦙',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Meta_AI_logo_%28square%29.svg/512px-Meta_AI_logo_%28square%29.svg.png',
    ability: {
      name: 'Versatile Tactician',
      description: 'Can switch stat allocation once per battle. Focus bonus persists until Strike is used (does not expire).',
      type: 'passive'
    }
  },
  MISTRAL: {
    name: 'Mistral',
    color: '#ec4899',
    icon: '🌊',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Mistral_AI_Logo.svg/512px-Mistral_AI_Logo.svg.png',
    ability: {
      name: 'Efficient Operations',
      description: 'Moves have 1 turn cooldown. Can use the same move in consecutive turns after cooldown.',
      type: 'passive'
    }
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    color: '#6366f1',
    icon: '🔮',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/DeepSeek_logo.svg/512px-DeepSeek_logo.svg.png',
    ability: {
      name: 'Precognitive Analysis',
      description: '25% chance to predict opponent\'s move. If they attack, gain +20% damage; if they defend, your next attack ignores 30% defense.',
      type: 'passive'
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

        const providerData = PROVIDERS[base.provider];
        pool.push({
          id: `card-${cardId++}`,
          baseId: base.id,
          name: base.baseName,
          provider: base.provider,
          version: base.baseVersion,
          rarity: rarityKey,
          rarityInfo: rarity,
          providerInfo: providerData,
          stats,
          image: providerData.image || `https://card-bg-gradient-server.vercel.app/api/gradient?text=${encodeURIComponent(base.baseName)}&v=${base.baseVersion}&rarity=${rarityKey.toLowerCase()}`,
          description: `${base.baseName} ${rarity.name} edition - Version ${base.baseVersion}`,
          ability: providerData.ability
        });
      }
    });
  });

  return pool;
}

// Calculate upgrade cost (in upgrade tokens)
export function getUpgradeCost(card) {
  const rarityMultiplier = {
    COMMON: 1, RARE: 2, EPIC: 4, LEGENDARY: 8, MYTHIC: 16
  }[card.rarity];

  const version = VERSION_PROGRESSION[card.version];
  if (!version) return null; // Max level

  return 5 * rarityMultiplier * (version.tier + 1);
}

// Get upgraded card
export function upgradeCard(card) {
  const versionData = VERSION_PROGRESSION[card.version];
  if (!versionData) return null;

  const newStats = { ...card.stats };
  if (versionData.powerBoost) newStats.power += versionData.powerBoost;
  if (versionData.speedBoost) newStats.speed += versionData.speedBoost;
  if (versionData.intelligenceBoost) newStats.intelligence += versionData.intelligenceBoost;
  if (versionData.creativityBoost) newStats.creativity += versionData.creativityBoost;

  return {
    ...card,
    version: versionData.next,
    stats: newStats,
    description: `${card.name} ${card.rarityInfo.name} edition - Version ${versionData.next}`
  };
}

// Pack types with probabilities
export const PACK_TYPES = {
  BASIC: {
    name: 'Basic Pack',
    cost: 100,
    cards: 3, // Reduced from 5
    guaranteedRarity: 'COMMON',
    probabilityOverrides: { MYTHIC: 0.001, LEGENDARY: 0.01, EPIC: 0.04, RARE: 0.20, COMMON: 0.749 } // Much lower high-rarity chances
  },
  PREMIUM: {
    name: 'Premium Pack',
    cost: 500,
    cards: 5,
    guaranteedRarity: 'RARE',
    probabilityOverrides: { MYTHIC: 0.02, LEGENDARY: 0.10, EPIC: 0.25, RARE: 0.40, COMMON: 0.23 }
  },
  MEGA: {
    name: 'Mega Pack',
    cost: 2000,
    cards: 10,
    guaranteedRarity: 'EPIC',
    probabilityOverrides: { MYTHIC: 0.05, LEGENDARY: 0.20, EPIC: 0.40, RARE: 0.25, COMMON: 0.10 }
  },
  LEGENDARY: {
    name: 'Legendary Pack',
    cost: 10000,
    cards: 5,
    guaranteedRarity: 'LEGENDARY',
    probabilityOverrides: { MYTHIC: 0.15, LEGENDARY: 0.50, EPIC: 0.25, RARE: 0.08, COMMON: 0.02 }
  }
};

// Full card pool
export const CARD_POOL = generateCardPool();

// Battle moves - each uses a specific stat and has unique effects
export const MOVES = {
  STRIKE: {
    id: 'strike',
    name: 'Strike',
    icon: '⚡',
    stat: 'power',
    description: 'Attack with raw power. Deals damage based on Power.',
    damageFactor: 0.5, // damage = stat * 0.5
    defenseFactor: 1.0 // affected normally by defense
  },
  BLOCK: {
    id: 'block',
    name: 'Block',
    icon: '🛡️',
    stat: 'speed',
    description: 'Take a defensive stance. Reduces incoming damage by 70% this turn.',
    defenseReduction: 0.7
  },
  FOCUS: {
    id: 'focus',
    name: 'Focus',
    icon: '🔮',
    stat: 'intelligence',
    description: 'Channel intelligence to power up your next Strike. Bonus scales with Intelligence.',
    bonusFactor: 0.01 // bonus multiplier = int * 0.01 (i.e., 80 int = 0.8 = +80% damage)
  },
  BLITZ: {
    id: 'blitz',
    name: 'Blitz',
    icon: '🌀',
    stat: 'creativity',
    description: 'A creative, unpredictable assault. Deals damage based on Creativity with 50% defense penetration.',
    damageFactor: 0.45,
    defensePenetration: 0.5 // ignores 50% of opponent's defense
  }
};

// Helper to calculate starting HP from card stats
export function calculateHP(card) {
  const sum = Object.values(card.stats).reduce((a, b) => a + b, 0);
  return Math.floor(100 + sum / 2); // e.g., sum 320 => HP 260
}

// Server-side authoritative game data used for secure economy operations.

export const RARITIES = {
  COMMON: { name: 'Common' },
  RARE: { name: 'Rare' },
  EPIC: { name: 'Epic' },
  LEGENDARY: { name: 'Legendary' },
  MYTHIC: { name: 'Mythic' }
};

export const PROVIDERS = {
  CLAUDE: { name: 'Claude', color: '#d97706', icon: '🤖' },
  GPT: { name: 'GPT', color: '#10b981', icon: '🧠' },
  GEMINI: { name: 'Gemini', color: '#3b82f6', icon: '✨' },
  LLAMA: { name: 'Llama', color: '#8b5cf6', icon: '🦙' },
  MISTRAL: { name: 'Mistral', color: '#ec4899', icon: '🌊' },
  DEEPSEEK: { name: 'DeepSeek', color: '#6366f1', icon: '🔮' }
};

const BASE_MODELS = [
  { id: 'claude-sonnet', provider: 'CLAUDE', baseName: 'Claude Sonnet', baseVersion: '4.5', stats: { power: 75, speed: 70, intelligence: 85, creativity: 80 } },
  { id: 'claude-opus', provider: 'CLAUDE', baseName: 'Claude Opus', baseVersion: '4.5', stats: { power: 90, speed: 60, intelligence: 95, creativity: 90 } },
  { id: 'claude-haiku', provider: 'CLAUDE', baseName: 'Claude Haiku', baseVersion: '4.5', stats: { power: 60, speed: 90, intelligence: 70, creativity: 65 } },
  { id: 'gpt-4', provider: 'GPT', baseName: 'GPT-4', baseVersion: 'turbo', stats: { power: 85, speed: 75, intelligence: 90, creativity: 85 } },
  { id: 'gpt-4o', provider: 'GPT', baseName: 'GPT-4o', baseVersion: '2024-08-06', stats: { power: 88, speed: 80, intelligence: 92, creativity: 88 } },
  { id: 'gpt-4o-mini', provider: 'GPT', baseName: 'GPT-4o Mini', baseVersion: '2024-07-18', stats: { power: 70, speed: 85, intelligence: 75, creativity: 70 } },
  { id: 'gemini-pro', provider: 'GEMINI', baseName: 'Gemini Pro', baseVersion: '1.5', stats: { power: 82, speed: 78, intelligence: 88, creativity: 82 } },
  { id: 'gemini-ultra', provider: 'GEMINI', baseName: 'Gemini Ultra', baseVersion: '1.5', stats: { power: 92, speed: 65, intelligence: 94, creativity: 90 } },
  { id: 'llama-3-70b', provider: 'LLAMA', baseName: 'Llama 3 70B', baseVersion: 'instruct', stats: { power: 78, speed: 80, intelligence: 82, creativity: 78 } },
  { id: 'llama-3-405b', provider: 'LLAMA', baseName: 'Llama 3 405B', baseVersion: 'instruct', stats: { power: 88, speed: 65, intelligence: 90, creativity: 85 } },
  { id: 'mistral-large', provider: 'MISTRAL', baseName: 'Mistral Large', baseVersion: '2407', stats: { power: 84, speed: 76, intelligence: 86, creativity: 84 } },
  { id: 'mistral-medium', provider: 'MISTRAL', baseName: 'Mistral Medium', baseVersion: '2407', stats: { power: 76, speed: 82, intelligence: 78, creativity: 76 } },
  { id: 'deepseek-chat', provider: 'DEEPSEEK', baseName: 'DeepSeek Chat', baseVersion: 'v3', stats: { power: 80, speed: 84, intelligence: 84, creativity: 80 } },
  { id: 'deepseek-coder', provider: 'DEEPSEEK', baseName: 'DeepSeek Coder', baseVersion: 'v2.5', stats: { power: 85, speed: 75, intelligence: 88, creativity: 75 } }
];

export const VERSION_PROGRESSION = {
  '4.5': { next: '4.6', tier: 1 },
  '4.6': { next: '4.7', tier: 2 },
  '4.7': { next: '4.8', tier: 3 },
  turbo: { next: 'turbo-2024-06', tier: 1 },
  '2024-06': { next: '2024-08', tier: 2 },
  '2024-08': { next: '2024-12', tier: 3 },
  '1.5': { next: '2.0', tier: 1 },
  '2.0': { next: '2.5', tier: 2 },
  '2.5': { next: '3.0', tier: 3 },
  instruct: { next: 'instruct-v2', tier: 1 },
  v2: { next: 'v3', tier: 2 },
  v3: { next: 'v4', tier: 3 },
  '2407': { next: '2412', tier: 1 },
  '2412': { next: '2503', tier: 2 },
  '2024-12': { next: '2025-06', tier: 2 }
};

function generateCardPool() {
  const pool = [];
  let cardId = 0;
  for (const base of BASE_MODELS) {
    for (const rarityKey of Object.keys(RARITIES)) {
      const allowedRarities = base.stats.power >= 85
        ? ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']
        : base.stats.power >= 75
          ? ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
          : ['COMMON', 'RARE', 'EPIC'];
      if (!allowedRarities.includes(rarityKey)) continue;

      const rarityBoost = {
        COMMON: 0,
        RARE: 3,
        EPIC: 6,
        LEGENDARY: 10,
        MYTHIC: 15,
      }[rarityKey] || 0;

      const stats = { ...base.stats };
      for (const stat of Object.keys(stats)) stats[stat] += rarityBoost;

      pool.push({
        id: `card-${cardId++}`,
        baseId: base.id,
        name: base.baseName,
        provider: base.provider,
        version: base.baseVersion,
        rarity: rarityKey,
        rarityInfo: RARITIES[rarityKey],
        providerInfo: PROVIDERS[base.provider],
        stats,
      });
    }
  }
  return pool;
}

export const CARD_POOL = generateCardPool();

export const PRESTIGE_CRYSTAL_VALUES = {
  COMMON: 5,
  RARE: 20,
  EPIC: 75,
  LEGENDARY: 300,
  MYTHIC: 1000,
};

export function getTotalDupesNeededToMax(card) {
  let total = 0;
  let version = card.version;
  while (VERSION_PROGRESSION[version]) {
    const rarityBase = { COMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 6, MYTHIC: 10 }[card.rarity] || 0;
    total += rarityBase * VERSION_PROGRESSION[version].tier;
    version = VERSION_PROGRESSION[version].next;
  }
  return total;
}

export const PACK_TYPES = {
  BASIC: {
    name: 'Basic Pack',
    cost: 100,
    cards: 3,
    guaranteedRarity: 'COMMON',
    probabilityOverrides: { MYTHIC: 0.00005, LEGENDARY: 0.0005, EPIC: 0.005, RARE: 0.12, COMMON: 0.8745 }
  },
  PREMIUM: {
    name: 'Premium Pack',
    cost: 500,
    cards: 5,
    guaranteedRarity: 'RARE',
    probabilityOverrides: { MYTHIC: 0.0005, LEGENDARY: 0.002, EPIC: 0.02, RARE: 0.35, COMMON: 0.6275 }
  },
  MEGA: {
    name: 'Mega Pack',
    cost: 2000,
    cards: 10,
    guaranteedRarity: 'EPIC',
    probabilityOverrides: { MYTHIC: 0.01, LEGENDARY: 0.10, EPIC: 0.30, RARE: 0.40, COMMON: 0.19 }
  },
  LEGENDARY: {
    name: 'Legendary Pack',
    cost: 10000,
    cards: 12,
    guaranteedRarity: 'LEGENDARY',
    probabilityOverrides: { MYTHIC: 0.12, LEGENDARY: 0.45, EPIC: 0.30, RARE: 0.12, COMMON: 0.01 }
  },
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

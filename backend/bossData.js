export const HOURLY_BOSS_ROSTER = [
  { id: 'clockwork-tyrant', name: 'Clockwork Tyrant', icon: '⏱️', color: '#f59e0b', maxHp: 9600, armor: 0.18, vulnerable: ['DEEPSEEK'], resistant: ['GPT', 'CLAUDE'], mechanic: 'chrono_lock', gimmick: 'First two cards are heavily suppressed unless they are fast.' },
  { id: 'mirror-overlord', name: 'Mirror Overlord', icon: '🪞', color: '#06b6d4', maxHp: 9200, armor: 0.15, vulnerable: ['MISTRAL'], resistant: ['CLAUDE', 'LLAMA'], mechanic: 'reflective_aegis', gimmick: 'Overcommitting to raw power gets reflected.' },
  { id: 'entropy-behemoth', name: 'Entropy Behemoth', icon: '🌀', color: '#ef4444', maxHp: 9800, armor: 0.2, vulnerable: ['GPT'], resistant: ['GEMINI', 'MISTRAL'], mechanic: 'entropy_field', gimmick: 'Punishes low-provider diversity.' },
  { id: 'quantum-warden', name: 'Quantum Warden', icon: '⚛️', color: '#8b5cf6', maxHp: 9400, armor: 0.16, vulnerable: ['LLAMA'], resistant: ['DEEPSEEK', 'GPT'], mechanic: 'quantum_veto', gimmick: 'Every second attacker is vetoed unless highly creative.' },
  { id: 'neural-inquisitor', name: 'Neural Inquisitor', icon: '🧠', color: '#22c55e', maxHp: 9900, armor: 0.17, vulnerable: ['CLAUDE'], resistant: ['DEEPSEEK', 'LLAMA'], mechanic: 'adaptive_matrix', gimmick: 'Repeated providers are progressively countered.' },
  { id: 'void-regent', name: 'Void Regent', icon: '🌑', color: '#6366f1', maxHp: 10200, armor: 0.22, vulnerable: ['GEMINI'], resistant: ['GPT', 'MISTRAL'], mechanic: 'hunter_protocol', gimmick: 'Targets obvious top-rarity picks and rewards smart support mixes.' },
  { id: 'fracture-lord', name: 'Fracture Lord', icon: '💥', color: '#f43f5e', maxHp: 9700, armor: 0.19, vulnerable: ['MISTRAL'], resistant: ['CLAUDE', 'DEEPSEEK'], mechanic: 'reflective_aegis', gimmick: 'One-dimensional burst is dramatically reduced.' },
  { id: 'data-colossus', name: 'Data Colossus', icon: '📊', color: '#0ea5e9', maxHp: 9300, armor: 0.14, vulnerable: ['GPT'], resistant: ['GEMINI', 'LLAMA'], mechanic: 'adaptive_matrix', gimmick: 'Learns from repeated provider usage instantly.' },
  { id: 'storm-archon', name: 'Storm Archon', icon: '🌩️', color: '#a855f7', maxHp: 10000, armor: 0.2, vulnerable: ['CLAUDE'], resistant: ['MISTRAL', 'DEEPSEEK'], mechanic: 'chrono_lock', gimmick: 'Slow openers are crushed by temporal storms.' },
  { id: 'ashen-oracle', name: 'Ashen Oracle', icon: '🔥', color: '#fb7185', maxHp: 9800, armor: 0.18, vulnerable: ['DEEPSEEK'], resistant: ['CLAUDE', 'GEMINI'], mechanic: 'quantum_veto', gimmick: 'Sequence planning matters more than raw strength.' },
  { id: 'iron-synapse', name: 'Iron Synapse', icon: '🛡️', color: '#94a3b8', maxHp: 10300, armor: 0.24, vulnerable: ['LLAMA'], resistant: ['GPT', 'MISTRAL'], mechanic: 'entropy_field', gimmick: 'Low-diversity decks bounce off its armor.' },
  { id: 'spectral-kernel', name: 'Spectral Kernel', icon: '👻', color: '#38bdf8', maxHp: 9100, armor: 0.13, vulnerable: ['GEMINI'], resistant: ['DEEPSEEK', 'CLAUDE'], mechanic: 'hunter_protocol', gimmick: 'Predictable premium-card spam gets punished.' },
  { id: 'gamma-executor', name: 'Gamma Executor', icon: '☢️', color: '#84cc16', maxHp: 10100, armor: 0.21, vulnerable: ['MISTRAL'], resistant: ['GPT', 'LLAMA'], mechanic: 'chrono_lock', gimmick: 'Opening tempo must be carefully engineered.' },
  { id: 'azure-monolith', name: 'Azure Monolith', icon: '🗿', color: '#3b82f6', maxHp: 10250, armor: 0.23, vulnerable: ['DEEPSEEK'], resistant: ['CLAUDE', 'GEMINI'], mechanic: 'entropy_field', gimmick: 'Deck balance and role coverage are mandatory.' },
  { id: 'ember-juggernaut', name: 'Ember Juggernaut', icon: '🧨', color: '#f97316', maxHp: 9950, armor: 0.19, vulnerable: ['GPT'], resistant: ['LLAMA', 'MISTRAL'], mechanic: 'reflective_aegis', gimmick: 'Overheated offense backfires.' },
  { id: 'helios-proctor', name: 'Helios Proctor', icon: '☀️', color: '#eab308', maxHp: 9700, armor: 0.17, vulnerable: ['CLAUDE'], resistant: ['GPT', 'DEEPSEEK'], mechanic: 'quantum_veto', gimmick: 'Turn order and pairing define success.' },
  { id: 'lattice-maw', name: 'Lattice Maw', icon: '🕸️', color: '#a78bfa', maxHp: 10050, armor: 0.2, vulnerable: ['LLAMA'], resistant: ['MISTRAL', 'GEMINI'], mechanic: 'adaptive_matrix', gimmick: 'Duplicate providers are consumed by the lattice.' },
  { id: 'nova-predator', name: 'Nova Predator', icon: '🌟', color: '#f43f5e', maxHp: 9850, armor: 0.18, vulnerable: ['MISTRAL'], resistant: ['GPT', 'CLAUDE'], mechanic: 'hunter_protocol', gimmick: 'Greedy rarity stacking feeds its hunt.' },
  { id: 'cipher-leviathan', name: 'Cipher Leviathan', icon: '🔐', color: '#14b8a6', maxHp: 10400, armor: 0.25, vulnerable: ['DEEPSEEK'], resistant: ['CLAUDE', 'LLAMA'], mechanic: 'entropy_field', gimmick: 'Only strategic diversity can crack the cipher.' },
  { id: 'rime-dreadnought', name: 'Rime Dreadnought', icon: '❄️', color: '#67e8f9', maxHp: 9600, armor: 0.16, vulnerable: ['GEMINI'], resistant: ['GPT', 'MISTRAL'], mechanic: 'chrono_lock', gimmick: 'Cold-start penalties force adaptive openers.' },
  { id: 'obsidian-knight', name: 'Obsidian Knight', icon: '♞', color: '#52525b', maxHp: 10150, armor: 0.22, vulnerable: ['GPT'], resistant: ['CLAUDE', 'DEEPSEEK'], mechanic: 'reflective_aegis', gimmick: 'It punishes blunt-force meta decks.' },
  { id: 'aether-harbinger', name: 'Aether Harbinger', icon: '🛰️', color: '#60a5fa', maxHp: 9750, armor: 0.17, vulnerable: ['LLAMA'], resistant: ['GEMINI', 'MISTRAL'], mechanic: 'adaptive_matrix', gimmick: 'Provider reuse feeds its prediction engine.' },
  { id: 'paradox-sentinel', name: 'Paradox Sentinel', icon: '♾️', color: '#c084fc', maxHp: 10350, armor: 0.24, vulnerable: ['CLAUDE'], resistant: ['GPT', 'LLAMA'], mechanic: 'quantum_veto', gimmick: 'Bad sequencing collapses your damage output.' },
  { id: 'eclipse-emperor', name: 'Eclipse Emperor', icon: '🌒', color: '#818cf8', maxHp: 10800, armor: 0.27, vulnerable: ['MISTRAL'], resistant: ['DEEPSEEK', 'GEMINI'], mechanic: 'hunter_protocol', gimmick: 'Ultimate boss: anti-meta and massively durable.' }
];

export function getHourPeriodStart(date = new Date()) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

function utcDayIndex(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return Math.floor(d.getTime() / 86400000);
}

export function getBossForHour(date = new Date()) {
  const hour = date.getUTCHours();
  const dayShift = utcDayIndex(date) % HOURLY_BOSS_ROSTER.length;
  const idx = (hour + dayShift) % HOURLY_BOSS_ROSTER.length;
  const boss = HOURLY_BOSS_ROSTER[idx];
  return { ...boss, hourUtc: hour };
}

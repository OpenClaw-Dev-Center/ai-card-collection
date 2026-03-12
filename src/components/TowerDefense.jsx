import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Castle, Shield, Zap, SkipForward, Play, Pause } from 'lucide-react';
import { CARD_POOL, RARITIES, calculateHP, PROVIDERS, getTypeMultiplier, TYPE_CHART } from '../data/cards';

// ─── Config ──────────────────────────────────────────────────────────────────
const LANES = 4;
const COLS  = 9;  // 0–3 = tower zone (4 cols), 4–8 = combat lane
const TOWER_COLS = [0, 1, 2, 3];
const CELL_W = 70;
const CELL_H = 68;
const TICK_MS = 600;
const MAX_WAVES = 10;
const LIVES_START = 20;

const RARITY_ORDER = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5 };

// ─── Enemy archetypes ─────────────────────────────────────────────────────────
const ENEMY_TYPES = [
  { name: 'Rogue GPT',      provider: 'GPT',      icon: '🤖', baseHp: 70,  speed: 1, reward: 40  },
  { name: 'Feral Llama',    provider: 'LLAMA',    icon: '🦙', baseHp: 90,  speed: 1, reward: 50  },
  { name: 'Ghost Gemini',   provider: 'GEMINI',   icon: '♊', baseHp: 55,  speed: 2, reward: 60  },
  { name: 'Rogue Claude',   provider: 'CLAUDE',   icon: '⚡', baseHp: 80,  speed: 1, reward: 50  },
  { name: 'Feral DeepSeek', provider: 'DEEPSEEK', icon: '🔮', baseHp: 75,  speed: 1, reward: 50  },
  { name: 'Corrupt Mistral',provider: 'MISTRAL',  icon: '💨', baseHp: 60,  speed: 2, reward: 55  },
];

const BOSS_TYPES = [
  { name: 'Omega GPT-X',    provider: 'GPT',      icon: '👹', baseHp: 350, speed: 1, reward: 400, isBoss: true },
  { name: 'Apex Claude',    provider: 'CLAUDE',   icon: '💀', baseHp: 400, speed: 1, reward: 500, isBoss: true },
  { name: 'Hyper DeepSeek', provider: 'DEEPSEEK', icon: '🔮', baseHp: 380, speed: 1, reward: 450, isBoss: true },
  { name: 'Titan Gemini',   provider: 'GEMINI',   icon: '♊', baseHp: 320, speed: 2, reward: 480, isBoss: true },
];

// ─── Lane Synergies ──────────────────────────────────────────────────────────
// Strategic cross-provider synergies — each has a unique MECHANIC, not just % buffs.
// Ordered highest priority first (most specific / best reward wins).
const LANE_SYNERGIES = [
  {
    id: 'surge_drain',
    name: 'Surge Drain',
    emoji: '💸',
    condition: (ps) => ps.includes('CLAUDE') && ps.includes('GPT') && ps.includes('GEMINI'),
    effect: 'double_credits',
    dmgMult: 1.0, rangeMult: 1.0,
    color: '#22c55e',
    desc: 'Claude + GPT + Gemini → All kills in this lane award 2× credits',
  },
  {
    id: 'open_rebellion',
    name: 'Open Rebellion',
    emoji: '🦙',
    condition: (ps) => ['LLAMA', 'MISTRAL', 'DEEPSEEK'].every(p => ps.includes(p)),
    effect: 'splash',
    dmgMult: 1.0, rangeMult: 1.0,
    color: '#8b5cf6',
    desc: 'Llama + Mistral + DeepSeek → 30% of damage splashes to the next enemy in lane',
  },
  {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    emoji: '⚡',
    condition: (ps) => ps.includes('CLAUDE') && ps.includes('MISTRAL'),
    effect: 'chain',
    dmgMult: 0.7, rangeMult: 1.0,
    color: '#f59e0b',
    desc: 'Claude + Mistral → Each tower strikes ALL enemies in range simultaneously (70% dmg each)',
  },
  {
    id: 'type_shredder',
    name: 'Type Shredder',
    emoji: '🔮',
    condition: (ps) => ps.includes('GPT') && ps.includes('DEEPSEEK'),
    effect: 'no_resistance',
    dmgMult: 1.0, rangeMult: 1.0,
    color: '#10b981',
    desc: 'GPT + DeepSeek → Enemies cannot resist (type multiplier floors at 1.0)',
  },
  {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    emoji: '👻',
    condition: (ps) => ps.includes('MISTRAL') && ps.includes('DEEPSEEK'),
    effect: 'invulnerable',
    dmgMult: 1.1, rangeMult: 1.0,
    color: '#6366f1',
    desc: 'Mistral + DeepSeek → Towers are completely immune to enemy melee damage',
  },
  {
    id: 'overclocked',
    name: 'Overclocked',
    emoji: '🚀',
    condition: (ps) => ps.includes('GEMINI') && ps.includes('LLAMA'),
    effect: 'double_fire',
    dmgMult: 1.0, rangeMult: 1.0,
    color: '#ec4899',
    desc: 'Gemini + Llama → Every tower fires twice per tick (double DPS)',
  },
  {
    id: 'full_coverage',
    name: 'Full Coverage',
    emoji: '🏰',
    condition: (ps) => new Set(ps).size >= 4,
    effect: 'melee_shield',
    dmgMult: 1.1, rangeMult: 1.0,
    color: '#9ca3af',
    desc: '4 different providers in a lane → Enemies deal 50% less melee damage to towers',
  },
  {
    id: 'frontier',
    name: 'Frontier Alliance',
    emoji: '🤝',
    condition: (ps) => ps.includes('CLAUDE') && ps.includes('GPT'),
    effect: 'buff',
    dmgMult: 1.5, rangeMult: 1.2,
    color: '#d97706',
    desc: 'Claude + GPT → ×1.5 DPS, +20% range',
  },
  {
    id: 'multimodal',
    name: 'Multimodal Surge',
    emoji: '✨',
    condition: (ps) => ps.includes('GEMINI') && (ps.includes('CLAUDE') || ps.includes('MISTRAL')),
    effect: 'buff',
    dmgMult: 1.4, rangeMult: 1.1,
    color: '#3b82f6',
    desc: 'Gemini + Claude/Mistral → ×1.4 DPS, +10% range',
  },
];

// ─── Game Modes ──────────────────────────────────────────────────────────────
const GAME_MODES = [
  { id: 'rookie',   label: 'Rookie',     emoji: '🐣', waves: 10,   enemyMult: 0.6,  spawnAdd: -1, creditBonus: 1.0, xpMult: 1.0, color: '#22c55e', desc: 'Weaker enemies — ideal for learning synergies' },
  { id: 'veteran',  label: 'Veteran',    emoji: '⚔️',  waves: 10,   enemyMult: 1.0,  spawnAdd: 0,  creditBonus: 1.5, xpMult: 1.5, color: '#3b82f6', desc: 'Balanced — +50% credits & XP on completion' },
  { id: 'champion', label: 'Champion',   emoji: '🔥', waves: 10,   enemyMult: 1.5,  spawnAdd: 2,  creditBonus: 2.5, xpMult: 2.5, color: '#f59e0b', desc: 'Harder enemies, more spawns — massive rewards' },
  { id: 'infinite', label: '∞ Infinite', emoji: '♾️', waves: 9999, enemyMult: 1.0,  spawnAdd: 0,  creditBonus: 2.0, xpMult: 3.0, color: '#ef4444', desc: 'Endless waves that grow exponentially — how far can you get?' },
];

function getLaneSynergy(lane, towers) {
  const laneTowers = Object.entries(towers).filter(([k]) => parseInt(k.split('-')[0]) === lane);
  if (laneTowers.length < 2) return null;
  const providers = laneTowers.map(([, t]) => t.card?.provider).filter(Boolean);
  for (const syn of LANE_SYNERGIES) {
    if (syn.condition(providers)) return syn;
  }
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
let eidCounter = 0;
function makeEnemy(wave, lane, isBossWave, enemyMult) {
  const types = isBossWave ? BOSS_TYPES : ENEMY_TYPES;
  const t = types[Math.floor(Math.random() * types.length)];
  // Steepening HP curve: 40%/wave for waves 1-5, then 65%/wave after
  const waveBonus = wave <= 5
    ? (wave - 1) * 0.40
    : (4 * 0.40) + (wave - 5) * 0.65;
  const hpMult = (1 + waveBonus + (isBossWave ? 0.8 : 0)) * (enemyMult ?? 1.0);
  // Enemies gain speed in very late waves
  const extraSpeed = wave >= 20 ? 1 : 0;
  return {
    id: ++eidCounter,
    ...t,
    speed: Math.min(3, t.speed + extraSpeed),
    maxHp: Math.floor(t.baseHp * hpMult),
    hp: Math.floor(t.baseHp * hpMult),
    lane,
    col: COLS - 1,
    isBoss: isBossWave,
  };
}

function towerDps(card) {
  const power = card.stats?.power ?? 80;
  const speed = card.stats?.speed ?? 80;
  return Math.max(8, Math.floor(power * 0.35 * (speed / 100)));
}

function towerRange(card) {
  return 1 + Math.floor((card.stats?.intelligence ?? 80) / 60);
}

// ─── Grid Cell ────────────────────────────────────────────────────────────────
function GridCell({ col, lane, tower, isDropTarget, onClick, synColor }) {
  const card = tower?.card;
  const isTowerZone = TOWER_COLS.includes(col);
  const color = card ? (PROVIDERS[card.provider]?.color || '#6b7280') : '#1f2937';
  return (
    <motion.div
      whileHover={isTowerZone && !card ? { scale: 1.05 } : {}}
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-lg border transition-colors select-none
        ${isTowerZone ? 'cursor-pointer' : 'cursor-default'}
        ${isDropTarget ? 'border-blue-400/80 bg-blue-900/30' : 'border-gray-700/30'}
      `}
      style={{
        width: CELL_W, height: CELL_H,
        background: card ? `${color}22` : isTowerZone ? '#111827' : 'transparent',
        borderColor: card && synColor ? `${synColor}90` : card ? `${color}60` : undefined,
        boxShadow: card && synColor ? `0 0 8px ${synColor}50` : undefined,
      }}
    >
      {isTowerZone && !card && (
        <span className="text-2xl opacity-20 select-none">+</span>
      )}
      {card && (
        <div className="text-center">
          <div className="text-2xl">{card.providerInfo?.icon || '🤖'}</div>
          <div className="text-[9px] text-gray-300 truncate w-12 text-center">{card.name.split(' ')[0]}</div>
          <div className="text-[8px] font-bold" style={{ color: RARITIES[card.rarity]?.color }}>
            {card.rarity.slice(0,3)}
          </div>
          <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden mt-0.5 mx-auto">
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(0, (tower.hp / tower.maxHp) * 100)}%`,
                background: tower.hp / tower.maxHp > 0.5 ? '#22c55e' : tower.hp / tower.maxHp > 0.25 ? '#f59e0b' : '#ef4444',
              }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function TowerDefense({ user, onComplete, onBack, onXpGain = () => {} }) {
  const [phase, setPhase]     = useState('setup'); // setup | wave | gameover | victory
  const [gameMode, setGameMode] = useState(null);  // null = show mode selector
  const [showTypeChart, setShowTypeChart] = useState(false);
  const [collection, setCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [towers, setTowers]   = useState({}); // key: `${lane}-${col}` → card
  const [enemies, setEnemies] = useState([]);
  const [wave, setWave]       = useState(0);
  const [lives, setLives]     = useState(LIVES_START);
  const [credits, setCredits] = useState(400);
  const [kills, setKills]     = useState(0);
  const [log, setLog]         = useState([]);
  const [waveEnemiesLeft, setWaveEnemiesLeft] = useState(0);
  const [spawnQueue, setSpawnQueue]   = useState([]);
  const [paused, setPaused]   = useState(false);
  const tickRef = useRef(null);
  const logRef  = useRef(null);
  const stateRef = useRef({});

  // Keep stateRef current
  useEffect(() => {
    stateRef.current = { enemies, towers, lives, kills, credits, wave, spawnQueue, waveEnemiesLeft, paused, gameMode };
  });

  // Load collection
  useEffect(() => {
    if (!user) return;
    const key = typeof user === 'string' ? user : (user.id || user.username);
    const saved = JSON.parse(localStorage.getItem(`collection_${key}`) || '[]');
    const seen = new Set();
    const deduped = saved.filter(c => {
      const k = `${c.baseId || c.id}-${c.rarity}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    }).sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
    setCollection(deduped);
  }, [user]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function addLog(msg) { setLog(prev => [...prev.slice(-30), msg]); }

  // Build wave spawn queue
  function buildSpawnQueue(waveNum) {
    const gm = stateRef.current.gameMode;
    const isBossWave = waveNum % 5 === 0;
    const spawnAdd = gm?.spawnAdd ?? 0;
    const count = isBossWave
      ? Math.max(2, 2 + Math.floor(waveNum / 10))
      : Math.max(3, 3 + waveNum + spawnAdd);
    const queue = [];
    for (let i = 0; i < count; i++) {
      queue.push({ lane: Math.floor(Math.random() * LANES), delay: i * 800, sent: false, isBossWave });
    }
    return queue;
  }

  function startWave() {
    const newWave = stateRef.current.wave + 1;
    const gm = stateRef.current.gameMode;
    setWave(newWave);
    const queue = buildSpawnQueue(newWave);
    setSpawnQueue(queue);
    setWaveEnemiesLeft(queue.length);
    setPhase('wave');
    const isBossWave = newWave % 5 === 0;
    const maxWaves = gm?.waves ?? MAX_WAVES;
    const waveLabel = maxWaves >= 9999 ? `∞ Wave ${newWave}` : `Wave ${newWave}/${maxWaves}`;
    addLog(`🌊 ${waveLabel} incoming!${isBossWave ? ' ⚠️ BOSS WAVE!' : ''}`);
  }

  // ── Game tick ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const s = stateRef.current;
    if (s.paused) return;

    // Deep-copy towers (they are { card, hp, maxHp } objects)
    const newTowers = Object.fromEntries(
      Object.entries(s.towers).map(([k, v]) => [k, { ...v }])
    );
    const newEnemies = s.enemies.map(e => ({ ...e }));
    let newLives   = s.lives;
    let newKills   = s.kills;
    let newCredits = s.credits;
    const msgs = [];

    // Step 1: Move each enemy; stop adjacent when a tower blocks path
    for (let i = 0; i < newEnemies.length; i++) {
      const e = newEnemies[i];
      const targetCol = e.col - e.speed;
      // Find the closest (rightmost) tower the enemy would walk into
      let blockKey = null, blockCol = -1;
      for (let c = e.col - 1; c >= Math.max(0, targetCol); c--) {
        if (newTowers[`${e.lane}-${c}`]) { blockCol = c; blockKey = `${e.lane}-${c}`; break; }
      }
      if (blockKey !== null) {
        newEnemies[i].col = blockCol + 1;                      // stop adjacent
        const eDmg = Math.max(5, Math.ceil(e.maxHp / 15));
        newTowers[blockKey].hp -= eDmg;                        // enemy attacks tower
      } else {
        newEnemies[i].col = targetCol;
      }
    }

    // Step 2: Each tower fires at the closest (frontmost) enemy in range
    // Compute per-lane synergy multipliers first
    const laneSynMults = {};
    for (let ln = 0; ln < LANES; ln++) {
      const syn = getLaneSynergy(ln, newTowers);
      laneSynMults[ln] = syn ? { dmg: syn.dmgMult, range: syn.rangeMult } : { dmg: 1.0, range: 1.0 };
    }
    for (const [key, tower] of Object.entries(newTowers)) {
      const [ls, cs] = key.split('-');
      const tLane = parseInt(ls), tCol = parseInt(cs);
      const synMult = laneSynMults[tLane];
      const range = Math.floor(towerRange(tower.card) * synMult.range);
      const dmg   = Math.floor(towerDps(tower.card) * synMult.dmg);
      const targets = newEnemies
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.lane === tLane && e.col > tCol && e.col <= tCol + range)
        .sort((a, b) => a.e.col - b.e.col);
      if (targets.length > 0) {
        const { i: idx } = targets[0];
        const mult = getTypeMultiplier(tower.card.provider, newEnemies[idx].provider);
        newEnemies[idx].hp -= Math.floor(dmg * mult);
      }
    }

    // Step 3: Remove destroyed towers
    for (const key of Object.keys(newTowers)) {
      if (newTowers[key].hp <= 0) {
        msgs.push(`💥 Tower in lane ${parseInt(key.split('-')[0]) + 1} was destroyed!`);
        delete newTowers[key];
      }
    }

    // Step 4: Collect dead enemies
    const dead = newEnemies.filter(e => e.hp <= 0);
    if (dead.length > 0) {
      newKills += dead.length;
      const earned = dead.reduce((sum, e) => sum + e.reward, 0);
      newCredits += earned;
      const bossKills = dead.filter(e => e.isBoss);
      if (bossKills.length > 0) msgs.push(`🏆 BOSS SLAIN! +${bossKills.reduce((s, e) => s + e.reward, 0)} credits`);
      const normalKills = dead.filter(e => !e.isBoss);
      if (normalKills.length > 0) msgs.push(`💀 ${normalKills.length} ${normalKills.length > 1 ? 'enemies' : 'enemy'} destroyed! +${normalKills.reduce((s, e) => s + e.reward, 0)} credits`);
    }
    const aliveEnemies = newEnemies.filter(e => e.hp > 0);

    // Step 5: Enemies that escaped past the base (col < 0)
    const escaped = aliveEnemies.filter(e => e.col < 0);
    if (escaped.length > 0) {
      newLives -= escaped.length;
      msgs.push(`💔 ${escaped.length} enemy breached base! Lives: ${newLives}`);
    }
    const finalEnemies = aliveEnemies.filter(e => e.col >= 0);

    msgs.forEach(addLog);
    setEnemies(finalEnemies);
    setTowers(newTowers);
    setLives(newLives);
    setKills(newKills);
    setCredits(newCredits);

    // Wave clear check
    if (finalEnemies.length === 0 && s.waveEnemiesLeft === 0) {
      const waveBonus = 300 + s.wave * 100;
      setCredits(c => c + waveBonus);
      addLog(`✅ Wave ${s.wave} cleared! +${waveBonus} credits`);
      if (s.wave >= MAX_WAVES) {
        setPhase('victory');
      } else {
        setPhase('setup');
      }
    }

    // Defeat check
    if (newLives <= 0) {
      setLives(0);
      setPhase('gameover');
      addLog('💀 Base destroyed! Game over!');
    }
  }, []);

  // Spawn queue processor
  const spawnTick = useCallback(() => {
    const now = Date.now();
    setSpawnQueue(prev => {
      if (prev.every(q => q.sent)) return prev;
      const updated = [...prev];
      let anySpawned = false;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i].sent) {
          if (!updated[i].spawnAt) { updated[i] = { ...updated[i], spawnAt: now + updated[i].delay }; }
          if (now >= updated[i].spawnAt) {
            updated[i] = { ...updated[i], sent: true };
            const gm = stateRef.current.gameMode;
            const newEnemy = makeEnemy(stateRef.current.wave, updated[i].lane, updated[i].isBossWave ?? false, gm?.enemyMult ?? 1.0);
            setEnemies(prev => [...prev, newEnemy]);
            anySpawned = true;
          }
        }
      }
      if (anySpawned) {
        const remaining = updated.filter(q => !q.sent).length;
        // Also decrement waveEnemiesLeft when all spawned (enemies in play handle rest)
        if (remaining === 0) setWaveEnemiesLeft(0);
      }
      return updated;
    });
  }, []);

  // Start/stop tick loop
  useEffect(() => {
    if (phase === 'wave' && !paused) {
      tickRef.current = setInterval(() => { tick(); spawnTick(); }, TICK_MS);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [phase, paused, tick, spawnTick]);

  function placeTower(lane, col) {
    if (!selectedCard) return;
    const key = `${lane}-${col}`;
    if (towers[key]) return;
    const cost = (RARITY_ORDER[selectedCard.rarity] || 1) * 50;
    if (credits < cost) { addLog(`❌ Need ${cost} credits to place this card`); return; }
    const hp = calculateHP(selectedCard);
    setTowers(prev => ({ ...prev, [key]: { card: selectedCard, hp, maxHp: hp } }));
    setCredits(c => c - cost);
    addLog(`🏰 Placed ${selectedCard.name} in lane ${lane + 1} (HP: ${hp}, cost: ${cost})`);
    setSelectedCard(null);
  }

  function removeTower(lane, col) {
    const key = `${lane}-${col}`;
    if (!towers[key]) return;
    const refund = Math.floor((RARITY_ORDER[towers[key].card.rarity] || 1) * 25);
    setTowers(prev => { const n = { ...prev }; delete n[key]; return n; });
    setCredits(c => c + refund);
  }

  const gm = gameMode;
  const maxWaves = gm?.waves ?? MAX_WAVES;
  const gmXpMult = gm?.xpMult ?? 1.0;
  const gmCreditMult = gm?.creditBonus ?? 1.0;
  const totalReward = Math.floor(
    (wave >= maxWaves ? kills * 100 + 5000 : kills * 100 + wave * 500) * gmCreditMult
  );
  const totalXp = Math.floor(
    (wave >= maxWaves ? 1000 : Math.max(50, wave * 75)) * gmXpMult
  );

  // ─── Mode selector screen ───────────────────────────────────────────────────────
  if (!gameMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              🏰 Tower Defense
            </h1>
            <p className="text-gray-400">Select a difficulty to begin</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {GAME_MODES.map(mode => (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setGameMode(mode)}
                className="p-5 rounded-2xl border-2 text-left flex flex-col gap-2 transition-all"
                style={{ borderColor: `${mode.color}60`, background: `${mode.color}12` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{mode.emoji}</span>
                  <span className="text-xl font-black" style={{ color: mode.color }}>{mode.label}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{mode.desc}</p>
                <div className="flex flex-wrap gap-2 text-[11px] mt-1">
                  {mode.waves >= 9999 ? (
                    <span className="text-red-400">&#9837; Endless</span>
                  ) : (
                    <span className="text-gray-300">🌊 {mode.waves} waves</span>
                  )}
                  {mode.xpMult > 1 && <span className="text-purple-400">+{Math.round((mode.xpMult-1)*100)}% XP</span>}
                  {mode.creditBonus > 1 && <span className="text-yellow-400">+{Math.round((mode.creditBonus-1)*100)}% Credits</span>}
                  {mode.enemyMult !== 1 && <span style={{ color: mode.color }}>{mode.enemyMult < 1 ? `${Math.round(mode.enemyMult*100)}% enemy HP` : `${Math.round(mode.enemyMult*100)}% enemy HP`}</span>}
                </div>
              </motion.button>
            ))}
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 mx-auto text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => {
            if (phase === 'wave' && !window.confirm('Abandon defense?')) return;
            onBack();
          }}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </motion.button>
        <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          🏰 Tower Defense
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${gm.color}20`, color: gm.color }}>{gm.emoji} {gm.label}</span>
          <span className="text-red-400">❤️ {lives}</span>
          <span className="text-yellow-400">💰 {credits}</span>
          <span className="text-blue-400">💀 {kills}</span>
        </div>
      </header>

      {/* Wave progress */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <span className="shrink-0">
          {maxWaves >= 9999 ? `∞ Wave ${wave}` : `Wave ${wave}/${maxWaves}`}
        </span>
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: maxWaves >= 9999 ? `${Math.min(100, (wave / 30) * 100)}%` : `${(wave / maxWaves) * 100}%` }}
          />
        </div>
        {phase === 'wave' && (
          <button onClick={() => setPaused(p => !p)} className="flex items-center gap-1 text-gray-300 hover:text-white">
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="mb-2 overflow-x-auto">
        <div className="inline-block">
          {/* Column labels */}
          <div className="flex mb-1 items-center">
            <div style={{ width: 40 }} />
            <div style={{ width: 22 }} />
            {Array.from({ length: COLS }).map((_, col) => (
              <React.Fragment key={col}>
                {col === TOWER_COLS.length && <div style={{ width: 6 }} />}
                <div style={{ width: CELL_W, margin: '0 1px' }} className="text-center text-xs text-gray-500">
                  {TOWER_COLS.includes(col) ? '🏰' : col === TOWER_COLS.length ? '⚔️' : col === COLS - 1 ? '→' : ''}
                </div>
              </React.Fragment>
            ))}
          </div>
          {Array.from({ length: LANES }).map((_, lane) => {
            const activeSyn = getLaneSynergy(lane, towers);
            return (
              <div key={lane} className="flex items-center mb-1">
                <div style={{ width: 40 }} className="text-xs text-gray-500 text-right pr-2 shrink-0">L{lane+1}</div>
                {/* Synergy badge */}
                <div style={{ width: 22 }} className="flex items-center justify-center shrink-0">
                  {activeSyn && (
                    <motion.span
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-sm cursor-help leading-none"
                      title={`${activeSyn.name}: ${activeSyn.desc}`}
                    >
                      {activeSyn.emoji}
                    </motion.span>
                  )}
                </div>
                {Array.from({ length: COLS }).map((_, col) => {
                  const key = `${lane}-${col}`;
                  const towerObj = towers[key];
                  const isTZ = TOWER_COLS.includes(col);
                  const cellEnemies = enemies.filter(e => e.lane === lane && e.col === col);
                  return (
                    <React.Fragment key={col}>
                      {col === TOWER_COLS.length && (
                        <div style={{ width: 6, height: CELL_H, background: '#374151', borderRadius: 2, margin: '0 0px', flexShrink: 0 }} />
                      )}
                      <div className="relative" style={{ width: CELL_W, height: CELL_H, margin: '0 1px', flexShrink: 0 }}>
                        <GridCell
                          col={col} lane={lane} tower={towerObj}
                          isDropTarget={isTZ && !!selectedCard && !towerObj}
                          synColor={activeSyn && isTZ && towerObj ? activeSyn.color : null}
                          onClick={() => {
                            if (isTZ) {
                              if (towerObj) removeTower(lane, col);
                              else placeTower(lane, col);
                            }
                          }}
                        />
                        {/* Enemy overlays */}
                        {cellEnemies.map(e => (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                          >
                            <div className={`text-xl ${e.isBoss ? 'text-3xl' : ''}`}>{e.icon}</div>
                            <div className="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full transition-all"
                                style={{ width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` }} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─ Synergy Panel + Type Chart ──────────────────────────────────────────── */}
      <div className="mb-3 rounded-xl bg-gray-900/70 border border-gray-700/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-300">⚡ Lane Synergies</span>
          <button
            onClick={() => setShowTypeChart(p => !p)}
            className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            {showTypeChart ? '▼' : '▶'} Type Chart
          </button>
        </div>

        {/* Active synergies grid */}
        {Array.from({ length: LANES }).some((_, l) => getLaneSynergy(l, towers)) ? (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {Array.from({ length: LANES }).map((_, lane) => {
              const syn = getLaneSynergy(lane, towers);
              if (!syn) return null;
              return (
                <motion.div
                  key={lane}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ background: `${syn.color}18`, border: `1px solid ${syn.color}50` }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-xl shrink-0 leading-none"
                  >{syn.emoji}</motion.span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold" style={{ color: syn.color }}>L{lane+1}: {syn.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{syn.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-[10px] text-gray-600 mb-2">
            No synergies active — pair <span className="text-gray-400">different</span> cross-provider towers in a lane to unlock unique mechanics
          </div>
        )}

        {/* Synergy reference (all possible) */}
        <details className="text-[10px]">
          <summary className="text-gray-600 cursor-pointer hover:text-gray-400 list-none">▶ All synergies ({LANE_SYNERGIES.length} total)</summary>
          <div className="mt-2 grid grid-cols-1 gap-1">
            {LANE_SYNERGIES.map(syn => {
              const active = Array.from({ length: LANES }).some((_, l) => getLaneSynergy(l, towers)?.id === syn.id);
              return (
                <div key={syn.id} className={`flex items-start gap-1.5 ${active ? 'opacity-100' : 'opacity-40'}`}>
                  <span>{syn.emoji}</span>
                  <span className="font-bold" style={{ color: syn.color }}>{syn.name}</span>
                  <span className="text-gray-500">— {syn.desc}</span>
                </div>
              );
            })}
          </div>
        </details>

        {/* Type chart reference (collapsible) */}
        <AnimatePresence>
          {showTypeChart && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-gray-700/50"
            >
              <div className="text-[10px] text-gray-500 mb-2">Attacker → Defender — <span className="text-green-400">▲ strong</span> / <span className="text-red-400">▼ weak</span></div>
              <div className="overflow-x-auto">
                <table className="text-[9px] border-collapse w-full">
                  <thead>
                    <tr>
                      <th className="p-1 text-gray-600 text-left">ATK ▶ DEF</th>
                      {Object.keys(PROVIDERS).map(p => (
                        <th key={p} className="p-1 text-center" style={{ color: PROVIDERS[p].color }}>
                          {PROVIDERS[p].icon ?? p.slice(0,3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(PROVIDERS).map(atk => (
                      <tr key={atk}>
                        <td className="p-1 font-bold" style={{ color: PROVIDERS[atk].color }}>{PROVIDERS[atk].icon ?? atk.slice(0,3)}</td>
                        {Object.keys(PROVIDERS).map(def => {
                          const mult = getTypeMultiplier(atk, def);
                          const bg = mult >= 1.25 ? '#22c55e30' : mult >= 1.1 ? '#86efac18' : mult <= 0.76 ? '#ef444430' : mult <= 0.9 ? '#fca5a518' : 'transparent';
                          const clr = mult >= 1.25 ? '#4ade80' : mult >= 1.1 ? '#86efac' : mult <= 0.76 ? '#f87171' : mult <= 0.9 ? '#fca5a5' : '#4b5563';
                          return (
                            <td key={def} className="p-1 text-center" style={{ background: bg, color: clr }}>
                              {atk === def ? '―' : mult.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom panel: card picker + log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card picker */}
        <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-300">Choose Tower {selectedCard && <span className="text-blue-400">(placing {selectedCard.name})</span>}</span>
            {selectedCard && <button onClick={() => setSelectedCard(null)} className="text-xs text-gray-500 hover:text-white">Cancel</button>}
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {collection.map(card => {
              const cost = (RARITY_ORDER[card.rarity] || 1) * 50;
              const canAfford = credits >= cost;
              const color = PROVIDERS[card.provider]?.color || '#6b7280';
              return (
                <motion.div
                  key={card.id}
                  whileHover={canAfford ? { scale: 1.05 } : {}}
                  whileTap={canAfford ? { scale: 0.95 } : {}}
                  onClick={() => canAfford && setSelectedCard(selectedCard?.id === card.id ? null : card)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedCard?.id === card.id ? 'border-blue-400 bg-blue-900/40' :
                    canAfford ? 'border-gray-700 hover:border-gray-500 bg-gray-800/50' :
                    'border-gray-800 bg-gray-900/50 opacity-40 cursor-not-allowed'
                  }`}
                  style={selectedCard?.id === card.id ? { boxShadow: `0 0 12px ${color}40` } : {}}
                >
                  <div className="text-xl text-center">{card.providerInfo?.icon || '🤖'}</div>
                  <div className="text-[10px] text-gray-300 text-center w-14 truncate">{card.name.split(' ')[0]}</div>
                  <div className="text-[9px] text-center font-bold" style={{ color: RARITIES[card.rarity]?.color }}>{card.rarity.slice(0,3)}</div>
                  <div className="text-[9px] text-yellow-400 text-center mt-0.5">💰{cost}</div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-gray-500 space-y-0.5">
            <div>🏰 Click any of the 4 tower columns to place • Click placed tower to sell (50% refund)</div>
            <div>⚡ Power+Speed → DPS · 🎯 Intelligence → range · 🔮 type matchups apply</div>
            <div>✨ <span className="text-purple-400">Synergies:</span> Mix <span className="text-yellow-400">cross-provider</span> towers in a lane — each combo unlocks a unique mechanic (chain, double-fire, invulnerable…)</div>
          </div>
        </div>

        {/* Battle log */}
        <div ref={logRef} className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-3 h-52 overflow-y-auto">
          {log.length === 0 && <div className="text-xs text-gray-600 text-center pt-8">Place towers and start the first wave!</div>}
          {log.map((l, i) => <div key={i} className="text-xs text-gray-300 leading-relaxed">{l}</div>)}
        </div>
      </div>

      {/* Action button */}
      <div className="mt-4 flex gap-3">
        {phase === 'setup' && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={startWave}
            className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-lg flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            {wave === 0 ? 'Start Wave 1' : `Start Wave ${wave + 1}`}
          </motion.button>
        )}
        {phase === 'wave' && (
          <div className="flex-1 py-4 rounded-xl font-bold text-lg bg-gray-800/60 text-gray-300 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
            Wave {wave} in progress… ({enemies.length} active)
          </div>
        )}
      </div>

      {/* ── RESULT OVERLAYS ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {(phase === 'gameover' || phase === 'victory') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full border text-center"
              style={{ borderColor: phase === 'victory' ? '#f59e0b50' : '#ef444450' }}
            >
              <div className="text-7xl mb-4">{phase === 'victory' ? '🏰' : '💥'}</div>
              <h2 className={`text-3xl font-black mb-2 ${phase === 'victory' ? 'text-amber-400' : 'text-red-400'}`}>
                {phase === 'victory' ? 'Fortress Held!' : 'Base Destroyed!'}
              </h2>
              <p className="text-gray-400 mb-6 text-sm">
                {phase === 'victory'
                  ? maxWaves >= 9999
                    ? `Survived ${wave} infinite waves! Legendary defender!`
                    : `All ${maxWaves} waves repelled. You are the ultimate defender!`
                  : `You survived ${wave} wave${wave !== 1 ? 's' : ''} before your base fell.`}
              </p>
              <div className="bg-gray-800/60 rounded-2xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Credits Earned</span>
                  <span className="font-black text-yellow-400">+{totalReward}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">XP Earned</span>
                  <span className="font-black text-blue-400">+{totalXp}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Enemies Killed</span>
                  <span className="font-bold text-gray-300">{kills}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Waves Survived</span>
                  <span className="font-bold text-gray-300">{maxWaves >= 9999 ? wave : `${wave}/${maxWaves}`}</span>
                </div>
                {gm && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Mode</span>
                    <span className="font-bold" style={{ color: gm.color }}>{gm.emoji} {gm.label}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setPhase('setup'); setWave(0); setLives(LIVES_START); setCredits(400);
                    setKills(0); setTowers({}); setEnemies([]); setLog([]); setSpawnQueue([]); setWaveEnemiesLeft(0);
                    setGameMode(null); // return to mode selector
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium"
                >
                  Play Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onXpGain(totalXp);
                    onComplete(totalReward);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm shadow-lg"
                  style={{ background: phase === 'victory' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#374151' }}
                >
                  Collect Reward
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

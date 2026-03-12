import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Swords, Shield, Zap, Brain, Sparkles, Star,
  ChevronRight, RotateCcw, Trophy, Skull, Plus, X, Info,
  Save, FolderOpen, Filter, SortAsc, Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PROVIDERS, calculateHP } from '../data/cards';

// ─────────────────────────────────────────────
//  SYNERGY DEFINITIONS
// ─────────────────────────────────────────────
export const SYNERGIES = {
  TURING_TRIO: {
    id: 'TURING_TRIO',
    name: 'Turing Trio',
    description: 'Any 3 cards from different providers: All cards gain +15% power.',
    icon: '🔺',
    color: '#f59e0b',
    check: (cards) => new Set(cards.map(c => c.provider)).size >= 3,
    effect: { type: 'all_power', value: 0.15 }
  },
  CLAUDE_COLLECTIVE: {
    id: 'CLAUDE_COLLECTIVE',
    name: 'Claude Collective',
    description: '2+ Claude cards: Reveal one opponent card at battle start.',
    icon: '🤖',
    color: '#d97706',
    check: (cards) => cards.filter(c => c.provider === 'CLAUDE').length >= 2,
    effect: { type: 'reveal', value: 1 }
  },
  GPT_SWARM: {
    id: 'GPT_SWARM',
    name: 'GPT Swarm',
    description: '2+ GPT cards: Each card starts with a random stat +20%.',
    icon: '🧠',
    color: '#10b981',
    check: (cards) => cards.filter(c => c.provider === 'GPT').length >= 2,
    effect: { type: 'random_stat_boost', value: 0.20 }
  },
  GEMINI_FLUX: {
    id: 'GEMINI_FLUX',
    name: 'Gemini Flux',
    description: '2+ Gemini cards: Energy regenerates 50% faster.',
    icon: '✨',
    color: '#3b82f6',
    check: (cards) => cards.filter(c => c.provider === 'GEMINI').length >= 2,
    effect: { type: 'energy_regen', value: 1.5 }
  },
  OPEN_SOURCE_ALLIANCE: {
    id: 'OPEN_SOURCE_ALLIANCE',
    name: 'Open Source Alliance',
    description: 'Llama + DeepSeek + Mistral in deck: All cards gain +25% HP.',
    icon: '🌐',
    color: '#8b5cf6',
    check: (cards) => {
      const providers = cards.map(c => c.provider);
      return providers.includes('LLAMA') && providers.includes('DEEPSEEK') && providers.includes('MISTRAL');
    },
    effect: { type: 'hp_boost', value: 0.25 }
  },
  RIVALS: {
    id: 'RIVALS',
    name: 'Ancient Rivals',
    description: 'Claude + GPT in same deck: Both deal +30% damage against each other\'s cards.',
    icon: '⚔️',
    color: '#ef4444',
    check: (cards) => {
      const providers = cards.map(c => c.provider);
      return providers.includes('CLAUDE') && providers.includes('GPT');
    },
    effect: { type: 'rival_damage', value: 0.30 }
  },
  FULL_SPECTRUM: {
    id: 'FULL_SPECTRUM',
    name: 'Full Spectrum',
    description: 'All 6 providers represented: Deck gains an extra card slot and +10% to all stats.',
    icon: '🌈',
    color: '#ec4899',
    check: (cards) => new Set(cards.map(c => c.provider)).size >= 6,
    effect: { type: 'all_stats', value: 0.10 }
  }
};

// ─────────────────────────────────────────────
//  DECK BATTLE ACTIONS
// ─────────────────────────────────────────────
const DECK_ACTIONS = {
  SURGE: {
    id: 'surge',
    name: 'Surge',
    icon: '⚡',
    description: 'Deploy active card to deal (Power × 0.6) damage.',
    energyCost: 20,
    stat: 'power',
    factor: 0.6
  },
  BARRIER: {
    id: 'barrier',
    name: 'Barrier',
    icon: '🛡️',
    description: 'Active card absorbs 80% of next hit.',
    energyCost: 15,
    stat: 'speed',
    factor: 0
  },
  COMBO: {
    id: 'combo',
    name: 'Combo',
    icon: '🌀',
    description: 'Chain active + next card for (combined Creativity × 0.4) damage.',
    energyCost: 35,
    stat: 'creativity',
    factor: 0.4
  },
  OVERDRIVE: {
    id: 'overdrive',
    name: 'Overdrive',
    icon: '🔥',
    description: 'Sacrifice 20% of active card HP to deal (Intelligence × 0.9) damage.',
    energyCost: 25,
    stat: 'intelligence',
    factor: 0.9
  },
  SWITCH: {
    id: 'switch',
    name: 'Switch',
    icon: '🔄',
    description: 'Swap active card without losing a turn, next card gains +10% damage.',
    energyCost: 10,
    stat: null,
    factor: 0
  }
};

// ─────────────────────────────────────────────
//  HELPER UTILS
// ─────────────────────────────────────────────
const getActiveSynergies = (cards) =>
  Object.values(SYNERGIES).filter(s => s.check(cards));

const applyBuffsToCard = (card, synergies, buffs = {}) => {
  const stats = { ...card.stats };
  let hp = calculateHP(card);

  synergies.forEach(s => {
    if (s.effect.type === 'all_power') {
      stats.power = Math.round(stats.power * (1 + s.effect.value));
    }
    if (s.effect.type === 'all_stats') {
      Object.keys(stats).forEach(k => {
        stats[k] = Math.round(stats[k] * (1 + s.effect.value));
      });
    }
    if (s.effect.type === 'hp_boost') {
      hp = Math.round(hp * (1 + s.effect.value));
    }
    if (s.effect.type === 'random_stat_boost') {
      const keys = Object.keys(stats);
      const k = keys[Math.floor(Math.random() * keys.length)];
      stats[k] = Math.round(stats[k] * (1 + s.effect.value));
    }
  });

  Object.entries(buffs).forEach(([stat, val]) => {
    if (stats[stat] !== undefined) stats[stat] = Math.round(stats[stat] * (1 + val));
  });

  return { ...card, stats, maxHP: hp, currentHP: hp };
};

const buildDeckState = (cards, synergies) =>
  cards.map(c => applyBuffsToCard(c, synergies));

const chooseAIAction = (aiDeck, playerDeck, energy) => {
  const active = aiDeck[0];
  const playerActive = playerDeck[0];
  if (!active || !playerActive) return null;

  const affordable = Object.values(DECK_ACTIONS).filter(a => a.energyCost <= energy);
  if (!affordable.length) return DECK_ACTIONS.BARRIER; // wait

  // Very low HP? Switch if possible
  if (active.currentHP < active.maxHP * 0.2 && aiDeck.length > 1) {
    const sw = affordable.find(a => a.id === 'switch');
    if (sw) return sw;
  }
  // High intelligence -> overdrive
  if (active.stats.intelligence > 85 && affordable.find(a => a.id === 'overdrive')) {
    return DECK_ACTIONS.OVERDRIVE;
  }
  // More than 1 card -> combo
  if (aiDeck.filter(c => c.currentHP > 0).length >= 2 && affordable.find(a => a.id === 'combo')) {
    if (Math.random() < 0.4) return DECK_ACTIONS.COMBO;
  }
  // Default weighted
  const weights = affordable.map(a => {
    if (a.id === 'surge') return 3;
    if (a.id === 'barrier') return active.currentHP < active.maxHP * 0.4 ? 3 : 1;
    return 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < affordable.length; i++) {
    r -= weights[i];
    if (r <= 0) return affordable[i];
  }
  return affordable[0];
};

// ─────────────────────────────────────────────
//  PARTICLE BURST COMPONENT
// ─────────────────────────────────────────────
function ParticleBurst({ x, y, color, count = 12 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360,
    distance: 40 + Math.random() * 60
  }));
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, transform: 'translate(-50%,-50%)' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: color, left: 0, top: 0 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  FLOATING DAMAGE NUMBER
// ─────────────────────────────────────────────
function FloatingNumber({ value, color, onDone }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -80, opacity: 0, scale: 1.4 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="absolute text-3xl font-black pointer-events-none z-50"
      style={{ color, textShadow: `0 0 20px ${color}` }}
    >
      {value > 0 ? `-${Math.floor(value)}` : value === 0 ? 'BLOCK!' : value}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  CARD SLOT COMPONENT
// ─────────────────────────────────────────────
function CardSlot({ card, isActive, isShaking, glowColor, faceDown = false, onClick }) {
  const hp = card ? card.currentHP : 0;
  const maxHP = card ? card.maxHP : 1;
  const hpPct = Math.max(0, (hp / maxHP) * 100);
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#eab308' : '#ef4444';

  if (!card) {
    return (
      <div className="w-20 h-28 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center opacity-40">
        <X className="w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (faceDown) {
    return (
      <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center">
        <span className="text-2xl">🂠</span>
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      animate={
        isShaking
          ? { x: [-6, 6, -6, 6, 0], transition: { duration: 0.3 } }
          : isActive
          ? { scale: [1, 1.04, 1], transition: { duration: 1.5, repeat: Infinity } }
          : {}
      }
      className={`relative w-20 h-28 rounded-xl border-2 cursor-pointer transition-all select-none overflow-hidden ${
        isActive
          ? 'border-white shadow-lg'
          : 'border-gray-700 hover:border-gray-500'
      }`}
      style={isActive ? { boxShadow: `0 0 18px 4px ${glowColor}60` } : {}}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${glowColor}30 0%, #0f0f1a 100%)`
        }}
      />
      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full p-1 pt-2">
        <span className="text-2xl">{card.providerInfo.icon}</span>
        <div className="w-full">
          <div className="text-center text-xs font-bold text-white truncate px-1">{card.name.split(' ').slice(-1)[0]}</div>
          {/* HP bar */}
          <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: hpColor }}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-center text-xs text-gray-400 mt-0.5">{Math.ceil(hp)}</div>
        </div>
      </div>
      {/* KO overlay */}
      {hp <= 0 && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl z-20">
          <span className="text-xs font-bold text-red-400">KO</span>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  SYNERGY BADGE
// ─────────────────────────────────────────────
function SynergyBadge({ synergy }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold"
      style={{ background: `${synergy.color}25`, border: `1px solid ${synergy.color}60`, color: synergy.color }}
    >
      <span>{synergy.icon}</span>
      <span>{synergy.name}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
const PRESET_KEY = (user) => `deckPresets_${typeof user === 'string' ? user : (user?.username || user?.id || 'guest')}`;

function loadPresets(user) {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY(user)) || '[]'); } catch { return []; }
}
function savePresets(user, presets) {
  localStorage.setItem(PRESET_KEY(user), JSON.stringify(presets));
}

export function DeckBattle({ user, onComplete, onBack, onXpGain = () => {} }) {
  const { recordBattle } = useAuth();
  const [collection, setCollection] = useState([]);
  const [phase, setPhase] = useState('build'); // build | reveal | battle | result
  const [playerDeckSelection, setPlayerDeckSelection] = useState([]); // cards being built
  const MAX_DECK = 5;

  // Build-phase filter/sort/preset state
  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterRarity, setFilterRarity] = useState('ALL');
  const [sortBy, setSortBy] = useState('default'); // default | name | rarity | stats
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  // Battle state
  const [playerDeck, setPlayerDeck] = useState([]);
  const [enemyDeck, setEnemyDeck] = useState([]);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [enemyEnergy, setEnemyEnergy] = useState(100);
  const [playerBarrier, setPlayerBarrier] = useState(false);
  const [enemyBarrier, setEnemyBarrier] = useState(false);
  const [playerSwitchBonus, setPlayerSwitchBonus] = useState(false);
  const [enemySwitchBonus, setEnemySwitchBonus] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const [reward, setReward] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [floatingNums, setFloatingNums] = useState([]);
  const [particles, setParticles] = useState([]);
  const [shakingSlot, setShakingSlot] = useState(null); // 'player' | 'enemy'
  const [revealedEnemyIdx, setRevealedEnemyIdx] = useState(null);
  const [screenFlash, setScreenFlash] = useState(null); // color
  const [showSynergyPopup, setShowSynergyPopup] = useState(false);
  const [activeSynergyIds, setActiveSynergyIds] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    if (user) {
      const key = typeof user === 'string' ? user : user.username;
      const saved = JSON.parse(localStorage.getItem(`collection_${key}`) || '[]');
      setCollection(saved);
      setPresets(loadPresets(user));
    }
  }, [user]);

  const savePreset = () => {
    const name = presetName.trim() || `Deck ${presets.length + 1}`;
    // Store card ids so we can re-hydrate from collection
    const ids = playerDeckSelection.map(c => c.id);
    const updated = [...presets, { name, ids, createdAt: Date.now() }];
    setPresets(updated);
    savePresets(user, updated);
    setPresetName('');
  };

  const loadPreset = (preset) => {
    const cards = preset.ids
      .map(id => collection.find(c => c.id === id))
      .filter(Boolean)
      .slice(0, MAX_DECK);
    setPlayerDeckSelection(cards);
    setShowPresets(false);
  };

  const deletePreset = (idx) => {
    const updated = presets.filter((_, i) => i !== idx);
    setPresets(updated);
    savePresets(user, updated);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  // ── build phase filter/sort ──
  const RARITY_ORDER = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5 };
  const filteredSortedCollection = collection
    .filter(c => (filterProvider === 'ALL' || c.provider === filterProvider)
               && (filterRarity === 'ALL' || c.rarity === filterRarity))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rarity') return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
      if (sortBy === 'stats') {
        const sumA = Object.values(a.stats).reduce((s, v) => s + v, 0);
        const sumB = Object.values(b.stats).reduce((s, v) => s + v, 0);
        return sumB - sumA;
      }
      return 0;
    });

  // ── build phase helpers ──
  const toggleCardInDeck = (card) => {
    if (playerDeckSelection.find(c => c.id === card.id)) {
      // Deselect
      setPlayerDeckSelection(prev => prev.filter(c => c.id !== card.id));
    } else if (playerDeckSelection.length < MAX_DECK) {
      // Block if another card with the same base model is already in the deck
      if (playerDeckSelection.find(c => c.baseId === card.baseId)) return;
      setPlayerDeckSelection(prev => [...prev, card]);
    }
  };

  const currentSynergies = getActiveSynergies(playerDeckSelection);

  const startBattle = () => {
    if (playerDeckSelection.length < 2) return;
    const synergies = getActiveSynergies(playerDeckSelection);
    const energyRegenSyn = synergies.find(s => s.id === 'GEMINI_FLUX');

    // Build player deck with synergy buffs applied
    const pDeck = buildDeckState(playerDeckSelection, synergies);

    // Build AI deck: pick random cards from pool of available cards
    const pool = collection.filter(c => !playerDeckSelection.find(p => p.id === c.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const aiCards = shuffled.slice(0, Math.min(MAX_DECK, shuffled.length));
    // Fallback: use random cards from full collection if pool small
    const aiPool = aiCards.length >= 2 ? aiCards : [...collection].sort(() => Math.random() - 0.5).slice(0, 5);
    const aiSynergies = getActiveSynergies(aiPool);
    const eDeck = buildDeckState(aiPool, aiSynergies);

    const revealSyn = synergies.find(s => s.id === 'CLAUDE_COLLECTIVE');
    setRevealedEnemyIdx(revealSyn ? 0 : null);
    setActiveSynergyIds(synergies.map(s => s.id));

    setPlayerDeck(pDeck);
    setEnemyDeck(eDeck);
    setPlayerEnergy(100);
    setEnemyEnergy(100);
    setPlayerBarrier(false);
    setEnemyBarrier(false);
    setBattleLog(['⚔️ Deck Battle begins!', `Your deck: ${pDeck.map(c => c.name).join(', ')}`]);
    setTurnCount(0);
    setWinner(null);
    setReward(0);
    setIsProcessing(false);
    setPendingAction(null);
    setPhase('reveal');

    setTimeout(() => setPhase('battle'), 2200);
  };

  // ── spawn effects ──
  const spawnFloat = (value, color) => {
    const id = Date.now() + Math.random();
    setFloatingNums(prev => [...prev, { id, value, color }]);
  };

  const spawnParticles = (side, color) => {
    const id = Date.now() + Math.random();
    const x = side === 'player' ? '25%' : '75%';
    setParticles(prev => [...prev, { id, x, y: '50%', color }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 700);
  };

  const flashScreen = (color) => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), 300);
  };

  const shakeSlot = (side) => {
    setShakingSlot(side);
    setTimeout(() => setShakingSlot(null), 350);
  };

  const addLog = (msg) => setBattleLog(prev => [...prev, msg]);

  // ── damage helpers ──
  const getActivePlayer = (deck) => deck.find(c => c.currentHP > 0) || null;
  const getActiveStat = (card, stat) => (card.stats[stat] || 0);

  const applyDamageToEnemy = useCallback((amount, deckSetter, deck) => {
    const activeIdx = deck.findIndex(c => c.currentHP > 0);
    if (activeIdx === -1) return deck;
    const updated = deck.map((c, i) => {
      if (i !== activeIdx) return c;
      return { ...c, currentHP: Math.max(0, c.currentHP - amount) };
    });
    deckSetter(updated);
    return updated;
  }, []);

  const applyDamageToPlayer = useCallback((amount, deckSetter, deck) => {
    const activeIdx = deck.findIndex(c => c.currentHP > 0);
    if (activeIdx === -1) return deck;
    const updated = deck.map((c, i) => {
      if (i !== activeIdx) return c;
      return { ...c, currentHP: Math.max(0, c.currentHP - amount) };
    });
    deckSetter(updated);
    return updated;
  }, []);

  const isDeckDead = (deck) => deck.every(c => c.currentHP <= 0);

  // ── perform player action ──
  const performAction = async (action) => {
    if (isProcessing || winner) return;
    if (playerEnergy < action.energyCost) {
      addLog('⚠️ Not enough energy!');
      return;
    }
    setIsProcessing(true);
    setPendingAction(action);

    const pActive = getActivePlayer(playerDeck);
    const eActive = getActivePlayer(enemyDeck);
    if (!pActive || !eActive) { setIsProcessing(false); return; }

    let newPlayerDeck = playerDeck;
    let newEnemyDeck = enemyDeck;
    let newPlayerEnergy = playerEnergy - action.energyCost;
    let newEnemyEnergy = enemyEnergy;
    let newPlayerBarrier = playerBarrier;
    let newEnemyBarrier = enemyBarrier;

    // ── player turn ──
    switch (action.id) {
      case 'surge': {
        let dmg = getActiveStat(pActive, 'power') * action.factor;
        if (playerSwitchBonus) { dmg *= 1.1; setPlayerSwitchBonus(false); }
        const rivalSyn = activeSynergyIds.includes('RIVALS');
        if (rivalSyn && eActive.provider === 'CLAUDE') dmg *= 1.30;
        if (newEnemyBarrier) {
          dmg *= 0.2;
          newEnemyBarrier = false;
          setEnemyBarrier(false);
          addLog(`🛡️ Enemy barrier absorbs most of the Surge!`);
        }
        newEnemyDeck = applyDamageToEnemy(dmg, setEnemyDeck, enemyDeck);
        spawnParticles('enemy', '#ef4444');
        shakeSlot('enemy');
        flashScreen('#ef444440');
        spawnFloat(dmg, '#ef4444');
        addLog(`⚡ You Surge for ${Math.floor(dmg)} damage!`);
        if (isDeckDead(newEnemyDeck)) { resolveWin('player', newPlayerDeck, newEnemyDeck); setIsProcessing(false); return; }
        break;
      }
      case 'barrier': {
        newPlayerBarrier = true;
        setPlayerBarrier(true);
        spawnParticles('player', '#3b82f6');
        addLog(`🛡️ You raise a Barrier! Next hit reduced by 80%.`);
        break;
      }
      case 'combo': {
        const alive = playerDeck.filter(c => c.currentHP > 0);
        const second = alive[1] || pActive;
        let dmg = (getActiveStat(pActive, 'creativity') + getActiveStat(second, 'creativity')) * action.factor;
        if (playerSwitchBonus) { dmg *= 1.1; setPlayerSwitchBonus(false); }
        if (newEnemyBarrier) {
          dmg *= 0.2;
          newEnemyBarrier = false;
          setEnemyBarrier(false);
        }
        newEnemyDeck = applyDamageToEnemy(dmg, setEnemyDeck, enemyDeck);
        spawnParticles('enemy', '#a855f7');
        shakeSlot('enemy');
        flashScreen('#a855f740');
        spawnFloat(dmg, '#a855f7');
        addLog(`🌀 ${pActive.name} + ${second.name} Combo for ${Math.floor(dmg)} damage!`);
        if (isDeckDead(newEnemyDeck)) { resolveWin('player', newPlayerDeck, newEnemyDeck); setIsProcessing(false); return; }
        break;
      }
      case 'overdrive': {
        const sacrifice = pActive.maxHP * 0.20;
        newPlayerDeck = playerDeck.map((c, i) =>
          c.id === pActive.id ? { ...c, currentHP: Math.max(1, c.currentHP - sacrifice) } : c
        );
        setPlayerDeck(newPlayerDeck);
        let dmg = getActiveStat(pActive, 'intelligence') * action.factor;
        if (playerSwitchBonus) { dmg *= 1.1; setPlayerSwitchBonus(false); }
        if (newEnemyBarrier) {
          dmg *= 0.2;
          newEnemyBarrier = false;
          setEnemyBarrier(false);
        }
        newEnemyDeck = applyDamageToEnemy(dmg, setEnemyDeck, enemyDeck);
        spawnParticles('enemy', '#f59e0b');
        spawnParticles('player', '#ef4444');
        shakeSlot('enemy');
        flashScreen('#f59e0b40');
        spawnFloat(dmg, '#f59e0b');
        addLog(`🔥 Overdrive! Sacrificed ${Math.floor(sacrifice)} HP to deal ${Math.floor(dmg)} damage!`);
        if (isDeckDead(newEnemyDeck)) { resolveWin('player', newPlayerDeck, newEnemyDeck); setIsProcessing(false); return; }
        break;
      }
      case 'switch': {
        // Rotate alive cards: move first alive to back
        const aliveIndices = playerDeck.map((c, i) => c.currentHP > 0 ? i : -1).filter(i => i >= 0);
        if (aliveIndices.length < 2) {
          addLog('⚠️ No card to switch to!');
          setIsProcessing(false);
          return;
        }
        const rotated = [...playerDeck];
        const [first, ...rest] = aliveIndices;
        const item = rotated.splice(first, 1)[0];
        const insertAt = rest[rest.length - 1] + 1 - 1; // put at end of alive
        rotated.splice(rest[rest.length - 1], 0, item);
        newPlayerDeck = rotated;
        setPlayerDeck(rotated);
        setPlayerSwitchBonus(true);
        spawnParticles('player', '#22c55e');
        addLog(`🔄 Switched to ${getActivePlayer(rotated)?.name}! Next action +10% damage.`);
        break;
      }
    }

    setPlayerEnergy(newPlayerEnergy);

    // Brief pause before enemy turn
    await new Promise(r => setTimeout(r, 700));

    // ── enemy turn ──
    const eAction = chooseAIAction(
      newEnemyDeck.filter(c => c.currentHP > 0),
      newPlayerDeck.filter(c => c.currentHP > 0),
      newEnemyEnergy
    );
    if (!eAction) { finishTurn(newPlayerDeck, newEnemyDeck, newPlayerEnergy, newEnemyEnergy, newPlayerBarrier, newEnemyBarrier); return; }

    newEnemyEnergy = Math.max(0, newEnemyEnergy - eAction.energyCost);
    const eActiveNow = getActivePlayer(newEnemyDeck);
    const pActiveNow = getActivePlayer(newPlayerDeck);

    if (!eActiveNow || !pActiveNow) { finishTurn(newPlayerDeck, newEnemyDeck, newPlayerEnergy, newEnemyEnergy, newPlayerBarrier, newEnemyBarrier); return; }

    switch (eAction.id) {
      case 'surge': {
        let dmg = getActiveStat(eActiveNow, 'power') * eAction.factor;
        if (enemySwitchBonus) { dmg *= 1.1; setEnemySwitchBonus(false); }
        if (newPlayerBarrier) {
          dmg *= 0.2;
          newPlayerBarrier = false;
          setPlayerBarrier(false);
          addLog(`🛡️ Your barrier absorbs most of enemy's Surge!`);
        }
        newPlayerDeck = applyDamageToPlayer(dmg, setPlayerDeck, newPlayerDeck);
        spawnParticles('player', '#ef4444');
        shakeSlot('player');
        spawnFloat(-dmg, '#ef4444');
        addLog(`Enemy ⚡ Surges you for ${Math.floor(dmg)} damage!`);
        if (isDeckDead(newPlayerDeck)) { resolveWin('enemy', newPlayerDeck, newEnemyDeck); setIsProcessing(false); return; }
        break;
      }
      case 'barrier': {
        newEnemyBarrier = true;
        setEnemyBarrier(true);
        addLog(`Enemy 🛡️ raises a Barrier!`);
        break;
      }
      case 'combo': {
        const eAlive = newEnemyDeck.filter(c => c.currentHP > 0);
        const eSecond = eAlive[1] || eActiveNow;
        let dmg = (getActiveStat(eActiveNow, 'creativity') + getActiveStat(eSecond, 'creativity')) * eAction.factor;
        if (enemySwitchBonus) { dmg *= 1.1; setEnemySwitchBonus(false); }
        if (newPlayerBarrier) {
          dmg *= 0.2;
          newPlayerBarrier = false;
          setPlayerBarrier(false);
        }
        newPlayerDeck = applyDamageToPlayer(dmg, setPlayerDeck, newPlayerDeck);
        spawnParticles('player', '#a855f7');
        shakeSlot('player');
        spawnFloat(-dmg, '#a855f7');
        addLog(`Enemy 🌀 Combo for ${Math.floor(dmg)} damage!`);
        if (isDeckDead(newPlayerDeck)) { resolveWin('enemy', newPlayerDeck, newEnemyDeck); setIsProcessing(false); return; }
        break;
      }
      case 'overdrive': {
        newEnemyDeck = newEnemyDeck.map(c =>
          c.id === eActiveNow.id ? { ...c, currentHP: Math.max(1, c.currentHP - eActiveNow.maxHP * 0.2) } : c
        );
        setEnemyDeck(newEnemyDeck);
        let dmg = getActiveStat(eActiveNow, 'intelligence') * eAction.factor;
        if (enemySwitchBonus) { dmg *= 1.1; setEnemySwitchBonus(false); }
        if (newPlayerBarrier) {
          dmg *= 0.2;
          newPlayerBarrier = false;
          setPlayerBarrier(false);
        }
        newPlayerDeck = applyDamageToPlayer(dmg, setPlayerDeck, newPlayerDeck);
        spawnParticles('player', '#f59e0b');
        shakeSlot('player');
        spawnFloat(-dmg, '#f59e0b');
        addLog(`Enemy 🔥 Overdrive for ${Math.floor(dmg)} damage!`);
        if (isDeckDead(newPlayerDeck)) { resolveWin('enemy', newPlayerDeck, newEnemyDeck); setIsProcessing(false); return; }
        break;
      }
      case 'switch': {
        const eAliveIdx = newEnemyDeck.map((c, i) => c.currentHP > 0 ? i : -1).filter(i => i >= 0);
        if (eAliveIdx.length >= 2) {
          const rotated = [...newEnemyDeck];
          const item = rotated.splice(eAliveIdx[0], 1)[0];
          rotated.splice(eAliveIdx[eAliveIdx.length - 1], 0, item);
          newEnemyDeck = rotated;
          setEnemyDeck(rotated);
          setEnemySwitchBonus(true);
          addLog(`Enemy 🔄 switches cards!`);
        }
        break;
      }
    }

    finishTurn(newPlayerDeck, newEnemyDeck, newPlayerEnergy, newEnemyEnergy, newPlayerBarrier, newEnemyBarrier);
  };

  const finishTurn = (pDeck, eDeck, pEnergy, eEnergy, pBarrier, eBarrier) => {
    setTurnCount(prev => prev + 1);
    // Energy regen
    const geminiFlux = activeSynergyIds.includes('GEMINI_FLUX');
    const regenRate = geminiFlux ? 37 : 25;
    setPlayerEnergy(Math.min(100, pEnergy + regenRate));
    setEnemyEnergy(Math.min(100, eEnergy + 25));
    setPlayerBarrier(pBarrier);
    setEnemyBarrier(eBarrier);
    setPendingAction(null);
    setIsProcessing(false);
  };

  const resolveWin = (side, pDeck, eDeck) => {
    setWinner(side);
    const earned = side === 'player' ? Math.max(400, 3090 - turnCount * 90) : 75;
    setReward(earned);
    if (side === 'player') recordBattle('win');
    else recordBattle('loss');
    addLog(side === 'player' ? `🏆 Victory! You earned ${earned} credits!` : `💀 Defeat! Consolation: ${earned} credits.`);
    setPhase('result');
    flashScreen(side === 'player' ? '#22c55e60' : '#ef444460');
  };

  const handleComplete = () => {
    onXpGain(winner === 'player' ? 120 : 15);
    onComplete(reward);
    onBack();
  };

  const glowForProvider = (provider) => {
    const colors = { CLAUDE: '#d97706', GPT: '#10b981', GEMINI: '#3b82f6', LLAMA: '#8b5cf6', MISTRAL: '#ec4899', DEEPSEEK: '#6366f1' };
    return colors[provider] || '#9ca3af';
  };

  // ── ACTION BUTTON ──
  const ActionBtn = ({ action }) => {
    const canAfford = playerEnergy >= action.energyCost;
    const dis = !canAfford || isProcessing || !!winner;
    return (
      <motion.button
        whileHover={{ scale: dis ? 1 : 1.04 }}
        whileTap={{ scale: dis ? 1 : 0.95 }}
        onClick={() => performAction(action)}
        disabled={dis}
        className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[72px] ${
          pendingAction?.id === action.id
            ? 'border-white bg-white/10'
            : dis
            ? 'border-gray-700 bg-gray-800/60 text-gray-600 cursor-not-allowed'
            : 'border-gray-600 bg-gray-800/80 hover:border-gray-400 text-white'
        }`}
      >
        <span className="text-xl mb-0.5">{action.icon}</span>
        <span className="text-xs font-bold">{action.name}</span>
        <span className={`text-xs mt-0.5 ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>{action.energyCost}⚡</span>
      </motion.button>
    );
  };

  // ─────────────────────────────────────────────────
  //  BUILD PHASE
  // ─────────────────────────────────────────────────
  if (phase === 'build') {
    return (
      <div className="min-h-screen p-6">
        <header className="max-w-4xl mx-auto flex items-center justify-between mb-6">
          <motion.button
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" /> Back
          </motion.button>
          <motion.h1
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent"
          >
            ⚔️ Deck Builder
          </motion.h1>
          <div className="w-24" />
        </header>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card pool */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-bold text-gray-200">
                Select Cards <span className="text-gray-400 text-sm">({playerDeckSelection.length}/{MAX_DECK})</span>
              </h2>
              {/* Filter / sort controls */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <select
                    value={filterProvider}
                    onChange={e => setFilterProvider(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none"
                  >
                    <option value="ALL">All Providers</option>
                    {['CLAUDE','GPT','GEMINI','LLAMA','MISTRAL','DEEPSEEK'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select
                    value={filterRarity}
                    onChange={e => setFilterRarity(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none"
                  >
                    <option value="ALL">All Rarities</option>
                    {['COMMON','RARE','EPIC','LEGENDARY','MYTHIC'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <SortAsc className="w-3 h-3 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="name">Name</option>
                    <option value="rarity">Rarity</option>
                    <option value="stats">Stats</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {filteredSortedCollection.map(card => {
                const selected = !!playerDeckSelection.find(c => c.id === card.id);
                const sameBaseInDeck = !selected && !!playerDeckSelection.find(c => c.baseId === card.baseId);
                const deckFull = !selected && playerDeckSelection.length >= MAX_DECK;
                const disabled = sameBaseInDeck || deckFull;
                const glow = glowForProvider(card.provider);
                return (
                  <motion.div
                    key={card.id}
                    whileHover={!disabled ? { scale: 1.03 } : {}}
                    whileTap={!disabled ? { scale: 0.97 } : {}}
                    onClick={() => !disabled && toggleCardInDeck(card)}
                    title={sameBaseInDeck ? 'Only one card per model allowed' : undefined}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-green-500 bg-green-900/20 cursor-pointer'
                        : sameBaseInDeck
                          ? 'border-gray-700 bg-gray-900/40 opacity-40 cursor-not-allowed'
                          : disabled
                            ? 'border-gray-700 bg-gray-900/40 opacity-50 cursor-not-allowed'
                            : 'border-gray-700 bg-gray-900/60 hover:border-gray-500 cursor-pointer'
                    }`}
                    style={selected ? { boxShadow: `0 0 12px ${glow}50` } : {}}
                  >
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">✓</span>
                      </div>
                    )}
                    {sameBaseInDeck && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center" title="Duplicate model">
                        <span className="text-xs text-gray-400 font-bold">✕</span>
                      </div>
                    )}
                    <div className="text-3xl mb-1">{card.providerInfo.icon}</div>
                    <div className="font-bold text-sm truncate">{card.name}</div>
                    <div className="text-xs text-gray-400">{card.rarity}</div>
                    <div className="mt-1 grid grid-cols-2 gap-0.5 text-xs text-gray-500">
                      <span>💥 {card.stats.power}</span>
                      <span>⚡ {card.stats.speed}</span>
                      <span>🧠 {card.stats.intelligence}</span>
                      <span>✨ {card.stats.creativity}</span>
                    </div>
                  </motion.div>
                );
              })}
              {filteredSortedCollection.length === 0 && (
                <div className="col-span-3 text-center text-gray-500 py-12">
                  {collection.length === 0 ? 'Open some packs first to get cards!' : 'No cards match the current filters.'}
                </div>
              )}
            </div>
          </div>

          {/* Deck & Synergies sidebar */}
          <div className="space-y-4">
            {/* Selected deck */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700">
              <h3 className="font-bold mb-3 text-gray-200 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Your Deck
              </h3>
              <div className="space-y-2 min-h-[120px]">
                {playerDeckSelection.map((card, i) => (
                  <div key={card.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{card.providerInfo.icon}</span>
                      <div>
                        <div className="text-sm font-bold">{card.name}</div>
                        <div className="text-xs text-gray-400">{card.rarity}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCardInDeck(card)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {playerDeckSelection.length === 0 && (
                  <div className="text-gray-600 text-sm text-center py-4">Click cards to add</div>
                )}
              </div>
            </div>

            {/* Active synergies */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700">
              <h3 className="font-bold mb-3 text-gray-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" /> Active Synergies
              </h3>
              {currentSynergies.length > 0 ? (
                <div className="space-y-2">
                  {currentSynergies.map(s => (
                    <motion.div
                      key={s.id}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="p-2 rounded-lg text-sm"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}40` }}
                    >
                      <div className="font-bold" style={{ color: s.color }}>{s.icon} {s.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600 text-xs">
                  Mix providers to activate synergies!
                </div>
              )}

              {/* All synergy hints */}
              <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-1">
                <div className="text-xs text-gray-500 font-semibold mb-1">Possible synergies:</div>
                {Object.values(SYNERGIES).map(s => {
                  const active = currentSynergies.find(cs => cs.id === s.id);
                  return (
                    <div key={s.id} className={`text-xs flex items-start gap-1 ${active ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span>{s.icon}</span>
                      <span className={active ? 'font-semibold' : ''}>{s.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deck Presets */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" /> Deck Presets
                </h3>
                <button
                  onClick={() => setShowPresets(p => !p)}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {showPresets ? 'Hide' : `Show (${presets.length})`}
                </button>
              </div>

              {/* Save current deck */}
              {playerDeckSelection.length >= 2 && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={presetName}
                    onChange={e => setPresetName(e.target.value)}
                    placeholder="Preset name…"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500"
                    onKeyDown={e => e.key === 'Enter' && savePreset()}
                  />
                  <button
                    onClick={savePreset}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              )}

              {/* Preset list */}
              <AnimatePresence>
                {showPresets && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {presets.length === 0 && (
                      <div className="text-xs text-gray-600 text-center py-2">No saved presets yet</div>
                    )}
                    {presets.map((preset, idx) => {
                      // Count how many cards are still in collection
                      const available = preset.ids.filter(id => collection.find(c => c.id === id)).length;
                      return (
                        <div key={preset.createdAt} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                          <div>
                            <div className="text-sm font-bold">{preset.name}</div>
                            <div className="text-xs text-gray-500">{available}/{preset.ids.length} cards available</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => loadPreset(preset)}
                              disabled={available < 2}
                              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                                available >= 2
                                  ? 'bg-purple-700 hover:bg-purple-600 text-white'
                                  : 'bg-gray-700 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deletePreset(idx)}
                              className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={startBattle}
              disabled={playerDeckSelection.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                playerDeckSelection.length >= 2
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-900/40'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {playerDeckSelection.length < 2 ? `Need ${2 - playerDeckSelection.length} more card(s)` : '⚔️ Battle!'}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  //  REVEAL PHASE
  // ─────────────────────────────────────────────────
  if (phase === 'reveal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 p-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-7xl"
          >⚔️</motion.div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            DECK BATTLE!
          </h2>
          <div className="flex justify-center gap-4 flex-wrap">
            {getActiveSynergies(playerDeckSelection).map(s => (
              <SynergyBadge key={s.id} synergy={s} />
            ))}
          </div>
          <p className="text-gray-400">Synergies activating…</p>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  //  BATTLE PHASE
  // ─────────────────────────────────────────────────
  const pActive = getActivePlayer(playerDeck);
  const eActive = getActivePlayer(enemyDeck);

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      {/* Screen flash */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{ background: screenFlash }}
          />
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="fixed pointer-events-none z-30" style={{ left: p.x, top: p.y }}>
          <ParticleBurst x={0} y={0} color={p.color} />
        </div>
      ))}

      {/* Header */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-4">
        <motion.button
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          onClick={() => {
            if (confirm('Abandon battle? Progress will be lost.')) onBack();
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Quit
        </motion.button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">⚔️ Deck Battle</h1>
          <div className="text-xs text-gray-400">Turn {turnCount}</div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end max-w-[140px]">
          {activeSynergyIds.map(id => {
            const s = SYNERGIES[id];
            return s ? (
              <span key={id} className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${s.color}25`, color: s.color }}>
                {s.icon}
              </span>
            ) : null;
          })}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Enemy deck row */}
        <motion.div
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-gray-900/70 backdrop-blur rounded-2xl p-4 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-red-400 flex items-center gap-1">
              <Skull className="w-4 h-4" /> Enemy Deck
              {enemyBarrier && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="ml-2 text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/40"
                >🛡️ Barrier</motion.span>
              )}
            </div>
            <div className="text-xs text-gray-400">{enemyDeck.filter(c => c.currentHP > 0).length}/{enemyDeck.length} alive</div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {enemyDeck.map((card, i) => {
              const isActive = eActive?.id === card.id;
              return (
                <CardSlot
                  key={card.id}
                  card={card}
                  isActive={isActive}
                  isShaking={shakingSlot === 'enemy' && isActive}
                  glowColor={glowForProvider(card.provider)}
                  faceDown={revealedEnemyIdx === null ? false : i !== revealedEnemyIdx && i !== 0}
                />
              );
            })}
          </div>
          {/* Enemy energy */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Enemy Energy</span><span>{Math.ceil(enemyEnergy)}/100⚡</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                animate={{ width: `${enemyEnergy}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </motion.div>

        {/* VS center strip */}
        <div className="flex items-center justify-center gap-8 py-1 relative">
          <div className="text-center relative">
            {pActive && (
              <div className="text-4xl" style={{ filter: `drop-shadow(0 0 12px ${glowForProvider(pActive.provider)})` }}>
                {pActive.providerInfo.icon}
              </div>
            )}
            {/* Floating numbers */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <AnimatePresence>
                {floatingNums.map(fn => (
                  fn.value < 0
                    ? <FloatingNumber key={fn.id} value={Math.abs(fn.value)} color={fn.color} onDone={() => setFloatingNums(p => p.filter(x => x.id !== fn.id))} />
                    : null
                ))}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
          >⚔️</motion.div>

          <div className="text-center relative">
            {eActive && (
              <div className="text-4xl" style={{ filter: `drop-shadow(0 0 12px ${glowForProvider(eActive.provider)})` }}>
                {eActive.providerInfo.icon}
              </div>
            )}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <AnimatePresence>
                {floatingNums.map(fn => (
                  fn.value > 0
                    ? <FloatingNumber key={fn.id} value={fn.value} color={fn.color} onDone={() => setFloatingNums(p => p.filter(x => x.id !== fn.id))} />
                    : null
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Player deck row */}
        <motion.div
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-gray-900/70 backdrop-blur rounded-2xl p-4 border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-green-400 flex items-center gap-1">
              <Star className="w-4 h-4" /> Your Deck
              {playerBarrier && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="ml-2 text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/40"
                >🛡️ Barrier</motion.span>
              )}
              {playerSwitchBonus && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="ml-1 text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full border border-green-500/40"
                >+10% DMG</motion.span>
              )}
            </div>
            <div className="text-xs text-gray-400">{playerDeck.filter(c => c.currentHP > 0).length}/{playerDeck.length} alive</div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {playerDeck.map((card) => {
              const isActive = pActive?.id === card.id;
              return (
                <CardSlot
                  key={card.id}
                  card={card}
                  isActive={isActive}
                  isShaking={shakingSlot === 'player' && isActive}
                  glowColor={glowForProvider(card.provider)}
                />
              );
            })}
          </div>
          {/* Player energy */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Your Energy</span><span>{Math.ceil(playerEnergy)}/100⚡</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${playerEnergy > 50 ? 'bg-green-500' : playerEnergy > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                animate={{ width: `${playerEnergy}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {Object.values(DECK_ACTIONS).map(action => (
              <ActionBtn key={action.id} action={action} />
            ))}
          </div>

          {/* Active card info */}
          {pActive && (
            <motion.div
              key={pActive.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2 rounded-xl bg-gray-800/50 border border-gray-700/40 flex items-center gap-3 text-sm"
            >
              <span className="text-2xl">{pActive.providerInfo.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{pActive.name}</div>
                <div className="text-xs text-gray-400 flex gap-2 flex-wrap">
                  <span>💥 {pActive.stats.power}</span>
                  <span>⚡ {pActive.stats.speed}</span>
                  <span>🧠 {pActive.stats.intelligence}</span>
                  <span>✨ {pActive.stats.creativity}</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">ACTIVE</div>
            </motion.div>
          )}
        </motion.div>

        {/* Battle Log */}
        <div
          ref={logRef}
          className="bg-gray-900/60 backdrop-blur rounded-2xl p-4 border border-gray-700/50 max-h-36 overflow-y-auto space-y-1"
        >
          {battleLog.map((log, i) => (
            <motion.div
              key={i}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-sm text-gray-300"
            >
              {log}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {phase === 'result' && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-700 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-7xl"
              >
                {winner === 'player' ? '🏆' : '💀'}
              </motion.div>
              <h2 className={`text-4xl font-black ${winner === 'player' ? 'text-green-400' : 'text-red-400'}`}>
                {winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
              </h2>

              {winner === 'player' && activeSynergyIds.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  {activeSynergyIds.map(id => {
                    const s = SYNERGIES[id];
                    return s ? <SynergyBadge key={id} synergy={s} /> : null;
                  })}
                </div>
              )}

              <div className="bg-gray-800/50 rounded-2xl p-4 space-y-2">
                <div className="text-sm text-gray-400">Reward</div>
                <div className="text-4xl font-black text-yellow-400">+{reward} credits</div>
                <div className="text-xs text-gray-500">Survived {turnCount} turns</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPhase('build'); setPlayerDeckSelection([]); }}
                  className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Play Again
                </button>
                <button
                  onClick={handleComplete}
                  className="py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" /> Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

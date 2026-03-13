import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, Shield, Eye, Wind, Zap, Star, ChevronRight, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { CARD_POOL, RARITIES, MOVES, calculateHP, PROVIDERS, getTypeMultiplier, getTypeMatchupText } from '../data/cards';

// ─── Constants ──────────────────────────────────────────────────────────────
const RARITY_ORDER = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5 };
const DIFFICULTY_TIERS = [
  { id: 'easy',   label: 'Rookie',      color: '#22c55e', aiIntelligence: 0.3,  rewardMult: 1.0, xpMult: 1.0, description: 'AI plays randomly. Good for learning.' },
  { id: 'normal', label: 'Veteran',     color: '#3b82f6', aiIntelligence: 0.6,  rewardMult: 1.5, xpMult: 1.5, description: 'AI makes smart decisions. Standard challenge.' },
  { id: 'hard',   label: 'Champion',    color: '#f59e0b', aiIntelligence: 0.85, rewardMult: 2.5, xpMult: 2.5, description: 'AI plays near-optimally. High risk, high reward.' },
  { id: 'expert', label: 'Grandmaster', color: '#ef4444', aiIntelligence: 1.0,  rewardMult: 4.0, xpMult: 4.0, description: 'Perfect AI. Only the best cards survive.' },
];

const MOVE_META = {
  strike: { icon: Swords, color: 'from-red-600 to-orange-500',    label: 'Strike', hint: 'High dmg · 40⚡' },
  block:  { icon: Shield, color: 'from-blue-600 to-cyan-500',     label: 'Block',  hint: 'Dmg -70% + counters Strike · 15⚡' },
  focus:  { icon: Eye,    color: 'from-violet-600 to-purple-500', label: 'Focus',  hint: '+2 stacks (+20% each) · 20⚡' },
  blitz:  { icon: Wind,   color: 'from-yellow-500 to-amber-400',  label: 'Blitz',  hint: 'Pierces Block completely · 35⚡' },
};

function buildOpponent(playerCard, difficulty) {
  const playerRarityVal = RARITY_ORDER[playerCard.rarity] || 1;
  let allowedVals;
  if (difficulty.id === 'easy')   allowedVals = [1, 2];
  else if (difficulty.id === 'normal') allowedVals = [Math.max(1,playerRarityVal-1), playerRarityVal, playerRarityVal+1];
  else if (difficulty.id === 'hard')  allowedVals = [playerRarityVal, playerRarityVal+1];
  else allowedVals = [playerRarityVal+1, playerRarityVal+2, playerRarityVal];

  const eligible = CARD_POOL.filter(c => c.id !== playerCard.id && allowedVals.some(v => RARITY_ORDER[c.rarity] === v));
  const pool = eligible.length > 0 ? eligible : CARD_POOL.filter(c => c.id !== playerCard.id);
  const base = pool[Math.floor(Math.random() * pool.length)];
  return { ...base, id: `opp-${base.id}` };
}

function StatBar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-700/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, (value / max) * 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="w-10 text-right text-xs font-bold text-white">{Math.ceil(value)}</span>
    </div>
  );
}

function FighterPanel({ card, hp, maxHp, energy, buffs, focusStacks, isPlayer, typeMatchup, selectedMove, waiting }) {
  const color = PROVIDERS[card.provider]?.color || '#6b7280';
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur relative overflow-hidden ${isPlayer ? 'border-blue-500/40 bg-blue-950/30' : 'border-red-500/40 bg-red-950/30'}`}>
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at ${isPlayer ? 'bottom right' : 'top left'}, ${color}, transparent 70%)` }} />
      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: `${color}22`, border: `2px solid ${color}44` }}>
            {card.providerInfo?.icon || card.provider}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{card.name}</div>
            <div className="text-xs text-gray-400">{card.rarity} · v{card.version}</div>
            {typeMatchup && (
              <div className="mt-1 text-xs font-bold" style={{ color: typeMatchup.color }}>
                {typeMatchup.emoji} {typeMatchup.label}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-black" style={{ color: hpColor }}>{Math.ceil(hp)}</div>
            <div className="text-xs text-gray-500">/ {maxHp} HP</div>
          </div>
        </div>
        <StatBar label="HP" value={hp} max={maxHp} color={hpColor} />
        <div className="mt-1"><StatBar label="⚡ Energy" value={energy} max={100} color="#f59e0b" /></div>
        <div className="flex flex-wrap gap-1 mt-2 min-h-[20px]">
          {focusStacks > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-900/60 text-purple-300 border border-purple-600/40">
              🔮 Focus ×{focusStacks} (+{focusStacks * 20}% Strike)
            </span>
          )}
          {buffs?.power > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-red-900/60 text-red-300">💥 +{Math.round(buffs.power * 100)}% Atk</span>}
          {buffs?.speed > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-900/60 text-cyan-300">⚡ +{Math.round(buffs.speed * 100)}% Spd</span>}
        </div>
        {(selectedMove || waiting) && (
          <div className="mt-2 text-xs font-bold text-center py-1 rounded-lg bg-black/30">
            {selectedMove ? `▶ ${selectedMove.toUpperCase()}` : '⌛ Thinking…'}
          </div>
        )}
      </div>
    </div>
  );
}

export function GameMode({ user, currency, onComplete, onBack, onXpGain = () => {} }) {
  const [phase, setPhase] = useState('pick-card');
  const [collection, setCollection] = useState([]);
  const [playerCard, setPlayerCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_TIERS[1]);

  // Battle state — use refs for values needed inside closures
  const [playerHp, setPlayerHp]         = useState(0);
  const [opponentHp, setOpponentHp]     = useState(0);
  const [maxPlayerHp, setMaxPlayerHp]   = useState(0);
  const [maxOpponentHp, setMaxOpponentHp] = useState(0);
  const [playerEnergy, setPlayerEnergy]     = useState(100);
  const [opponentEnergy, setOpponentEnergy] = useState(100);
  const [playerFocus, setPlayerFocus]   = useState(0);
  const [opponentFocus, setOpponentFocus] = useState(0);
  const [playerBuffs, setPlayerBuffs]   = useState({});
  const [opponentBuffs, setOpponentBuffs] = useState({});
  const [playerMove, setPlayerMove]     = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);
  const [turn, setTurn]                 = useState(0);
  const maxTurns = 20;
  const [log, setLog]         = useState([]);
  const [winner, setWinner]   = useState(null);
  const [reward, setReward]   = useState(0);
  const [floats, setFloats]   = useState([]);
  const [shakeSide, setShakeSide]   = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [mistralCooldowns, setMistralCooldowns] = useState({});
  const logRef = useRef(null);

  // Refs to expose latest state inside closures without captures
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = {
      playerHp, opponentHp, playerEnergy, opponentEnergy,
      playerFocus, opponentFocus, playerBuffs, opponentBuffs,
      mistralCooldowns, turn, playerCard, opponentCard, difficulty,
    };
  });

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

  function addLogs(...msgs) {
    setLog(prev => [...prev, ...msgs.filter(Boolean)]);
  }

  function spawnFloat(value, side) {
    const id = Date.now() + Math.random();
    setFloats(prev => [...prev, { id, value, side }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1200);
  }

  function shakeCard(side) {
    setShakeSide(side);
    setTimeout(() => setShakeSide(null), 420);
  }

  function startBattle() {
    if (!playerCard) return;
    const opp = buildOpponent(playerCard, difficulty);
    setOpponentCard(opp);
    const pHp = calculateHP(playerCard);
    const oHp = calculateHP(opp);
    setPlayerHp(pHp); setMaxPlayerHp(pHp);
    setOpponentHp(oHp); setMaxOpponentHp(oHp);
    setPlayerEnergy(100); setOpponentEnergy(100);
    setPlayerFocus(0); setOpponentFocus(0);
    setPlayerBuffs({}); setOpponentBuffs({});
    setPlayerMove(null); setOpponentMove(null);
    setWinner(null); setReward(0);
    setTurn(0); setFloats([]); setMistralCooldowns({});
    const mult = getTypeMatchupText(playerCard.provider, opp.provider);
    const dmgPct = Math.round(getTypeMultiplier(playerCard.provider, opp.provider) * 100);
    setLog([
      `⚔️  ${playerCard.name} VS ${opp.name}  [${difficulty.label}]`,
      `${mult.emoji} Type matchup: ${mult.label} — your attacks deal ${dmgPct}% damage`,
    ]);
    setPhase('battle');
  }

  function calcDamage(attacker, defender, mv, aBuffs, aFocus) {
    const moveData = Object.values(MOVES).find(m => m.id === mv);
    if (!moveData || moveData.damageFactor === 0) return 0;

    let stat = attacker.stats?.[moveData.stat] ?? 80;
    const buffMult = 1 + ((aBuffs[moveData.stat] || 0) + (aBuffs.analyticalBonus || 0));
    stat *= buffMult;

    // Gemini: use best stat for all moves
    if (attacker.provider === 'GEMINI') {
      const best = Math.max(...Object.values(attacker.stats));
      stat = best * buffMult;
    }

    let dmg = stat * moveData.damageFactor;

    // Focus stacks: +20% per stack on Strike
    if (mv === 'strike' && aFocus > 0) dmg *= (1 + aFocus * 0.2);

    // Type effectiveness
    dmg *= getTypeMultiplier(attacker.provider, defender.provider);

    // Defense mitigation (penetrated partially by blitz)
    const defPen = moveData.defensePenetration || 0;
    const defStat = ((defender.stats?.speed || 80) + (defender.stats?.intelligence || 80)) / 2;
    const defense = (defStat / 200) * (1 - defPen);
    dmg = dmg * (1 - defense);

    return Math.max(4, Math.floor(dmg));
  }

  function pickAiMove(oCard, oEnergy, oFocus, oBuffs, cooldowns) {
    const intel = difficulty.aiIntelligence;
    const available = Object.values(MOVES)
      .filter(m => oEnergy >= m.energyCost && !cooldowns[m.id])
      .map(m => m.id);
    if (available.length === 0) return 'block';
    if (Math.random() > intel) return available[Math.floor(Math.random() * available.length)];
    const s = stateRef.current;
    const oPct = s.opponentHp / calculateHP(oCard);
    const scores = {};
    for (const mv of available) {
      let score = 1;
      if (mv === 'strike') { score += 2; if (oFocus > 0) score += 2; if (oPct < 0.4) score += 3; }
      if (mv === 'block')  { score += (oPct < 0.3 ? 3 : -0.5); }
      if (mv === 'focus')  { score += (oFocus < 3 && oPct > 0.5 ? 1.5 : -1); }
      if (mv === 'blitz')  { score += 1 + (oPct < 0.6 ? 1 : 0); }
      scores[mv] = Math.max(0.1, score + Math.random() * 0.5);
    }
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Central resolve — reads all state from stateRef to avoid stale closures
  function resolveTurn(pMove, oMove) {
    const s = stateRef.current;
    let pHp = s.playerHp, oHp = s.opponentHp;
    let pEn = s.playerEnergy, oEn = s.opponentEnergy;
    let pFocus = s.playerFocus, oFocus = s.opponentFocus;
    let pBuf = { ...s.playerBuffs }, oBuf = { ...s.opponentBuffs };
    const pCard = s.playerCard, oCard = s.opponentCard;
    const newTurn = s.turn + 1;
    const cooldowns = { ...s.mistralCooldowns };
    Object.keys(cooldowns).forEach(k => { if (--cooldowns[k] <= 0) delete cooldowns[k]; });

    const msgs = [`Turn ${newTurn}: You → ${pMove.toUpperCase()} | AI → ${oMove.toUpperCase()}`];

    let pDmg = (pMove !== 'block' && pMove !== 'focus') ? calcDamage(pCard, oCard, pMove, pBuf, pFocus) : 0;
    let oDmg = (oMove !== 'block' && oMove !== 'focus') ? calcDamage(oCard, pCard, oMove, oBuf, oFocus) : 0;

    // Type matchup annotation
    if (pDmg > 0) {
      const mult = getTypeMultiplier(pCard.provider, oCard.provider);
      if (mult >= 1.25) msgs.push('🔥 Super Effective!');
      else if (mult <= 0.76) msgs.push('❌ Not Very Effective…');
    }

    // Block mechanics: reduces incoming by 70%, counters Strike with 40% reflect, but Blitz ignores Block entirely
    if (pMove === 'block') {
      if (oMove === 'blitz') {
        msgs.push('🌀 Blitz tears through your Block! Full damage!');
      } else {
        const rawODmg = oDmg;
        oDmg = Math.floor(oDmg * 0.3);
        if (oMove === 'strike' && rawODmg > 0) {
          const counter = Math.floor(rawODmg * 0.40);
          oHp = Math.max(0, oHp - counter);
          msgs.push(`🛡️ Block! You take ${oDmg} and counter for ${counter}!`);
        } else {
          msgs.push('🛡️ You braced!');
        }
      }
    }
    if (oMove === 'block') {
      if (pMove === 'blitz') {
        msgs.push(`🌀 Your Blitz pierces ${oCard.name}'s Block!`);
      } else {
        const rawPDmg = pDmg;
        pDmg = Math.floor(pDmg * 0.3);
        if (pMove === 'strike' && rawPDmg > 0) {
          const counter = Math.floor(rawPDmg * 0.40);
          pHp = Math.max(0, pHp - counter);
          msgs.push(`🛡️ ${oCard.name} counters your Strike for ${counter} back at you!`);
        } else {
          msgs.push(`🛡️ ${oCard.name} blocked!`);
        }
      }
    }

    // DeepSeek prediction
    if (pCard.provider === 'DEEPSEEK' && Math.random() < 0.25 && (oMove === 'strike' || oMove === 'blitz')) {
      pDmg = Math.floor(pDmg * 1.2); msgs.push('🔮 DeepSeek precognition! +20% counter');
    }
    if (oCard.provider === 'DEEPSEEK' && Math.random() < 0.25 && (pMove === 'strike' || pMove === 'blitz')) {
      oDmg = Math.floor(oDmg * 1.2); msgs.push('🔮 Opponent predicted your move!');
    }

    // Claude analytical bonus on Focus
    if (pCard.provider === 'CLAUDE' && pMove === 'focus' && Math.random() < 0.3) {
      pBuf = { ...pBuf, analyticalBonus: (pBuf.analyticalBonus || 0) + 0.2 };
      msgs.push('🧠 Analytical Precision activated! Next strike +20%');
    }
    if (oCard.provider === 'CLAUDE' && oMove === 'focus' && Math.random() < 0.3) {
      oBuf = { ...oBuf, analyticalBonus: (oBuf.analyticalBonus || 0) + 0.2 };
    }
    // Consume analytical bonus on strike
    if (pMove === 'strike' && pBuf.analyticalBonus) { pDmg = Math.floor(pDmg * (1 + pBuf.analyticalBonus)); delete pBuf.analyticalBonus; }
    if (oMove === 'strike' && oBuf.analyticalBonus) { oDmg = Math.floor(oDmg * (1 + oBuf.analyticalBonus)); delete oBuf.analyticalBonus; }

    // Focus stack management
    if (pMove === 'focus') { pFocus = Math.min(4, pFocus + 2); msgs.push(`🔮 Focus ×${pFocus} charged! (+${pFocus * 20}% next Strike)`); }
    else if (pMove === 'strike') pFocus = 0;
    if (oMove === 'focus') oFocus = Math.min(4, oFocus + 2);
    else if (oMove === 'strike') oFocus = 0;

    // Mistral cooldowns (non-block moves go on 1-turn lockout)
    if (pCard.provider === 'MISTRAL' && pMove !== 'block') cooldowns[pMove] = 1;
    if (oCard.provider === 'MISTRAL' && oMove !== 'block') cooldowns[oMove] = 1;

    // Apply HP
    oHp = Math.max(0, oHp - pDmg);
    pHp = Math.max(0, pHp - oDmg);
    if (pDmg > 0) { msgs.push(`💥 You dealt ${pDmg} dmg`); spawnFloat(pDmg, 'opponent'); shakeCard('opponent'); }
    if (oDmg > 0) { msgs.push(`💢 You took ${oDmg} dmg`); spawnFloat(oDmg, 'player'); shakeCard('player'); }
    msgs.push(`❤️ You: ${Math.ceil(pHp)} | ${oCard.name}: ${Math.ceil(oHp)}`);

    // GPT adaptive buff every 3 turns
    if (newTurn % 3 === 0) {
      const stats = ['power','speed','intelligence','creativity'];
      const st = stats[Math.floor(Math.random() * stats.length)];
      if (pCard.provider === 'GPT') { pBuf = { ...pBuf, [st]: (pBuf[st]||0) + 0.1 }; msgs.push(`🧠 GPT learns! +10% ${st}`); }
      if (oCard.provider === 'GPT') { oBuf = { ...oBuf, [st]: (oBuf[st]||0) + 0.1 }; }
    }

    // Llama versatile swap at turn 2
    if (newTurn === 2) {
      if (pCard.provider === 'LLAMA' && !pBuf.llamaSwapped) {
        pBuf = { ...pBuf, power: (pBuf.power||0) + 0.15, llamaSwapped: true };
        msgs.push('🦙 Llama Versatile Tactician: Power +15%!');
      }
      if (oCard.provider === 'LLAMA' && !oBuf.llamaSwapped) {
        oBuf = { ...oBuf, power: (oBuf.power||0) + 0.15, llamaSwapped: true };
      }
    }

    // Energy regen
    const pMoveData = Object.values(MOVES).find(m => m.id === pMove);
    const oMoveData = Object.values(MOVES).find(m => m.id === oMove);
    pEn = Math.min(100, pEn - (pMoveData?.energyCost || 0) + 30);
    oEn = Math.min(100, oEn - (oMoveData?.energyCost || 0) + 30);

    // Win check
    let win = null;
    if (oHp <= 0 && pHp <= 0) win = 'draw';
    else if (oHp <= 0) win = 'player';
    else if (pHp <= 0) win = 'opponent';
    else if (newTurn >= maxTurns) win = pHp > oHp ? 'player' : pHp < oHp ? 'opponent' : 'draw';

    // Batch all state updates
    setTurn(newTurn);
    setPlayerHp(pHp); setOpponentHp(oHp);
    setPlayerEnergy(Math.max(0, pEn)); setOpponentEnergy(Math.max(0, oEn));
    setPlayerFocus(pFocus); setOpponentFocus(oFocus);
    setPlayerBuffs(pBuf); setOpponentBuffs(oBuf);
    setMistralCooldowns(cooldowns);
    setPlayerMove(null); setOpponentMove(null);
    setAiThinking(false);
    addLogs(...msgs);

    if (win) {
      setWinner(win);
      const base = win === 'player' ? 150 + newTurn * 30 : win === 'draw' ? 60 : 30;
      const earned = Math.floor(base * difficulty.rewardMult);
      setReward(earned);
    }
  }

  function handlePlayerMove(mv) {
    if (playerMove || winner) return;
    const moveData = Object.values(MOVES).find(m => m.id === mv);
    if (!moveData || playerEnergy < moveData.energyCost) return;
    setPlayerMove(mv);
  }

  // AI responds after player picks
  useEffect(() => {
    if (!playerMove || opponentMove || !opponentCard || phase !== 'battle' || winner) return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const s = stateRef.current;
      const mv = pickAiMove(s.opponentCard, s.opponentEnergy, s.opponentFocus, s.opponentBuffs, s.mistralCooldowns);
      setOpponentMove(mv);
    }, 600 + Math.random() * 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerMove]);

  // Both moves set → resolve
  useEffect(() => {
    if (playerMove && opponentMove) {
      const t = setTimeout(() => resolveTurn(playerMove, opponentMove), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerMove, opponentMove]);

  const typeMatchupPlayer   = playerCard && opponentCard ? getTypeMatchupText(playerCard.provider,   opponentCard.provider) : null;
  const typeMatchupOpponent = playerCard && opponentCard ? getTypeMatchupText(opponentCard.provider, playerCard.provider)   : null;

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ x: -3 }}
          onClick={() => {
            if (phase === 'battle' && !winner && !window.confirm('Abandon battle?')) return;
            onBack();
          }}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </motion.button>
        <h1 className="text-xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          ⚔️ 1v1 Battle
        </h1>
        <div className="w-16" />
      </header>

      {/* ── PICK CARD ─────────────────────────────────────────────────── */}
      {phase === 'pick-card' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-gray-400 mb-4">Choose your fighter:</p>
          {collection.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">📭</div>
              <div>Open some packs first to get cards!</div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {collection.map(card => {
              const selected = playerCard?.id === card.id;
              const clr = PROVIDERS[card.provider]?.color || '#6b7280';
              return (
                <motion.div
                  key={card.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPlayerCard(card)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-colors ${selected ? 'border-blue-400 bg-blue-950/50' : 'border-gray-700/60 bg-gray-900/50 hover:border-gray-500'}`}
                  style={selected ? { boxShadow: `0 0 20px ${clr}40` } : {}}
                >
                  <div className="text-3xl mb-2">{card.providerInfo?.icon || '🤖'}</div>
                  <div className="font-bold text-sm truncate">{card.name}</div>
                  <div className="text-xs text-gray-400">{card.rarity}</div>
                  <div className="text-xs mt-0.5" style={{ color: RARITIES[card.rarity]?.color }}>{card.version}</div>
                  <div className="mt-1 text-xs text-gray-500">HP {calculateHP(card)}</div>
                </motion.div>
              );
            })}
          </div>
          {playerCard && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('pick-difficulty')}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg"
            >
              Fight with {playerCard.name} <ChevronRight className="inline w-5 h-5" />
            </motion.button>
          )}
        </motion.div>
      )}

      {/* ── PICK DIFFICULTY ──────────────────────────────────────────── */}
      {phase === 'pick-difficulty' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => setPhase('pick-card')} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-lg font-bold mb-4">Select Difficulty</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {DIFFICULTY_TIERS.map(d => (
              <motion.div
                key={d.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDifficulty(d)}
                className="p-5 rounded-2xl border-2 cursor-pointer transition-all"
                style={{
                  borderColor: difficulty.id === d.id ? d.color : '#374151',
                  background: difficulty.id === d.id ? `${d.color}15` : 'rgba(17,24,39,0.7)',
                  boxShadow: difficulty.id === d.id ? `0 0 20px ${d.color}30` : undefined,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                    style={{ background: d.color, color: '#000' }}>
                    {DIFFICULTY_TIERS.indexOf(d) + 1}
                  </div>
                  <span className="font-black text-lg" style={{ color: d.color }}>{d.label}</span>
                </div>
                <p className="text-sm text-gray-400">{d.description}</p>
                <div className="mt-3 flex gap-3 text-xs text-gray-500">
                  <span>💰 ×{d.rewardMult} credits</span>
                  <span>⭐ ×{d.xpMult} XP</span>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={startBattle}
            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg text-black"
            style={{ background: `linear-gradient(135deg, ${difficulty.color}, ${difficulty.color}cc)` }}
          >
            ⚔️ Start Battle!
          </motion.button>
        </motion.div>
      )}

      {/* ── BATTLE ──────────────────────────────────────────────────── */}
      {phase === 'battle' && playerCard && opponentCard && (
        <div className="space-y-4">
          {/* Turn counter */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>Turn {turn}/{maxTurns}</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${(turn / maxTurns) * 100}%` }} />
            </div>
            <span className="font-bold text-xs" style={{ color: difficulty.color }}>{difficulty.label}</span>
          </div>

          {/* Opponent panel */}
          <motion.div animate={shakeSide === 'opponent' ? { x: [-6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}>
            <FighterPanel card={opponentCard} hp={opponentHp} maxHp={maxOpponentHp} energy={opponentEnergy}
              buffs={opponentBuffs} focusStacks={opponentFocus} isPlayer={false}
              typeMatchup={typeMatchupOpponent} selectedMove={opponentMove} waiting={aiThinking && !opponentMove} />
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 font-bold text-sm">VS</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Player panel */}
          <motion.div animate={shakeSide === 'player' ? { x: [6, -6, 4, -4, 0] } : {}} transition={{ duration: 0.35 }}>
            <FighterPanel card={playerCard} hp={playerHp} maxHp={maxPlayerHp} energy={playerEnergy}
              buffs={playerBuffs} focusStacks={playerFocus} isPlayer={true}
              typeMatchup={typeMatchupPlayer} selectedMove={playerMove} waiting={false} />
          </motion.div>

          {/* Move buttons */}
          <div className="grid grid-cols-2 gap-3">
            {Object.values(MOVES).map(mv => {
              const meta = MOVE_META[mv.id];
              if (!meta) return null;
              const Icon = meta.icon;
              const canAfford = playerEnergy >= mv.energyCost;
              const onCooldown = !!mistralCooldowns[mv.id];
              const locked = !!playerMove || onCooldown || !canAfford || !!winner;
              return (
                <motion.button
                  key={mv.id}
                  whileHover={locked ? {} : { scale: 1.03 }}
                  whileTap={locked ? {} : { scale: 0.97 }}
                  onClick={() => !locked && handlePlayerMove(mv.id)}
                  disabled={locked}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden ${
                    locked
                      ? 'border-gray-700/40 bg-gray-800/40 text-gray-500 cursor-not-allowed'
                      : `border-transparent bg-gradient-to-br ${meta.color} text-white shadow-lg`
                  } ${playerMove === mv.id ? 'ring-2 ring-white/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-bold">{mv.name}</div>
                      <div className="text-xs opacity-80">{meta.hint}</div>
                    </div>
                  </div>
                  {onCooldown && (
                    <div className="absolute inset-0 bg-black/65 flex items-center justify-center rounded-xl">
                      <span className="text-xs font-bold text-red-300">⏳ Cooldown</span>
                    </div>
                  )}
                  {!canAfford && !onCooldown && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                      <span className="text-xs font-bold text-gray-400">Need ⚡ {mv.energyCost}</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Battle log */}
          <div ref={logRef} className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-3 h-32 overflow-y-auto space-y-0.5">
            {log.map((l, i) => <div key={i} className="text-xs text-gray-300 leading-relaxed">{l}</div>)}
          </div>
        </div>
      )}

      {/* ── RESULT OVERLAY ────────────────────────────────────────────── */}
      <AnimatePresence>
        {winner && phase === 'battle' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full border text-center"
              style={{ borderColor: winner === 'player' ? '#22c55e50' : winner === 'draw' ? '#f59e0b50' : '#ef444450' }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                className="text-7xl mb-4">
                {winner === 'player' ? '🏆' : winner === 'draw' ? '🤝' : '💀'}
              </motion.div>
              <h2 className={`text-3xl font-black mb-2 ${winner === 'player' ? 'text-green-400' : winner === 'draw' ? 'text-yellow-400' : 'text-red-400'}`}>
                {winner === 'player' ? 'Victory!' : winner === 'draw' ? 'Draw!' : 'Defeat'}
              </h2>
              <p className="text-gray-400 mb-6 text-sm">
                {winner === 'player'
                  ? `You defeated ${opponentCard?.name} on ${difficulty.label}!`
                  : winner === 'draw'
                  ? 'Both fighters fell at the same time.'
                  : `${opponentCard?.name} was too powerful. Train harder!`}
              </p>
              <div className="bg-gray-800/60 rounded-2xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Credits Earned</span>
                  <span className="font-black text-yellow-400">+{reward}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">XP Earned</span>
                  <span className="font-black text-blue-400">+{Math.floor((winner === 'player' ? 75 : winner === 'draw' ? 20 : 10) * difficulty.xpMult)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Turns</span>
                  <span className="font-bold text-gray-300">{turn} / {maxTurns}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Difficulty</span>
                  <span className="font-bold" style={{ color: difficulty.color }}>{difficulty.label}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setPhase('pick-card'); setPlayerCard(null); setWinner(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" /> Play Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onXpGain(Math.floor((winner === 'player' ? 75 : winner === 'draw' ? 20 : 10) * difficulty.xpMult));
                    onComplete(reward);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm shadow-lg"
                  style={{ background: winner === 'player' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#374151' }}
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating damage numbers */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {floats.map(f => (
            <motion.div key={f.id}
              initial={{ opacity: 1, y: 0, scale: 1.4 }}
              animate={{ opacity: 0, y: -90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="absolute font-black text-3xl drop-shadow-lg select-none"
              style={{
                left: f.side === 'player' ? '20%' : '65%',
                top: '40%',
                color: '#ef4444',
                textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              }}
            >
              -{f.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

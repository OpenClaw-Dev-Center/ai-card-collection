import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, Coins, Heart, Zap, Shield, Eye, Wind, Brain } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CARD_POOL, RARITIES, MOVES, calculateHP } from '../data/cards';

// Ability icons mapping
const ABILITY_ICONS = {
  'Analytical Precision': Eye,
  'Adaptive Learning': Brain,
  'Multimodal Mastery': Sparkles,
  'Versatile Tactician': Repeat,
  'Efficient Operations': Zap,
  'Precognitive Analysis': Eye
};

export function GameMode({ user, currency, onComplete, onBack }) {
  const { recordBattle } = useAuth();
  const [collection, setCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [battleState, setBattleState] = useState('setup'); // 'setup', 'selecting', 'resolving', 'ended'
  const [playerHP, setPlayerHP] = useState(0);
  const [opponentHP, setOpponentHP] = useState(0);
  const [maxHP, setMaxHP] = useState(200);
  const [playerMove, setPlayerMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);
  const [playerBonus, setPlayerBonus] = useState(0); // Focus damage bonus
  const [opponentBonus, setOpponentBonus] = useState(0);
  const [playerEnergy, setPlayerEnergy] = useState(50);
  const [opponentEnergy, setOpponentEnergy] = useState(50);
  const [playerEffects, setPlayerEffects] = useState([]); // [{id, name, duration, description}]
  const [opponentEffects, setOpponentEffects] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [turn, setTurn] = useState(1);
  const [maxTurns] = useState(15); // longer battles for strategy
  const [winner, setWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [showAbilityPreview, setShowAbilityPreview] = useState(false);
  const [abilityInfo, setAbilityInfo] = useState(null);
  const [playerPrediction, setPlayerPrediction] = useState(null); // DeepSeek effect
  const [opponentPrediction, setOpponentPrediction] = useState(null);

  const MAX_ENERGY = 100;
  const ENERGY_PER_TURN = 25;

  // Move costs
  const MOVE_COSTS = {
    strike: 25,
    block: 20,
    focus: 35,
    blitz: 45
  };

  useEffect(() => {
    if (user) {
      const saved = JSON.parse(localStorage.getItem(`collection_${user}`) || '[]');
      setCollection(saved);
      if (saved.length > 0) {
        setSelectedCard(saved[0]);
      }
    }
  }, [user]);

  const getRandomOpponent = () => {
    if (collection.length === 0) {
      const randomIdx = Math.floor(Math.random() * CARD_POOL.length);
      return CARD_POOL[randomIdx];
    }
    const randomIdx = Math.floor(Math.random() * collection.length);
    return { ...collection[randomIdx] };
  };

  // Provider-specific passive ability triggers
  const triggerPlayerAbility = (state, effects) => {
    const card = selectedCard;
    if (!card || !card.ability) return null;

    const ability = card.ability;
    // Claude: Analytical Precision - 30% chance to reveal opponent move when using Focus
    if (ability.name === 'Analytical Precision' && playerMove?.id === 'focus') {
      if (Math.random() < 0.3) {
        return {
          name: 'Analytical Precision',
          description: 'You predicted the opponent\'s move!',
          icon: '🔍',
          effect: 'reveal'
        };
      }
    }
    // GPT: Adaptive Learning - random stat buff at start and every 3 turns
    if (ability.name === 'Adaptive Learning' && (turn === 1 || turn % 3 === 0)) {
      const stats = ['power', 'speed', 'intelligence', 'creativity'];
      const buffedStat = stats[Math.floor(Math.random() * stats.length)];
      const buffAmount = 0.1; // +10%
      return {
        name: 'Adaptive Learning',
        description: `${buffedStat.charAt(0).toUpperCase() + buffedStat.slice(1)} increased by 10%!`,
        icon: '🧠',
        effect: 'buff',
        stat: buffedStat,
        duration: 2
      };
    }
    // Gemini: Multimodal Mastery - no specific trigger, handled in damage calc
    // Llama: Versatile Tactician - Focus bonus doesn't expire, tracked via state
    // Mistral: Efficient Operations - no ability trigger, handled in move check
    // DeepSeek: Precognitive Analysis - 25% chance to predict opponent move
    if (ability.name === 'Precognitive Analysis') {
      if (Math.random() < 0.25) {
        // Predict opponent's move type (attack or defend)
        const predictedAttack = opponentMove && (opponentMove.id === 'strike' || opponentMove.id === 'blitz');
        return {
          name: 'Precognitive Analysis',
          description: predictedAttack ? 'Predicted attack! Next strike gains +20% damage.' : 'Predicted defense! Next attack ignores 30% defense.',
          icon: '🔮',
          effect: predictedAttack ? 'damageBuff' : 'defensePenetration'
        };
      }
    }
    return null;
  };

  const triggerOpponentAbility = () => {
    const card = opponentCard;
    if (!card || !card.ability) return null;

    const ability = card.ability;
    // Claude AI
    if (ability.name === 'Analytical Precision' && opponentMove?.id === 'focus') {
      if (Math.random() < 0.3) {
        return {
          name: 'Analytical Precision',
          description: 'Opponent predicted your move!',
          icon: '🔍',
          effect: 'reveal'
        };
      }
    }
    // GPT Adaptive
    if (ability.name === 'Adaptive Learning' && (turn === 1 || turn % 3 === 0)) {
      const stats = ['power', 'speed', 'intelligence', 'creativity'];
      const buffedStat = stats[Math.floor(Math.random() * stats.length)];
      return {
        name: 'Adaptive Learning',
        description: `Opponent's ${buffedStat} increased by 10%`,
        icon: '🧠',
        effect: 'buff',
        stat: buffedStat
      };
    }
    // DeepSeek Precognitive
    if (ability.name === 'Precognitive Analysis') {
      if (Math.random() < 0.25) {
        const predictedAttack = playerMove && (playerMove.id === 'strike' || playerMove.id === 'blitz');
        return {
          name: 'Precognitive Analysis',
          description: predictedAttack ? 'Opponent predicted your attack! Their next strike gains +20% damage.' : 'Opponent predicted your defense. Their next attack ignores 30% defense.',
          icon: '🔮',
          effect: predictedAttack ? 'damageBuff' : 'defensePenetration'
        };
      }
    }
    return null;
  };

  const applyEffects = (effects, setEffects) => {
    setEffects(prev => {
      const newEffects = prev.filter(e => e.duration > 0);
      newEffects.forEach(e => {
        if (e.duration > 0) e.duration--;
      });
      return newEffects.filter(e => e.duration > 0);
    });
  };

  const startBattle = () => {
    if (!selectedCard || collection.length === 0) {
      alert('You need at least one card in your collection to battle!');
      return;
    }

    const opponent = getRandomOpponent();
    setOpponentCard(opponent);

    const playerMax = calculateHP(selectedCard);
    const opponentMax = calculateHP(opponent);
    setPlayerHP(playerMax);
    setOpponentHP(opponentMax);
    setMaxHP(Math.max(playerMax, opponentMax));
    setPlayerEnergy(50);
    setOpponentEnergy(50);
    setPlayerEffects([]);
    setOpponentEffects([]);
    setPlayerBonus(0);
    setOpponentBonus(0);
    setPlayerPrediction(null);
    setOpponentPrediction(null);

    setBattleState('selecting');
    setTurn(1);
    setBattleLog([{ turn: 1, text: `Battle start! ${selectedCard.name} vs ${opponent.name}` }]);
    setWinner(null);
    setDamageNumbers([]);
  };

  const chooseOpponentMove = () => {
    if (!opponentCard) return MOVES.STRIKE;

    // Energy check: if not enough energy, default to Strike (lowest cost)
    if (opponentEnergy < 20) return MOVES.STRIKE;

    // Apply ability-modified AI logic
    let weights = { strike: 0.4, block: 0.2, focus: 0.25, blitz: 0.15 };

    // Mistral Efficient: can use same move repeatedly
    if (opponentCard.ability?.name === 'Efficient Operations') {
      weights = { strike: 0.35, block: 0.25, focus: 0.25, blitz: 0.15 }; // more flexible
    }

    // Adjust based on HP
    const hpRatio = opponentHP / maxHP;
    if (hpRatio < 0.3) {
      weights.block += 0.3;
      weights.strike -= 0.2;
      weights.focus -= 0.1;
    }

    const r = Math.random();
    let cumulative = 0;
    const moveKeys = Object.keys(weights);
    const chosenMoveKey = moveKeys.find(key => {
      cumulative += weights[key];
      return r < cumulative;
    });

    return MOVES[chosenMoveKey.toUpperCase()];
  };

  const canUseMove = (move, energy) => {
    return energy >= MOVE_COSTS[move.id];
  };

  const calculateDamage = (move, attacker, defender, attackerBonus, defenderMove, abilityEffect) => {
    if (move.id === 'focus') return 0;

    let base;
    let stat = move.stat;

    // Gemini ability: Multimodal Mastery - can use any stat
    if (attacker.ability?.name === 'Multimodal Mastery') {
      // Use highest stat for attack moves
      if (move.id === 'strike' || move.id === 'blitz') {
        stat = Object.keys(attacker.stats).reduce((a, b) => attacker.stats[a] > attacker.stats[b] ? a : b);
      }
    }

    if (move.id === 'strike') {
      base = attacker.stats[stat] * move.damageFactor;
    } else if (move.id === 'blitz') {
      base = attacker.stats[stat] * move.damageFactor;
    } else {
      return 0;
    }

    // Apply bonus multiplier from Focus
    base *= (1 + attackerBonus);

    // Apply ability effects
    if (abilityEffect === 'damageBuff') {
      base *= 1.2; // +20%
    }

    // Defense reduction from Block
    if (defenderMove && defenderMove.id === 'block') {
      let reduction = MOVES.BLOCK.defenseReduction;
      // Defense penetration
      if (move.defensePenetration) {
        if (abilityEffect === 'defensePenetration') {
          reduction *= (1 - move.defensePenetration - 0.3); // extra 30% penetration
        } else {
          reduction *= (1 - move.defensePenetration);
        }
      }
      base *= (1 - reduction);
    }

    return Math.max(1, Math.floor(base));
  };

  const handleMoveSelect = (move) => {
    if (battleState !== 'selecting' || isProcessing) return;

    if (!canUseMove(move, playerEnergy)) {
      alert(`Not enough energy! ${move.name} costs ${MOVE_COSTS[move.id]} energy.`);
      return;
    }

    setIsProcessing(true);
    setPlayerMove(move);

    const oppMove = chooseOpponentMove();
    setOpponentMove(oppMove);

    setTimeout(() => {
      resolveTurn(move, oppMove);
    }, 300);
  };

  const resolveTurn = (pMove, oMove) => {
    // Check for prediction effects (DeepSeek ability)
    let pAbilityEffect = null;
    let oAbilityEffect = null;

    // Apply DeepSeek predictions if active
    if (playerPrediction) {
      pAbilityEffect = playerPrediction.effect;
      setPlayerPrediction(null);
      if (pAbilityEffect === 'damageBuff') {
        setPlayerEffects(prev => [...prev, { id: 'ds-buff', name: 'Precognitive Strike', duration: 1 }]);
      }
    }
    if (opponentPrediction) {
      oAbilityEffect = opponentPrediction.effect;
      setOpponentPrediction(null);
      if (oAbilityEffect === 'damageBuff') {
        setOpponentEffects(prev => [...prev, { id: 'ds-buff', name: 'Precognitive Strike', duration: 1 }]);
      }
    }

    // Check for active effects
    const pHasDamageBuff = playerEffects.some(e => e.id === 'ds-buff');
    const oHasDamageBuff = opponentEffects.some(e => e.id === 'ds-buff');

    if (pHasDamageBuff) pAbilityEffect = 'damageBuff';
    if (oHasDamageBuff) oAbilityEffect = 'damageBuff';

    // Calculate damage
    const pDamage = calculateDamage(pMove, selectedCard, opponentCard, playerBonus, oMove, pAbilityEffect);
    const oDamage = calculateDamage(oMove, opponentCard, selectedCard, opponentBonus, pMove, oAbilityEffect);

    const newPlayerHP = Math.max(0, playerHP - oDamage);
    const newOpponentHP = Math.max(0, opponentHP - pDamage);

    const newLog = [...battleLog];
    const currentTurnNum = turn;

    // Track ability triggers
    const pAbility = triggerPlayerAbility({ move: pMove }, playerEffects);
    const oAbility = triggerOpponentAbility({ move: oMove }, opponentEffects);

    // Player action
    if (pMove.id === 'strike' || pMove.id === 'blitz') {
      const dmg = opponentHP - newOpponentHP;
      newLog.push({
        turn: currentTurnNum,
        text: `You used ${pMove.name}${pMove.id === 'blitz' ? ' (Blitz penetrates defense!)' : ''}! Dealt ${dmg} damage.`,
        damage: dmg,
        isPlayer: true
      });
      setPlayerBonus(0);
    } else if (pMove.id === 'focus') {
      newLog.push({
        turn: currentTurnNum,
        text: `You used ${pMove.name}. Next Strike empowered!`,
        isPlayer: true
      });
      const bonus = selectedCard.stats.intelligence * MOVES.FOCUS.bonusFactor;
      setPlayerBonus(bonus);
    } else if (pMove.id === 'block') {
      newLog.push({
        turn: currentTurnNum,
        text: `You used ${pMove.name}. Defense active!`,
        isPlayer: true
      });
    }

    // Opponent action
    if (oMove.id === 'strike' || oMove.id === 'blitz') {
      const dmg = playerHP - newPlayerHP;
      newLog.push({
        turn: currentTurnNum,
        text: `Opponent used ${oMove.name}! Dealt ${dmg} damage.`,
        damage: dmg,
        isPlayer: false
      });
      setOpponentBonus(0);
    } else if (oMove.id === 'focus') {
      newLog.push({
        turn: currentTurnNum,
        text: `Opponent used ${oMove.name}. Preparing a powerful move!`,
        isPlayer: false
      });
      const bonus = opponentCard.stats.intelligence * MOVES.FOCUS.bonusFactor;
      setOpponentBonus(bonus);
    } else if (oMove.id === 'block') {
      newLog.push({
        turn: currentTurnNum,
        text: `Opponent used ${oMove.name}. Defense active!`,
        isPlayer: false
      });
    }

    // Ability effect messages
    if (pAbility) {
      newLog.push({
        turn: currentTurnNum,
        text: `✨ ${pAbility.description}`,
        isPlayer: true,
        isAbility: true
      });
      if (pAbility.effect === 'reveal' && oMove) {
        setShowAbilityPreview(true);
        setAbilityInfo({ ...pAbility, move: oMove });
        setTimeout(() => setShowAbilityPreview(false), 2000);
      }
    }
    if (oAbility) {
      newLog.push({
        turn: currentTurnNum,
        text: `⚡ Opponent: ${oAbility.description}`,
        isPlayer: false,
        isAbility: true
      });
      if (oAbility.effect === 'reveal' && pMove) {
        // Opponent predicted your move - you see it
        setTimeout(() => {
          alert(`Opponent predicted your ${pMove.name}!`);
        }, 500);
      }
    }

    // Deduct energy costs
    setPlayerEnergy(prev => Math.max(0, prev - MOVE_COSTS[pMove.id]));
    setOpponentEnergy(prev => Math.max(0, prev - MOVE_COSTS[oMove.id]));

    // Update HP
    setPlayerHP(newPlayerHP);
    setOpponentHP(newOpponentHP);

    // Create damage numbers
    const damages = [];
    const pDmg = opponentHP - newOpponentHP;
    const oDmg = playerHP - newPlayerHP;
    if (pDmg > 0) damages.push({ target: 'opponent', value: pDmg, x: '60%', y: '30%' });
    if (oDmg > 0) damages.push({ target: 'player', value: oDmg, x: '40%', y: '70%' });
    setDamageNumbers(damages);

    setBattleLog(newLog);

    // Apply effects for next turn
    applyEffects(playerEffects, setPlayerEffects);
    applyEffects(opponentEffects, setOpponentEffects);

    // Check win conditions
    if (newPlayerHP <= 0) {
      setBattleState('ended');
      setWinner('opponent');
      setTimeout(() => finishBattle(50, 'lose'), 2000);
    } else if (newOpponentHP <= 0) {
      setBattleState('ended');
      setWinner('player');
      const reward = 200 + (currentTurnNum * 50) + (Math.random() > 0.7 ? 300 : 0);
      setTimeout(() => finishBattle(reward, 'win'), 2000);
    } else if (currentTurnNum >= maxTurns) {
      setBattleState('ended');
      if (newPlayerHP > newOpponentHP) {
        setWinner('player');
        setTimeout(() => finishBattle(150, 'win'), 2000);
      } else if (newOpponentHP > newPlayerHP) {
        setWinner('opponent');
        setTimeout(() => finishBattle(50, 'lose'), 2000);
      } else {
        setWinner('draw');
        setTimeout(() => finishBattle(100, 'draw'), 2000);
      }
    } else {
      // Next turn
      setTimeout(() => {
        setTurn(prev => prev + 1);
        setPlayerMove(null);
        setOpponentMove(null);
        setIsProcessing(false);
        // Regenerate energy
        setPlayerEnergy(prev => Math.min(MAX_ENERGY, prev + ENERGY_PER_TURN));
        setOpponentEnergy(prev => Math.min(MAX_ENERGY, prev + ENERGY_PER_TURN));
      }, 500);
    }
  };

  const finishBattle = (reward, result) => {
    // Record battle stats
    recordBattle(result);
    onComplete(reward);
  };

  const getMoveStyle = (move) => {
    const base = "w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all";
    const canUse = playerEnergy >= MOVE_COSTS[move.id];
    if (!canUse) return `${base} bg-gray-800/50 border-2 border-gray-600 opacity-50 cursor-not-allowed`;

    if (move.id === 'strike') return `${base} bg-red-900/50 border-2 border-red-500 hover:bg-red-800/70`;
    if (move.id === 'block') return `${base} bg-blue-900/50 border-2 border-blue-500 hover:bg-blue-800/70`;
    if (move.id === 'focus') return `${base} bg-purple-900/50 border-2 border-purple-500 hover:bg-purple-800/70`;
    if (move.id === 'blitz') return `${base} bg-cyan-900/50 border-2 border-cyan-500 hover:bg-cyan-800/70`;
    return base;
  };

  const MoveButton = ({ move, disabled }) => {
    const canUse = playerEnergy >= MOVE_COSTS[move.id];
    const IconComponent = () => move.id === 'strike' ? <Zap className="w-5 h-5" /> :
                          move.id === 'block' ? <Shield className="w-5 h-5" /> :
                          move.id === 'focus' ? <Eye className="w-5 h-5" /> :
                          <Wind className="w-5 h-5" />;

    return (
      <motion.button
        whileHover={canUse && !disabled ? { scale: 1.05 } : {}}
        whileTap={canUse && !disabled ? { scale: 0.95 } : {}}
        disabled={!canUse || disabled}
        className={getMoveStyle(move)}
        onClick={() => handleMoveSelect(move)}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">{move.icon}</div>
          <div className="text-xs font-medium">{move.name}</div>
          <div className="text-[10px] text-gray-400 mt-1">{MOVE_COSTS[move.id]}⚡</div>
          <div className="text-[10px] text-gray-500 capitalize">{move.stat}</div>
        </div>
      </motion.button>
    );
  };

  if (collection.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-gray-900/80 backdrop-blur rounded-2xl p-12 border border-gray-700 max-w-md"
        >
          <div className="text-6xl mb-4">🎴</div>
          <h2 className="text-2xl font-bold mb-4">No Cards Yet!</h2>
          <p className="text-gray-400 mb-6">You need at least one card to battle. Open some packs first!</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold"
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative">
      <AnimatePresence>
        {damageNumbers.map((dmg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -50, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute text-4xl font-bold pointer-events-none z-50"
            style={{ left: dmg.x, top: dmg.y }}
          >
            <span className={dmg.target === 'player' ? 'text-red-500' : 'text-green-500'}>
              -{dmg.value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Ability Preview Modal */}
      <AnimatePresence>
        {showAbilityPreview && abilityInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-6 max-w-sm text-center"
              layoutId="ability-preview"
            >
              <div className="text-4xl mb-2">{abilityInfo.icon}</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">{abilityInfo.name}</h3>
              <p className="text-gray-300">{abilityInfo.description}</p>
              {abilityInfo.move && (
                <p className="text-yellow-300 mt-2">Opponent will use: {abilityInfo.move.icon} {abilityInfo.move.name}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-4">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
            Battle Arena
          </h1>
          <p className="text-sm text-gray-400">Turn {turn}/{maxTurns}</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Coins className="w-5 h-5" />
            <span className="font-bold">{currency.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Energy Bars */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/80 backdrop-blur rounded-xl p-3 border border-blue-500/30">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-blue-400">Your Energy</span>
            <span>{playerEnergy}/{MAX_ENERGY}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              key={playerEnergy}
              animate={{ width: `${(playerEnergy / MAX_ENERGY) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
            />
          </div>
        </div>
        <div className="bg-gray-900/80 backdrop-blur rounded-xl p-3 border border-red-500/30">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">Opponent Energy</span>
            <span>{opponentEnergy}/{MAX_ENERGY}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              key={opponentEnergy}
              animate={{ width: `${(opponentEnergy / MAX_ENERGY) * 100}%` }}
              className="h-full bg-gradient-to-r from-red-600 to-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Battle Stage */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player side */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400 fill-red-400" />
              Your Card
            </h2>

            {selectedCard && (
              <>
                {/* Card image */}
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2"
                  style={{ borderColor: selectedCard.rarityInfo.color }}>
                  {selectedCard.image ? (
                    <img src={selectedCard.image} alt={selectedCard.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {selectedCard.providerInfo.icon}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="font-bold text-lg">{selectedCard.name}</h3>
                    <p className="text-sm text-gray-300">v{selectedCard.version}</p>
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-bold mt-1"
                      style={{ backgroundColor: selectedCard.rarityInfo.color }}
                    >
                      {selectedCard.rarityInfo.name}
                    </span>
                  </div>
                  {/* Ability indicator */}
                  {selectedCard.ability && (
                    <div className="absolute top-2 right-2 bg-purple-900/80 backdrop-blur px-2 py-1 rounded text-xs border border-purple-500">
                      <span className="text-purple-300">Ability</span>
                    </div>
                  )}
                </div>

                {/* HP Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>HP</span>
                    <span className="font-bold">{playerHP} / {maxHP}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                    <motion.div
                      key={playerHP}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(playerHP / maxHP) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-red-600 to-red-400"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 bg-gray-800/50 rounded-xl p-3 text-center text-xs">
                  {Object.entries(selectedCard.stats).map(([key, val]) => (
                    <div key={key} className="capitalize">
                      <div className="text-gray-400">{key}</div>
                      <div className="font-bold" style={{ color: selectedCard.providerInfo.color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Active Effects */}
                {playerEffects.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {playerEffects.map((effect, idx) => (
                      <div key={idx} className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded flex justify-between">
                        <span>{effect.name}</span>
                        <span>{effect.duration}t</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bonus indicator */}
                {playerBonus > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-center text-purple-400 text-sm font-bold"
                  >
                    🔮 Focus Bonus: +{Math.round(playerBonus*100)}%
                  </motion.div>
                )}

                {/* Ability description */}
                {selectedCard.ability && (
                  <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-sm">
                    <div className="font-bold text-purple-300 mb-1">Unique Ability</div>
                    <div className="text-purple-200 font-medium">{selectedCard.ability.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedCard.ability.description}</div>
                  </div>
                )}

                {/* Card switcher */}
                {collection.length > 1 && battleState === 'setup' && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Switch Card</h4>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {collection.map(card => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCard(card)}
                          className={`p-2 rounded-lg border transition-all ${
                            selectedCard.id === card.id
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-2xl mb-1">{card.providerInfo.icon}</div>
                          <div className="text-xs truncate">{card.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-500">v{card.version}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Move buttons */}
                {battleState === 'selecting' && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {Object.values(MOVES).map(move => (
                      <MoveButton key={move.id} move={move} disabled={isProcessing} />
                    ))}
                  </div>
                )}

                {/* Selected move display */}
                {battleState === 'resolving' && playerMove && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gray-800/70 rounded-xl text-center"
                  >
                    <div className="text-sm text-gray-400">Your Move</div>
                    <div className="text-2xl my-2">{playerMove.icon} {playerMove.name}</div>
                    <div className="text-xs text-gray-400">{playerMove.description}</div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>

        {/* Center: Opponent & Battle */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700 min-h-[500px] flex flex-col relative"
          >
            {/* Opponent */}
            <div className="mb-6 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-48 aspect-[3/4] rounded-xl overflow-hidden border-2 border-red-500/50"
              >
                {opponentCard?.image ? (
                  <img src={opponentCard.image} alt={opponentCard.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {opponentCard?.providerInfo?.icon}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
                  <h3 className="font-bold">{opponentCard?.name}</h3>
                  <p className="text-sm text-gray-300">v{opponentCard?.version}</p>
                </div>
                {/* Opponent HP */}
                <div className="absolute top-0 left-0 right-0 p-2 bg-black/50">
                  <div className="text-xs text-red-400 mb-1 flex justify-between">
                    <span>Opponent HP</span>
                    <span>{opponentHP}/{maxHP}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      key={opponentHP}
                      animate={{ width: `${(opponentHP / maxHP) * 100}%` }}
                      className="h-full bg-red-500"
                    />
                  </div>
                </div>
                {/* Opponent Ability indicator */}
                {opponentCard?.ability && (
                  <div className="absolute top-2 right-2 bg-red-900/80 backdrop-blur px-2 py-1 rounded text-xs border border-red-500">
                    <span className="text-red-300">Ability</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Battle controls */}
            {battleState === 'setup' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startBattle}
                className="self-center py-4 px-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold text-xl shadow-lg flex items-center gap-2"
              >
                <Swords className="w-6 h-6" />
                Start Battle!
              </motion.button>
            )}

            {/* Opponent move indicator */}
            {battleState === 'resolving' && opponentMove && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-center mb-4 px-6 py-3 bg-gray-800/80 rounded-xl text-center border border-yellow-500/30"
              >
                <div className="text-sm text-gray-400">Opponent is using</div>
                <div className="text-2xl my-1 text-yellow-400">{opponentMove.icon} {opponentMove.name}</div>
                <div className="text-xs text-gray-400">{opponentMove.description}</div>
              </motion.div>
            )}

            {/* End overlay */}
            {battleState === 'ended' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl"
              >
                <div className="text-center p-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-8xl mb-4"
                  >
                    {winner === 'player' ? '🏆' : winner === 'opponent' ? '💀' : '🤝'}
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-2">
                    {winner === 'player' ? 'VICTORY!' : winner === 'opponent' ? 'DEFEAT' : 'DRAW'}
                  </h2>
                  <p className="text-gray-300 mb-4">
                    {winner === 'player' ? 'Your strategy prevailed!' : winner === 'opponent' ? 'You were defeated...' : 'It\'s a tie!'}
                  </p>
                  <p className="text-yellow-400 font-bold animate-pulse">
                    Returning to dashboard...
                  </p>
                </div>
              </motion.div>
            )}

            {/* Battle log */}
            <div className="mt-4 flex-1 bg-gray-800/50 rounded-xl p-4 overflow-y-auto max-h-64">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Battle Log</h3>
              <div className="space-y-1 text-sm">
                <AnimatePresence>
                  {battleLog.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-start gap-2 ${log.isPlayer ? 'text-blue-300' : 'text-red-300'} ${log.damage ? 'font-bold' : ''} ${log.isAbility ? 'text-purple-300' : ''}`}
                    >
                      <span className="text-gray-500">[T{log.turn}]</span>
                      <span>{log.text}</span>
                      {log.damage > 0 && (
                        <span className={log.isPlayer ? 'text-red-400' : 'text-green-400'}>
                          {log.isPlayer ? '❤️' : '💔'}-{log.damage}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Moves reference */}
      <div className="max-w-6xl mx-auto mt-6">
        <h3 className="text-sm font-bold text-gray-400 mb-2">Moves Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(MOVES).map(move => (
            <div key={move.id} className="p-3 bg-gray-800/50 rounded-xl text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{move.icon}</span>
                <span className="font-bold">{move.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{MOVE_COSTS[move.id]}⚡</span>
              </div>
              <div className="text-xs text-gray-400">{move.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Abilities Reference */}
      <div className="max-w-6xl mx-auto mt-6 mb-8">
        <h3 className="text-sm font-bold text-purple-400 mb-2">Provider Unique Abilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(PROVIDERS).map(provider => (
            <div key={provider.name} className="p-3 bg-gray-800/50 rounded-xl text-sm border border-purple-900/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{provider.icon}</span>
                <span className="font-bold text-purple-300">{provider.name}</span>
              </div>
              <div className="text-xs text-gray-400 font-medium">{provider.ability.name}</div>
              <div className="text-xs text-gray-500 mt-1">{provider.ability.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
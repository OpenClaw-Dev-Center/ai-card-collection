import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Swords, Coins, Heart, Zap, Shield, Eye, Wind, Brain,
  Sparkles, Repeat
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CARD_POOL, RARITIES, MOVES, calculateHP, PROVIDERS } from '../data/cards';

// Ability icons mapping
const ABILITY_ICONS = {
  'Analytical Precision': Eye,
  'Adaptive Learning': Brain,
  'Multimodal Mastery': Sparkles,
  'Versatile Tactician': Repeat,
  'Efficient Operations': Zap,
  'Precognitive Analysis': Eye
};

// Move icons mapping
const MOVE_ICONS = {
  strike: Swords,
  block: Shield,
  focus: Eye,
  blitz: Wind
};

export function GameMode({ user, currency, onComplete, onBack }) {
  const { recordBattle } = useAuth();
  const [collection, setCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [battleState, setBattleState] = useState('selecting'); // selecting, battling, result
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [opponentEnergy, setOpponentEnergy] = useState(100);
  const [playerHP, setPlayerHP] = useState(0);
  const [opponentHP, setOpponentHP] = useState(0);
  const [playerMove, setPlayerMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [reward, setReward] = useState(0);

  // Provider ability state
  const [playerAbilityTriggered, setPlayerAbilityTriggered] = useState(false);
  const [opponentAbilityTriggered, setOpponentAbilityTriggered] = useState(false);
  const [predictedMove, setPredictedMove] = useState(null); // DeepSeek prediction
  const [opponentMovePreview, setOpponentMovePreview] = useState(null); // Claude reveal
  const [playerStatAllocation, setPlayerStatAllocation] = useState(null); // Llama switch
  const [opponentStatAllocation, setOpponentStatAllocation] = useState(null); // Llama switch
  const [playerBuffs, setPlayerBuffs] = useState({}); // GPT random buff
  const [opponentBuffs, setOpponentBuffs] = useState({}); // GPT random buff
  const [focusBonus, setFocusBonus] = useState(0); // Focus accumulation
  const [opponentFocusBonus, setOpponentFocusBonus] = useState(0); // Focus accumulation
  const [moveCooldowns, setMoveCooldowns] = useState({}); // Mistral cooldown

  useEffect(() => {
    if (user) {
      const saved = JSON.parse(localStorage.getItem(`collection_${user}`) || '[]');
      setCollection(saved);
    }
  }, [user]);

  const initializeBattle = () => {
    if (!selectedCard || !opponentCard) return;

    // Calculate HP based on stats
    const playerMaxHP = calculateHP(selectedCard);
    const opponentMaxHP = calculateHP(opponentCard);

    setPlayerHP(playerMaxHP);
    setOpponentHP(opponentMaxHP);
    setPlayerEnergy(100);
    setOpponentEnergy(100);
    setBattleState('battling');
    setBattleLog([
      `Battle start! Your ${selectedCard.name} vs ${opponentCard.name}`,
      `Your HP: ${playerMaxHP} | Opponent HP: ${opponentMaxHP}`
    ]);
    setTurnCount(0);
    setDamageNumbers([]);
    setWinner(null);
    setReward(0);
    setPlayerAbilityTriggered(false);
    setOpponentAbilityTriggered(false);
    setPredictedMove(null);
    setOpponentMovePreview(null);
    setPlayerStatAllocation(null);
    setOpponentStatAllocation(null);
    setPlayerBuffs({});
    setOpponentBuffs({});
    setFocusBonus(0);
    setOpponentFocusBonus(0);
    setMoveCooldowns({});
  };

  // Choose opponent move based on AI logic
  const chooseOpponentMove = () => {
    const stats = {
      power: opponentCard.stats.power + (opponentBuffs.power || 0) + (opponentStatAllocation?.power || 0),
      speed: opponentCard.stats.speed + (opponentBuffs.speed || 0) + (opponentStatAllocation?.speed || 0),
      intelligence: opponentCard.stats.intelligence + (opponentBuffs.intelligence || 0) + (opponentStatAllocation?.intelligence || 0),
      creativity: opponentCard.stats.creativity + (opponentBuffs.creativity || 0) + (opponentStatAllocation?.creativity || 0)
    };

    const availableMoves = Object.keys(MOVES).filter(move => {
      if (moveCooldowns[move] && moveCooldowns[move] > 0) return false;
      const moveData = MOVES[move.toUpperCase()];
      return opponentEnergy >= moveData.energyCost;
    });

    if (availableMoves.length === 0) return null; // Should not happen

    // Weighted selection based on stats and situation
    const weights = availableMoves.map(move => {
      const moveData = MOVES[move.toUpperCase()];
      let weight = 1;

      // Check if we can kill with a strike
      if (move === 'strike' && playerHP <= stats.power * moveData.damageFactor * 1.5) {
        weight += 3;
      }

      // If low HP, consider blocking
      if (opponentHP < calculateHP(opponentCard) * 0.3 && move === 'block') {
        weight += 2;
      }

      // If opponent likely to strike, block
      if (playerBuffs.focus && move === 'block') {
        weight += 1.5;
      }

      // Stat biases
      if (move === 'strike') weight += stats.power / 50;
      if (move === 'focus') weight += stats.intelligence / 50;
      if (move === 'blitz') weight += stats.creativity / 50;
      if (move === 'block') weight += stats.speed / 50;

      return weight;
    });

    // Roulette wheel selection
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < availableMoves.length; i++) {
      random -= weights[i];
      if (random <= 0) return availableMoves[i];
    }
    return availableMoves[0];
  };

  // Trigger provider abilities
  const triggerPlayerAbility = (currentMove) => {
    const provider = PROVIDERS[selectedCard.provider];
    const ability = provider.ability;

    switch (ability.name) {
      case 'Analytical Precision':
        // 30% chance to reveal opponent's next move and gain +20% damage on next strike
        if (Math.random() < 0.3 && currentMove === 'focus') {
          setOpponentMovePreview(opponentMove);
          setPlayerBuffs(prev => ({ ...prev, analyticalPrecision: true }));
          addLog(`✨ Analytical Precision triggered! Opponent will use ${opponentMove}. Your next Strike gains +20% damage.`);
          return true;
        }
        break;

      case 'Adaptive Learning':
        // At battle start and every 3 turns, randomly boost one stat by 10%
        if (turnCount === 0 || turnCount % 3 === 0) {
          const stats = ['power', 'speed', 'intelligence', 'creativity'];
          const boostedStat = stats[Math.floor(Math.random() * stats.length)];
          setPlayerBuffs(prev => ({ ...prev, [boostedStat]: (prev[boostedStat] || 0) + 0.1 }));
          addLog(`🧠 Adaptive Learning triggered! ${boostedStat.charAt(0).toUpperCase() + boostedStat.slice(1)} increased by 10%.`);
          return true;
        }
        break;

      case 'Versatile Tactician':
        // Can switch stat allocation once per battle
        if (!playerStatAllocation && turnCount > 0) {
          // Just a placeholder - in a full UI we'd let player choose
          // For now, auto-boost the stat matching their chosen move
          const move = MOVES[currentMove.toUpperCase()];
          if (move) {
            setPlayerStatAllocation({ [move.stat]: 0.15 }); // +15% to relevant stat
            addLog(`🦙 Versatile Tactician: Stat allocation shifted to ${move.stat}!`);
            return true;
          }
        }
        break;

      case 'Efficient Operations':
        // Moves have cooldown of 1 turn, handled in cooldown system
        // We set cooldown after move execution
        break;

      case 'Multimodal Mastery':
        // Can use any stat for any move; damage penalty already handled in damage calc implicitly by using actual stats
        // Nothing extra to trigger
        break;

      case 'Precognitive Analysis':
        // 25% chance to predict opponent's move
        if (Math.random() < 0.25) {
          setPredictedMove(opponentMove);
          addLog(`🔮 Precognitive Analysis: Predicted ${opponentMove}!`);
          return true;
        }
        break;
    }

    return false;
  };

  const triggerOpponentAbility = (currentMove) => {
    const provider = PROVIDERS[opponentCard.provider];
    const ability = provider.ability;

    switch (ability.name) {
      case 'Analytical Precision':
        if (Math.random() < 0.3 && currentMove === 'focus') {
          setPlayerMovePreview(playerMove); // Would show preview to player
          setOpponentBuffs(prev => ({ ...prev, analyticalPrecision: true }));
          addLog(`Opponent's Analytical Precision reveals your move!`);
          return true;
        }
        break;

      case 'Adaptive Learning':
        if (turnCount === 0 || turnCount % 3 === 0) {
          const stats = ['power', 'speed', 'intelligence', 'creativity'];
          const boostedStat = stats[Math.floor(Math.random() * stats.length)];
          setOpponentBuffs(prev => ({ ...prev, [boostedStat]: (prev[boostedStat] || 0) + 0.1 }));
          addLog(`Opponent's Adaptive Learning boosted ${boostedStat}!`);
          return true;
        }
        break;

      case 'Versatile Tactician':
        if (!opponentStatAllocation && turnCount > 0) {
          const move = MOVES[currentMove.toUpperCase()];
          if (move) {
            setOpponentStatAllocation({ [move.stat]: 0.15 });
            addLog(`Opponent's Versatile Tactician shifted stats!`);
            return true;
          }
        }
        break;

      case 'Efficient Operations':
        // Cooldown handling
        break;

      case 'Multimodal Mastery':
        // Uses appropriate stat for move - handled in damage calc
        break;

      case 'Precognitive Analysis':
        if (Math.random() < 0.25) {
          setPredictedMove(playerMove);
          addLog(`Opponent predicted your move!`);
          return true;
        }
        break;
    }

    return false;
  };

  const calculateDamage = (attacker, defender, move, isPlayer) => {
    const moveData = MOVES[move.toUpperCase()];
    if (!moveData) return 0;

    // Get attacker stats with buffs and allocation
    let stats = { ...attacker.stats };
    if (isPlayer) {
      if (playerBuffs.power) stats.power *= (1 + playerBuffs.power);
      if (playerBuffs.speed) stats.speed *= (1 + playerBuffs.speed);
      if (playerBuffs.intelligence) stats.intelligence *= (1 + playerBuffs.intelligence);
      if (playerBuffs.creativity) stats.creativity *= (1 + playerBuffs.creativity);
      if (playerStatAllocation) {
        Object.keys(playerStatAllocation).forEach(stat => {
          stats[stat] *= (1 + playerStatAllocation[stat]);
        });
      }
    } else {
      if (opponentBuffs.power) stats.power *= (1 + opponentBuffs.power);
      if (opponentBuffs.speed) stats.speed *= (1 + opponentBuffs.speed);
      if (opponentBuffs.intelligence) stats.intelligence *= (1 + opponentBuffs.intelligence);
      if (opponentBuffs.creativity) stats.creativity *= (1 + opponentBuffs.creativity);
      if (opponentStatAllocation) {
        Object.keys(opponentStatAllocation).forEach(stat => {
          stats[stat] *= (1 + opponentStatAllocation[stat]);
        });
      }
    }

    // Determine effective stat based on move type
    let effectiveStat = stats[moveData.stat];

    // Multimodal Mastery: can use any stat
    if (isPlayer && selectedCard.provider === 'GEMINI') {
      // Use highest stat
      effectiveStat = Math.max(stats.power, stats.speed, stats.intelligence, stats.creativity);
    }
    if (!isPlayer && opponentCard.provider === 'GEMINI') {
      effectiveStat = Math.max(stats.power, stats.speed, stats.intelligence, stats.creativity);
    }

    // Base damage
    let damage = effectiveStat * moveData.damageFactor;

    // Focus bonus
    if (isPlayer && move === 'strike' && focusBonus > 0) {
      damage *= (1 + focusBonus);
    }
    if (!isPlayer && move === 'strike' && opponentFocusBonus > 0) {
      damage *= (1 + opponentFocusBonus);
    }

    // Analytical Precision +20% bonus
    if (isPlayer && playerBuffs.analyticalPrecision && move === 'strike') {
      damage *= 1.2;
      setPlayerBuffs(prev => {
        const { analyticalPrecision, ...rest } = prev;
        return rest;
      });
    }
    if (!isPlayer && opponentBuffs.analyticalPrecision && move === 'strike') {
      damage *= 1.2;
      setOpponentBuffs(prev => {
        const { analyticalPrecision, ...rest } = prev;
        return rest;
      });
    }

    // Apply defense penetration (Blitz)
    let defenseReduction = 0;
    if (moveData.defensePenetration) {
      defenseReduction = moveData.defensePenetration;
    }

    // Opponent's defensive capability based on stats (defense = average of speed + other stats / 2)
    const defenderDefense = (defender.stats.speed + (defender.stats.intelligence + defender.stats.creativity) / 2) / 3;

    // Reduce damage by defense
    let finalDamage = damage * (1 - defenseReduction) * (1 - defenderDefense / 200);

    // Cap minimum damage
    finalDamage = Math.max(5, Math.floor(finalDamage));

    return finalDamage;
  };

  const addLog = (message) => {
    setBattleLog(prev => [...prev, message]);
  };

  const spawnDamageNumber = (value, isPlayer) => {
    const id = Date.now() + Math.random();
    setDamageNumbers(prev => [...prev, { id, value, isPlayer }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 1000);
  };

  const handlePlayerMove = (move) => {
    if (battleState !== 'battling') return;
    const moveData = MOVES[move.toUpperCase()];
    if (playerEnergy < moveData.energyCost) return;

    setPlayerMove(move);
    setPlayerEnergy(prev => prev - moveData.energyCost);
  };

  const resolveTurn = () => {
    if (!playerMove || !opponentMove) return;

    setTurnCount(prev => prev + 1);
    addLog(`Turn ${turnCount + 1}: You used ${playerMove.toUpperCase()}, opponent used ${opponentMove.toUpperCase()}`);

    // Check for DeepSeek prediction bonuses
    let playerDamageBonus = 1;
    let opponentDamageBonus = 1;
    let ignorePlayerDefense = false;
    let ignoreOpponentDefense = false;

    if (predictedMove) {
      if (predictedMove === playerMove && opponentCard.provider === 'DEEPSEEK') {
        // Opponent predicted you
        opponentDamageBonus = 1.2;
        addLog('DeepSeek precognition: opponent attacks with +20% damage!');
      } else if (predictedMove === opponentMove && selectedCard.provider === 'DEEPSEEK') {
        // You predicted opponent
        playerDamageBonus = 1.2;
        addLog('Your DeepSeek precognition: your attack gains +20% damage!');
      }
    }

    // Calculate damage
    let playerDamage = calculateDamage(selectedCard, opponentCard, playerMove, true) * playerDamageBonus;
    let opponentDamage = calculateDamage(opponentCard, selectedCard, opponentMove, false) * opponentDamageBonus;

    // Apply DeepSeek defense ignore if opponent used attack move and you predicted it
    if (predictedMove && predictedMove === opponentMove && selectedCard.provider === 'DEEPSEEK') {
      ignoreOpponentDefense = true;
      opponentDamage *= 0.7; // Reduced because defense ignore means we dodged?
    }

    // Apply Block reduction (70% reduction)
    let actualOpponentDamage = opponentDamage;
    if (opponentMove === 'block') {
      actualOpponentDamage *= 0.3;
      addLog('Opponent blocked! Damage reduced by 70%.');
    }

    let actualPlayerDamage = playerDamage;
    if (playerMove === 'block') {
      actualPlayerDamage *= 0.3;
      addLog('You blocked! Damage reduced by 70%.');
    }

    // Apply damage
    setOpponentHP(prev => Math.max(0, prev - actualPlayerDamage));
    setPlayerHP(prev => Math.max(0, prev - actualPlayerDamage));

    spawnDamageNumber(Math.floor(actualPlayerDamage), true);
    spawnDamageNumber(Math.floor(actualOpponentDamage), false);

    // Focus accumulation
    if (playerMove === 'focus') {
      setFocusBonus(prev => Math.min(1, prev + 0.2)); // +20% per focus, max 100%
      addLog(`Focus charged! Next Strike will deal +${Math.round(focusBonus * 100)}% damage.`);
    } else if (playerMove === 'strike') {
      setFocusBonus(0); // Reset on strike
    }

    if (opponentMove === 'focus') {
      setOpponentFocusBonus(prev => Math.min(1, prev + 0.2));
    } else if (opponentMove === 'strike') {
      setOpponentFocusBonus(0);
    }

    // Mistral cooldown system
    if (selectedCard.provider === 'MISTRAL') {
      setMoveCooldowns(prev => ({ ...prev, [playerMove]: 1 }));
    }
    if (opponentCard.provider === 'MISTRAL') {
      setMoveCooldowns(prev => ({ ...prev, [opponentMove]: 1 }));
    }

    // Check win condition
    if (opponentHP <= 0) {
      setWinner('player');
      const earned = 200 + turnCount * 50; // Base + turn bonus
      setReward(earned);
      recordBattle('win');
      addLog(`🎉 Victory! You earned ${earned} credits!`);
    } else if (playerHP <= 0) {
      setWinner('opponent');
      const consolation = 50;
      setReward(consolation);
      recordBattle('loss');
      addLog(`💀 Defeat! You earned ${consolation} credits.`);
    } else {
      addLog(`HP: You ${Math.ceil(playerHP)} | Opponent ${Math.ceil(opponentHP)}`);
    }

    setPlayerMove(null);
    setOpponentMove(null);
    setPredictedMove(null);
    setOpponentMovePreview(null);

    // Decrement cooldowns
    setMoveCooldowns(prev => {
      const next = {};
      Object.keys(prev).forEach(key => {
        if (prev[key] > 0) next[key] = prev[key] - 1;
      });
      return next;
    });
  };

  // Auto-opponent thinking and move selection
  useEffect(() => {
    if (battleState === 'battling' && playerMove && !opponentMove) {
      const timer = setTimeout(() => {
        const move = chooseOpponentMove();
        if (move) {
          setOpponentMove(move);
          triggerOpponentAbility(move);

          // Deduct opponent energy
          const moveData = MOVES[move.toUpperCase()];
          setOpponentEnergy(prev => Math.max(0, prev - moveData.energyCost));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [playerMove, opponentMove, battleState]);

  // Auto-resolve when both moves are selected
  useEffect(() => {
    if (playerMove && opponentMove) {
      resolveTurn();
    }
  }, [playerMove, opponentMove]);

  // Energy regeneration each turn
  useEffect(() => {
    if (battleState === 'battling' && !playerMove && !opponentMove && turnCount > 0) {
      const regenTimer = setTimeout(() => {
        setPlayerEnergy(prev => Math.min(100, prev + 25));
        setOpponentEnergy(prev => Math.min(100, prev + 25));
        addLog('Energy regenerated +25⚡');
      }, 1500);
      return () => clearTimeout(regenTimer);
    }
  }, [turnCount, playerMove, opponentMove, battleState]);

  const handlePlayerAbilityCheck = (currentMove) => {
    const triggered = triggerPlayerAbility(currentMove);
    setPlayerAbilityTriggered(triggered);
  };

  const getMoveColor = (move) => {
    switch (move) {
      case 'strike': return 'from-red-500 to-orange-500';
      case 'block': return 'from-blue-500 to-cyan-500';
      case 'focus': return 'from-purple-500 to-pink-500';
      case 'blitz': return 'from-yellow-500 to-amber-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getEnergyColor = (energy) => {
    if (energy > 50) return 'bg-green-500';
    if (energy > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const providerImage = (provider) => PROVIDERS[provider]?.image || null;
  const providerAbility = (provider) => PROVIDERS[provider]?.ability || null;

  const selectOpponent = (card) => {
    // Select opponent from collection (for testing, pick random card of same or lower rarity)
    const eligible = collection.filter(c => c.id !== selectedCard.id);
    if (eligible.length === 0) {
      alert('You need more cards in your collection to battle!');
      return;
    }
    setOpponentCard(card);
    initializeBattle();
  };

  const handleBattleComplete = () => {
    onComplete(reward);
    onBack();
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-6">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => {
            if (battleState === 'battling') {
              if (confirm('Abort battle?')) onBack();
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </motion.button>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent"
        >
          Battle Arena
        </motion.h1>

        <div className="w-24" />
      </header>

      {battleState === 'selecting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-xl font-bold mb-4">Select Your Card</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {collection.slice(0, 9).map(card => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedCard?.id === card.id
                    ? 'border-green-500 bg-green-900/30'
                    : 'border-gray-700 bg-gray-900/60 hover:border-gray-600'
                }`}
              >
                <div className="text-4xl mb-2">{card.providerInfo.icon}</div>
                <div className="font-bold">{card.name}</div>
                <div className="text-sm text-gray-400">{card.version}</div>
                <div className="text-xs text-gray-500">{card.rarity}</div>
              </div>
            ))}
          </div>

          {selectedCard && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3">Select Opponent</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {collection.filter(c => c.id !== selectedCard.id).slice(0, 8).map(card => (
                  <div
                    key={card.id}
                    onClick={() => selectOpponent(card)}
                    className="p-4 rounded-xl border-2 border-gray-700 bg-gray-900/60 hover:border-red-500 hover:bg-red-900/20 cursor-pointer transition-all"
                  >
                    <div className="text-3xl mb-2">{card.providerInfo.icon}</div>
                    <div className="font-bold">{card.name}</div>
                    <div className="text-sm text-gray-400">{card.rarity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCard && opponentCard && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeBattle}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold text-xl shadow-lg"
            >
              Start Battle!
            </motion.button>
          )}
        </motion.div>
      )}

      {battleState === 'battling' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Opponent */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-3xl">
                {opponentCard?.providerInfo.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{opponentCard?.name}</div>
                <div className="text-sm text-gray-400">{opponentCard?.provider}</div>
                {providerAbility(opponentCard?.provider) && (
                  <div className="text-xs text-yellow-400 mt-1">
                    Ability: {providerAbility(opponentCard?.provider).name}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">{Math.ceil(opponentHP)}</div>
                <div className="text-sm text-gray-400">HP</div>
              </div>
            </div>

            {/* Opponent Energy Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Opponent Energy</span>
                <span>{Math.ceil(opponentEnergy)}/100⚡</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getEnergyColor(opponentEnergy)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${opponentEnergy}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Opponent Move Preview */}
            {opponentMovePreview && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-xl text-center"
              >
                <div className="text-yellow-400 text-sm font-bold">Claude predicts opponent will use:</div>
                <div className="text-yellow-200 text-lg">{opponentMovePreview.toUpperCase()}</div>
              </motion.div>
            )}

            {/* Opponent Active Effects */}
            {(Object.keys(opponentBuffs).length > 0 || opponentFocusBonus > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(opponentBuffs).map(([buff, value]) => (
                  <span key={buff} className="px-2 py-1 bg-purple-900/50 text-purple-200 text-xs rounded-full">
                    {buff} +{Math.round(value * 100)}%
                  </span>
                ))}
                {opponentFocusBonus > 0 && (
                  <span className="px-2 py-1 bg-blue-900/50 text-blue-200 text-xs rounded-full">
                    Focus +{Math.round(opponentFocusBonus * 100)}%
                  </span>
                )}
                {moveCooldowns && Object.entries(moveCooldowns).filter(([_, cd]) => cd > 0).map(([move, cd]) => (
                  <span key={move} className="px-2 py-1 bg-red-900/50 text-red-200 text-xs rounded-full">
                    {move.toUpperCase()} {cd}t cooldown
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* VS */}
          <div className="text-center text-3xl font-bold text-gray-500">⚔️</div>

          {/* Player */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-3xl">
                {selectedCard?.providerInfo.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{selectedCard?.name}</div>
                <div className="text-sm text-gray-400">{selectedCard?.provider}</div>
                {providerAbility(selectedCard?.provider) && (
                  <div className="text-xs text-yellow-400 mt-1">
                    Ability: {providerAbility(selectedCard?.provider).name}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">{Math.ceil(playerHP)}</div>
                <div className="text-sm text-gray-400">HP</div>
              </div>
            </div>

            {/* Player Energy Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Your Energy</span>
                <span>{Math.ceil(playerEnergy)}/100⚡</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getEnergyColor(playerEnergy)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${playerEnergy}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Player Active Effects */}
            {(Object.keys(playerBuffs).length > 0 || focusBonus > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(playerBuffs).map(([buff, value]) => (
                  <span key={buff} className="px-2 py-1 bg-purple-900/50 text-purple-200 text-xs rounded-full">
                    {buff} +{Math.round(value * 100)}%
                  </span>
                ))}
                {focusBonus > 0 && (
                  <span className="px-2 py-1 bg-blue-900/50 text-blue-200 text-xs rounded-full">
                    Focus +{Math.round(focusBonus * 100)}%
                  </span>
                )}
                {moveCooldowns && Object.entries(moveCooldowns).filter(([_, cd]) => cd > 0).map(([move, cd]) => (
                  <span key={move} className="px-2 py-1 bg-red-900/50 text-red-200 text-xs rounded-full">
                    {move.toUpperCase()} {cd}t cooldown
                  </span>
                ))}
              </div>
            )}

            {/* Move Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {Object.values(MOVES).map(move => {
                const Icon = MOVE_ICONS[move.id];
                const canAfford = playerEnergy >= move.energyCost;
                const onCooldown = moveCooldowns[move.id] > 0;
                const disabled = !canAfford || onCooldown || playerMove;

                return (
                  <motion.button
                    key={move.id}
                    whileHover={{ scale: disabled ? 1 : 1.02 }}
                    whileTap={{ scale: disabled ? 1 : 0.98 }}
                    onClick={() => handlePlayerMove(move.id)}
                    disabled={disabled}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      disabled
                        ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                        : `bg-gradient-to-r ${getMoveColor(move.id)} border-opacity-50 text-white`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <div className="text-left">
                        <div className="font-bold">{move.name}</div>
                        <div className="text-xs opacity-80">{move.energyCost}⚡</div>
                      </div>
                    </div>
                    {onCooldown && (
                      <div className="absolute inset-0 bg-red-900/50 rounded-xl flex items-center justify-center">
                        <span className="font-bold">Cooldown {moveCooldowns[move.id]}t</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Player Selected Move */}
            {playerMove && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-xl text-center"
              >
                <div className="text-blue-400 text-sm">You selected:</div>
                <div className="text-blue-200 text-xl font-bold">{playerMove.toUpperCase()}</div>
              </motion.div>
            )}
          </motion.div>

          {/* Battle Log */}
          <div className="bg-gray-900/60 backdrop-blur rounded-2xl p-4 border border-gray-700/50 max-h-40 overflow-y-auto">
            {battleLog.map((log, idx) => (
              <div key={idx} className="text-sm text-gray-300 mb-1">{log}</div>
            ))}
          </div>

          {/* Turn Counter */}
          <div className="text-center text-gray-400">
            Turn {turnCount} / 15
          </div>
        </motion.div>
      )}

      {/* Result */}
      {battleState === 'battling' && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 text-center"
          >
            {winner === 'player' ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-6xl mb-4">🏆</motion.div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">Victory!</h2>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-6xl mb-4">💀</motion.div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">Defeat</h2>
              </>
            )}

            <p className="text-gray-300 mb-6">
              {winner === 'player'
                ? `You defeated ${opponentCard.name}!`
                : `${opponentCard.name} was too strong...`
              }
            </p>

            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-400 mb-1">Reward</div>
              <div className="text-3xl font-bold text-yellow-400">+{reward} credits</div>
            </div>

            <button
              onClick={handleBattleComplete}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Damage Numbers Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {damageNumbers.map(dn => (
            <motion.div
              key={dn.id}
              initial={{ opacity: 1, y: 0, x: dn.isPlayer ? '40%' : '60%' }}
              animate={{ opacity: 0, y: -100 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className={`absolute text-4xl font-bold ${dn.isPlayer ? 'text-red-500' : 'text-green-500'}`}
              style={{ top: '40%' }}
            >
              -{dn.value}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

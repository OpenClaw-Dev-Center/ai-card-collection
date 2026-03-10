import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, Coins, Heart } from 'lucide-react';
import { CARD_POOL, RARITIES, MOVES, calculateHP } from '../data/cards';

export function GameMode({ user, currency, onComplete, onBack }) {
  const [collection, setCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [battleState, setBattleState] = useState('setup'); // 'setup', 'selecting', 'resolving', 'ended'
  const [playerHP, setPlayerHP] = useState(0);
  const [opponentHP, setOpponentHP] = useState(0);
  const [maxHP, setMaxHP] = useState(200);
  const [playerMove, setPlayerMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);
  const [playerBonus, setPlayerBonus] = useState(0);
  const [opponentBonus, setOpponentBonus] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [turn, setTurn] = useState(1);
  const [maxTurns] = useState(10);
  const [winner, setWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState([]);

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

    setBattleState('selecting');
    setTurn(1);
    setBattleLog([{ turn: 1, text: `Battle start! ${selectedCard.name} vs ${opponent.name}` }]);
    setWinner(null);
    setPlayerBonus(0);
    setOpponentBonus(0);
    setDamageNumbers([]);
  };

  const chooseOpponentMove = () => {
    if (!opponentCard) return MOVES.STRIKE;
    const r = Math.random();
    // If opponent HP low, increase block chance
    const blockThreshold = 0.2 + (1 - opponentHP / maxHP) * 0.5;
    if (r < blockThreshold) return MOVES.BLOCK;

    const { power, speed, intelligence, creativity } = opponentCard.stats;
    const total = power + speed + intelligence + creativity;
    const pStrike = power / total;
    const pBlitz = creativity / total;
    const pFocus = intelligence / total;

    const r2 = Math.random();
    if (r2 < pStrike) return MOVES.STRIKE;
    if (r2 < pStrike + pBlitz) return MOVES.BLITZ;
    return MOVES.FOCUS;
  };

  const calculateDamage = (move, attacker, defender, defenderMove) => {
    if (move.id === 'focus') return 0;

    let base;
    if (move.id === 'strike') {
      base = attacker.stats.power * move.damageFactor;
    } else if (move.id === 'blitz') {
      base = attacker.stats.creativity * move.damageFactor;
    } else {
      return 0;
    }

    const bonusMultiplier = (attacker === selectedCard ? playerBonus : opponentBonus);
    base *= (1 + bonusMultiplier);

    if (defenderMove && defenderMove.id === 'block') {
      let reduction = MOVES.BLOCK.defenseReduction;
      if (move.defensePenetration) {
        reduction *= (1 - move.defensePenetration);
      }
      base *= (1 - reduction);
    }

    return Math.max(1, Math.floor(base));
  };

  const handleMoveSelect = (move) => {
    if (battleState !== 'selecting' || isProcessing) return;

    setIsProcessing(true);
    setPlayerMove(move);

    const oppMove = chooseOpponentMove();
    setOpponentMove(oppMove);

    setTimeout(() => {
      resolveTurn(move, oppMove);
    }, 300);
  };

  const resolveTurn = (pMove, oMove) => {
    const newOpponentHP = Math.max(0, opponentHP - calculateDamage(pMove, selectedCard, opponentCard, oMove));
    const newPlayerHP = Math.max(0, playerHP - calculateDamage(oMove, opponentCard, selectedCard, pMove));

    const newLog = [...battleLog];
    const currentTurnNum = turn;

    // Player action
    if (pMove.id === 'strike' || pMove.id === 'blitz') {
      const dmg = opponentHP - newOpponentHP;
      newLog.push({
        turn: currentTurnNum,
        text: `You used ${pMove.name}! Dealt ${dmg} damage.`,
        damage: dmg,
        isPlayer: true
      });
      setPlayerBonus(0);
    } else if (pMove.id === 'focus') {
      newLog.push({
        turn: currentTurnNum,
        text: `You used ${pMove.name}. Next strike empowered!`,
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

    setPlayerHP(newPlayerHP);
    setOpponentHP(newOpponentHP);
    setBattleLog(newLog);

    const damages = [];
    const pDmg = opponentHP - newOpponentHP;
    const oDmg = playerHP - newPlayerHP;
    if (pDmg > 0) damages.push({ target: 'opponent', value: pDmg, x: '60%', y: '30%' });
    if (oDmg > 0) damages.push({ target: 'player', value: oDmg, x: '40%', y: '70%' });
    setDamageNumbers(damages);

    // Check win conditions
    if (newPlayerHP <= 0) {
      setBattleState('ended');
      setWinner('opponent');
      setTimeout(() => finishBattle(50), 2000);
    } else if (newOpponentHP <= 0) {
      setBattleState('ended');
      setWinner('player');
      const reward = 200 + (currentTurnNum * 50) + (Math.random() > 0.7 ? 300 : 0);
      setTimeout(() => finishBattle(reward), 2000);
    } else if (currentTurnNum >= maxTurns) {
      setBattleState('ended');
      if (newPlayerHP > newOpponentHP) {
        setWinner('player');
        setTimeout(() => finishBattle(150), 2000);
      } else if (newOpponentHP > newPlayerHP) {
        setWinner('opponent');
        setTimeout(() => finishBattle(50), 2000);
      } else {
        setWinner('draw');
        setTimeout(() => finishBattle(100), 2000);
      }
    } else {
      setTimeout(() => {
        setTurn(prev => prev + 1);
        setPlayerMove(null);
        setOpponentMove(null);
        setIsProcessing(false);
      }, 500);
    }
  };

  const finishBattle = (reward) => {
    // Increment playtime by 0.1 hours (~6 minutes) per completed battle
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[user]) {
      users[user].playtimeHours = (users[user].playtimeHours || 0) + 0.1;
      localStorage.setItem('users', JSON.stringify(users));
    }
    onComplete(reward);
  };

  const getMoveStyle = (move) => {
    const base = "w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all";
    if (move.id === 'strike') return `${base} bg-red-900/50 border-2 border-red-500 hover:bg-red-800/70`;
    if (move.id === 'block') return `${base} bg-blue-900/50 border-2 border-blue-500 hover:bg-blue-800/70`;
    if (move.id === 'focus') return `${base} bg-purple-900/50 border-2 border-purple-500 hover:bg-purple-800/70`;
    if (move.id === 'blitz') return `${base} bg-cyan-900/50 border-2 border-cyan-500 hover:bg-cyan-800/70`;
    return base;
  };

  const MoveButton = ({ move, disabled }) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      disabled={disabled}
      className={getMoveStyle(move)}
      onClick={() => handleMoveSelect(move)}
    >
      <div className="text-center">
        <div className="text-2xl mb-1">{move.icon}</div>
        <div className="text-xs font-medium">{move.name}</div>
        <div className="text-[10px] text-gray-400 mt-1 capitalize">{move.stat}</div>
      </div>
    </motion.button>
  );

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
            className="absolute text-4xl font-bold pointer-events-none"
            style={{ left: dmg.x, top: dmg.y }}
          >
            <span className={dmg.target === 'player' ? 'text-red-500' : 'text-green-500'}>
              -{dmg.value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
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

        <div className="flex items-center gap-2 text-yellow-400">
          <Coins className="w-5 h-5" />
          <span className="font-bold">{currency.toLocaleString()}</span>
        </div>
      </header>

      {/* Battle Stage */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player side */}
        <div className="lg:col-span-1 space-y-6">
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
                {/* Card preview */}
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2"
                  style={{ borderColor: selectedCard.rarityInfo.color }}>
                  <img src={selectedCard.image} alt={selectedCard.name} className="w-full h-full object-cover" />
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

                {/* Bonus indicator */}
                {playerBonus > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-center text-purple-400 text-sm font-bold"
                  >
                    🔮 Power Up: +{Math.round(playerBonus*100)}%
                  </motion.div>
                )}

                {/* Card switcher (only before battle) */}
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
            <div className="mb-8 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-48 aspect-[3/4] rounded-xl overflow-hidden border-2 border-red-500/50"
              >
                <img src={opponentCard?.image || ''} alt={opponentCard?.name} className="w-full h-full object-cover" />
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
                className="self-center mb-6 px-6 py-3 bg-gray-800/80 rounded-xl text-center border border-yellow-500/30"
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
                    {winner === 'player' ? 'You triumphed!' : winner === 'opponent' ? 'You were defeated...' : 'It\'s a tie!'}
                  </p>
                  <p className="text-yellow-400 font-bold animate-pulse">
                    Returning to dashboard...
                  </p>
                </div>
              </motion.div>
            )}

            {/* Battle log */}
            <div className="mt-6 flex-1 bg-gray-800/50 rounded-xl p-4 overflow-y-auto max-h-64">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Battle Log</h3>
              <div className="space-y-1 text-sm">
                <AnimatePresence>
                  {battleLog.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-2 ${log.isPlayer ? 'text-blue-300' : 'text-red-300'} ${log.damage ? 'font-bold' : ''}`}
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
      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.values(MOVES).map(move => (
          <div key={move.id} className="p-3 bg-gray-800/50 rounded-xl text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{move.icon}</span>
              <span className="font-bold">{move.name}</span>
            </div>
            <div className="text-xs text-gray-400">{move.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
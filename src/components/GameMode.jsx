import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Shield, Brain, Lightbulb, Swords, Trophy, Star, Coins } from 'lucide-react';
import { CARD_POOL, RARITIES } from '../data/cards';

export function GameMode({ user, currency, onComplete, onBack }) {
  const [collection, setCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [battleState, setBattleState] = useState('setup'); // setup, playing, result
  const [opponentCard, setOpponentCard] = useState(null);
  const [result, setResult] = useState(null);
  const [wins, setWins] = useState(0);
  const [damage, setDamage] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [battleLog, setBattleLog] = useState([]);

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
      // Fallback opponent
      return CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    }
    const randomIdx = Math.floor(Math.random() * collection.length);
    return collection[randomIdx];
  };

  const startBattle = () => {
    if (!selectedCard || collection.length === 0) {
      alert('You need at least one card in your collection to battle!');
      return;
    }

    const opponent = getRandomOpponent();
    setOpponentCard(opponent);
    setBattleState('playing');
    setBattleLog([
      { round: 1, text: `Battle started! Your ${selectedCard.name} vs ${opponent.name}` }
    ]);
  };

  const resolveRound = (statType) => {
    const playerStat = selectedCard.stats[statType];
    const opponentStat = opponentCard.stats[statType];

    const playerTotal = playerStat + (Math.random() * 10 - 5);
    const opponentTotal = opponentStat + (Math.random() * 10 - 5);
    const playerWins = playerTotal > opponentTotal;
    const damageDealt = Math.max(1, Math.floor(playerTotal - opponentTotal));
    const damageTaken = Math.max(1, Math.floor(opponentTotal - playerTotal));

    setDamage(prev => prev + (playerWins ? 0 : damageTaken));

    const roundNum = battleLog.length;
    setBattleLog(prev => [...prev, {
      round: roundNum + 1,
      text: `${statType.toUpperCase()}: Your ${playerStat.toFixed(0)} vs Opponent ${opponentStat.toFixed(0)} → ${playerWins ? 'You win!' : 'Opponent wins!'}`,
      damage: playerWins ? 0 : damageTaken
    }]);

    if (roundNum >= 3) {
      // Battle ends after 3 rounds
      const playerScore = battleLog.filter(l => l.text.includes('You win!')).length + (playerWins ? 1 : 0);
      const opponentScore = 3 - playerScore;

      setBattleState('result');
      setResult(playerScore > opponentScore ? 'win' : 'loss');

      if (playerScore > opponentScore) {
        setWins(prev => prev + 1);
        const reward = 200 + (currentRound * 100) + (Math.random() > 0.5 ? 500 : 0);
        onComplete(reward);
        setBattleLog(prev => [...prev, { round: 5, text: `VICTORY! You earned ${reward} credits!`, isReward: true }]);
      } else {
        const consolation = 50;
        onComplete(consolation);
        setBattleLog(prev => [...prev, { round: 5, text: `Defeat... You earned ${consolation} consolation credits.`, isReward: false }]);
      }
    }
  };

  const nextRound = () => {
    if (battleState === 'result') {
      // Start new battle
      setCurrentRound(prev => prev + 1);
      setBattleState('setup');
      setOpponentCard(null);
      setResult(null);
      setDamage(0);
      setBattleLog([]);
    } else if (battleState === 'playing') {
      // Auto-resolve with lowest stat? No, wait for player
    }
  };

  const getStatIcon = (stat) => {
    switch (stat) {
      case 'power': return <Zap className="w-4 h-4" />;
      case 'speed': return <Shield className="w-4 h-4" />;
      case 'intelligence': return <Brain className="w-4 h-4" />;
      case 'creativity': return <Lightbulb className="w-4 h-4" />;
      default: return null;
    }
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
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8">
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
          <p className="text-sm text-gray-400">Round {currentRound} • Wins: {wins}</p>
        </motion.div>

        <div className="flex items-center gap-2 text-yellow-400">
          <Coins className="w-5 h-5" />
          <span className="font-bold">{currency.toLocaleString()}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Your Card
            </h2>

            {selectedCard && (
              <div className="space-y-4">
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

                {/* Stats */}
                <div className="space-y-2 bg-gray-800/50 rounded-xl p-4">
                  {Object.entries(selectedCard.stats).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      {getStatIcon(key)}
                      <span className="text-sm text-gray-400 capitalize w-24">{key}</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${val}%`,
                            background: `linear-gradient(90deg, ${selectedCard.rarityInfo.color}, ${selectedCard.providerInfo.color})`
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Choose different card */}
                {collection.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Switch Card:</h4>
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
              </div>
            )}
          </motion.div>
        </div>

        {/* Battle Area */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700 h-full flex flex-col"
          >
            {/* Opponent */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-400" />
                Opponent
              </h2>
              {opponentCard ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative w-48 aspect-[3/4] mx-auto rounded-xl overflow-hidden border-2 border-red-500/50"
                >
                  <img src={opponentCard.image} alt={opponentCard.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
                    <h3 className="font-bold">{opponentCard.name}</h3>
                    <p className="text-sm text-gray-300">v{opponentCard.version}</p>
                  </div>
                </motion.div>
              ) : (
                <div className="w-48 aspect-[3/4] mx-auto bg-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-600">
                  <span className="text-gray-500">???</span>
                </div>
              )}
            </div>

            {/* Battle controls */}
            {battleState === 'setup' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startBattle}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold text-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Swords className="w-6 h-6" />
                Start Battle!
              </motion.button>
            )}

            {battleState === 'playing' && (
              <div className="space-y-4">
                <p className="text-center text-gray-400">Choose a stat to compete with!</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(selectedCard.stats).map(stat => (
                    <motion.button
                      key={stat}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => resolveRound(stat)}
                      disabled={battleState === 'result'}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-600 flex items-center gap-3 transition-all"
                    >
                      {getStatIcon(stat)}
                      <span className="font-bold capitalize">{stat}</span>
                      <span className="ml-auto text-lg" style={{ color: selectedCard.rarityInfo.color }}>
                        {selectedCard.stats[stat]}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {battleState === 'result' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className={`text-4xl font-bold ${result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                  {result === 'win' ? '🏆 VICTORY!' : '💀 DEFEAT'}
                </div>
                <p className="text-gray-300">
                  {result === 'win'
                    ? `You defeated ${opponentCard.name}!`
                    : `${opponentCard.name} was too strong...`
                  }
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextRound}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold"
                >
                  {currentRound < 5 ? 'Next Battle' : 'Finish'}
                </motion.button>
              </motion.div>
            )}

            {/* Battle log */}
            <div className="mt-6 flex-1 bg-gray-800/50 rounded-xl p-4 overflow-y-auto max-h-48">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Battle Log</h3>
              <div className="space-y-1 text-sm">
                {battleLog.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center gap-2 ${log.isReward ? 'text-green-400 font-bold' : 'text-gray-300'}`}
                  >
                    <span className="text-gray-500">[{log.round}]</span>
                    <span>{log.text}</span>
                    {log.damage > 0 && (
                      <span className="text-red-400 ml-auto">-{log.damage} HP</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Star, Zap } from 'lucide-react';
import { CARD_POOL, RARITIES, PACK_TYPES } from '../data/cards';

export function PackOpening({ pack, onComplete, user }) {
  const [cards, setCards] = useState([]);
  const [isOpening, setIsOpening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [speed, setSpeed] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    // Generate random cards based on pack probabilities
    const generated = [];
    for (let i = 0; i < pack.cards; i++) {
      let card;
      let attempts = 0;
      do {
        // Get random card from pool
        const randomIdx = Math.floor(Math.random() * CARD_POOL.length);
        card = { ...CARD_POOL[randomIdx] };

        // Replace with a new ID instance
        card.id = `${card.baseId}-${Date.now()}-${i}`;
        attempts++;
      } while (attempts < 100 && !isValidCard(card, pack.guaranteedRarity, i === 0));

      generated.push(card);
    }

    // Sort by rarity for reveal order
    const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
    generated.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);

    setCards(generated);

    // Start opening animation after a short delay
    const timer = setTimeout(() => {
      setIsOpening(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [pack]);

  const isValidCard = (card, guaranteedRarity, isGuaranteedSlot) => {
    if (isGuaranteedSlot) {
      const rarityValue = RARITIES[card.rarity].probability;
      const guaranteedValue = RARITIES[guaranteedRarity].probability;
      return rarityValue >= guaranteedValue;
    }
    return true;
  };

  const handleCardClick = (index) => {
    if (isOpening) return;
    setSelectedIndex(index);
  };

  const revealAll = () => {
    setSpeed(1);
    setShowResult(true);
    onComplete(cards);
  };

  // Card reveal animation with shimmer effect
  const CardReveal = ({ card, index, isRevealed }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{
        opacity: isRevealed ? 1 : 0.3,
        scale: isRevealed ? 1 : 0.85,
        y: isRevealed ? 0 : 20
      }}
      transition={{
        duration: 0.6,
        delay: index * (0.1 / speed),
        type: 'spring',
        stiffness: 300
      }}
      style={{ transformStyle: 'preserve-3d' }}
      className="relative w-48 h-64 md:w-56 md:h-80 cursor-pointer"
      onClick={() => !isOpening && handleCardClick(index)}
    >
      {/* Card frame */}
      <div
        className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${
          isRevealed ? 'ring-2 ring-yellow-400/50' : ''
        }`}
        style={{
          background: `linear-gradient(135deg, ${card.rarityInfo.color}20 0%, rgba(15, 15, 35, 0.95) 100%)`,
          borderColor: card.rarityInfo.color,
          boxShadow: isRevealed
            ? `0 0 30px ${RARITIES[card.rarity].glow}60, inset 0 0 30px rgba(0,0,0,0.4)`
            : `0 0 15px rgba(0,0,0,0.5)`,
          transform: isRevealed ? 'scale(1)' : 'scale(0.92)'
        }}
      >
        {/* Card content (blurred if not revealed) */}
        <div className="w-full h-full relative">
          <img
            src={card.image}
            alt={card.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isRevealed ? 'opacity-100' : 'opacity-50 blur-sm'
            }`}
          />

          {/* Overlay gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)`
            }}
          />

          {/* Card info (hidden until reveal) */}
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-4"
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-1">{card.name}</h3>
                  <div className="flex items-center justify-center gap-2 text-sm mb-2">
                    <span>{card.provider}</span>
                    <span>•</span>
                    <span style={{ color: card.rarityInfo.color }}>v{card.version}</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: card.rarityInfo.color,
                      color: 'white'
                    }}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    {card.rarityInfo.name}
                  </div>
                </div>

                {/* Rarity glow animation for rare+ cards */}
                {(card.rarity === 'EPIC' || card.rarity === 'LEGENDARY' || card.rarity === 'MYTHIC') && (
                  <motion.div
                    animate={{
                      boxShadow: [
                        `0 0 10px ${card.rarityInfo.color}`,
                        `0 0 25px ${card.rarityInfo.color}`,
                        `0 0 10px ${card.rarityInfo.color}`
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ boxShadow: `inset 0 0 20px ${card.rarityInfo.color}80` }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Not revealed placeholder */}
          {!isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full animate-pulse" />
            </div>
          )}

          {/* Selected card highlight */}
          {selectedIndex === index && isRevealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-2xl pointer-events-none"
            />
          )}
        </div>

        {/* Shimmer effect on rare+ */}
        {isRevealed && card.rarity !== 'COMMON' && (
          <div className="card-shine absolute inset-0 pointer-events-none" />
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" ref={containerRef}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
          Opening {pack.name}!
        </h1>
        <p className="text-gray-400">
          {isOpening ? 'Revealing cards...' : 'Prepare for surprises...'}
        </p>
      </motion.div>

      {/* Cards container */}
      <div className="mb-8 flex flex-wrap justify-center gap-4 md:gap-6 max-w-6xl">
        {cards.map((card, index) => (
          <CardReveal
            key={card.id}
            card={card}
            index={index}
            isRevealed={showResult || selectedIndex === index}
          />
        ))}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4"
      >
        {!isOpening ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpening(true)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold shadow-lg flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Start Reveal
          </motion.button>
        ) : !showResult ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={revealAll}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold shadow-lg flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Reveal All ({pack.cards})
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onComplete(cards)}
            className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-bold shadow-lg flex items-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Done ({cards.length} Cards)
          </motion.button>
        )}
      </motion.div>

      {/* Rarity stats */}
      {cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 grid grid-cols-5 gap-2 w-full max-w-2xl"
        >
          {Object.entries(RARITIES).map(([key, rarity]) => {
            const count = cards.filter(c => c.rarity === key).length;
            return (
              <div
                key={key}
                className="text-center p-2 rounded-lg"
                style={{ backgroundColor: `${rarity.color}20` }}
              >
                <div className="text-xs text-gray-400">{rarity.name}</div>
                <div className="font-bold" style={{ color: rarity.color }}>{count}</div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Particle effects for mythic/legendary pulls */}
      {(showResult || selectedIndex !== null) && cards.some(c => c.rarity === 'MYTHIC' || c.rarity === 'LEGENDARY') && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {cards.filter(c => c.rarity === 'MYTHIC' || c.rarity === 'LEGENDARY').map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ x: '50%', y: '50%', scale: 0 }}
              animate={{
                x: ['50%', `${20 + idx * 10}%`, `${80 - idx * 10}%`],
                y: ['50%', `${20 + idx * 5}%`],
                scale: [0, 1, 0.5],
                opacity: [1, 0.8, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: card.rarityInfo.color, boxShadow: `0 0 20px ${card.rarityInfo.color}` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

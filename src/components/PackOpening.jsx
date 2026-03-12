import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Star, Zap } from 'lucide-react';
import { CARD_POOL, RARITIES, PACK_TYPES, PRESTIGE_CRYSTAL_VALUES, VERSION_PROGRESSION, getTotalDupesNeededToMax } from '../data/cards';

// ── Rarity-weighted card picker ──────────────────────────────────────────────
function pickCard(pack, slotIndex) {
  const overrides = pack.probabilityOverrides;
  const rarityKeys = Object.keys(overrides);
  const rand = Math.random();
  let cumulative = 0;
  let chosenRarity = rarityKeys[rarityKeys.length - 1];
  for (const key of rarityKeys) {
    cumulative += overrides[key];
    if (rand <= cumulative) { chosenRarity = key; break; }
  }
  // Slot 0 must meet guaranteed rarity floor
  if (slotIndex === 0) {
    const rarityOrder = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, MYTHIC: 4 };
    if (rarityOrder[chosenRarity] < rarityOrder[pack.guaranteedRarity]) {
      chosenRarity = pack.guaranteedRarity;
    }
  }
  const pool = CARD_POOL.filter(c => {
    if (c.rarity !== chosenRarity) return false;
    if (pack.providerFilter && pack.providerFilter.length > 0) {
      return pack.providerFilter.includes(c.provider);
    }
    return true;
  });
  // Fallback to full rarity pool if providerFilter yields nothing
  const finalPool = pool.length > 0 ? pool : CARD_POOL.filter(c => c.rarity === chosenRarity);
  const base = finalPool[Math.floor(Math.random() * finalPool.length)];
  return { ...base, id: `${base.baseId}-${Date.now()}-${slotIndex}` };
}

// ── Cinematic Legendary / Mythic reveal overlay ───────────────────────────────
function CinematicReveal({ card, onDone }) {
  const isMythic = card.rarity === 'MYTHIC';
  const color = card.rarityInfo.color;
  const beamCount = isMythic ? 16 : 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: `radial-gradient(ellipse at center, ${color}22 0%, #000000ee 70%)` }}
    >
      {/* Rotating light beams */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: isMythic ? 4 : 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {Array.from({ length: beamCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 origin-bottom"
            style={{
              height: '55vh',
              bottom: '50%',
              left: '50%',
              transform: `rotate(${(i / beamCount) * 360}deg) translateX(-50%)`,
              background: `linear-gradient(to top, ${color}80, transparent)`,
              opacity: 0.6
            }}
          />
        ))}
      </motion.div>

      {/* Floating particle ring */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const r = 160 + Math.random() * 60;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(angle) * r,
              y: Math.sin(angle) * r,
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0]
            }}
            transition={{ duration: 1.8, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
        );
      })}

      {/* Card itself */}
      <motion.div
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 14 }}
        className="relative z-10 w-52 h-72 rounded-2xl overflow-hidden border-4 shadow-2xl flex flex-col items-center justify-between"
        style={{
          borderColor: color,
          boxShadow: `0 0 60px ${color}80, 0 0 120px ${color}40`,
          background: `linear-gradient(135deg, ${color}30 0%, #0f0f23 100%)`
        }}
      >
        {/* Icon */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-8xl drop-shadow-lg">{card.providerInfo.icon}</span>
        </div>
        {/* Stats */}
        <div className="px-4 pb-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-300 w-full">
          <span>💥 {card.stats.power}</span>
          <span>⚡ {card.stats.speed}</span>
          <span>🧠 {card.stats.intelligence}</span>
          <span>✨ {card.stats.creativity}</span>
        </div>
        {/* Name / rarity */}
        <div className="p-4 text-center w-full" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="font-black text-xl text-white drop-shadow-lg">{card.name}</div>
          <div className="text-sm opacity-80">{card.provider} · v{card.version}</div>
          <div className="mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-black" style={{ background: color }}>
            {isMythic ? '✦ MYTHIC ✦' : '★ LEGENDARY ★'}
          </div>
        </div>
        {/* Shimmer */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.2, delay: 0.8, repeat: Infinity, repeatDelay: 2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(105deg, transparent 40%, ${color}50 50%, transparent 60%)` }}
        />
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-1/4 text-center px-4"
      >
        <motion.p
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-3xl font-black tracking-widest uppercase"
          style={{ color, textShadow: `0 0 30px ${color}` }}
        >
          {isMythic ? '✦ MYTHIC PULL! ✦' : '★ LEGENDARY! ★'}
        </motion.p>
      </motion.div>

      {/* Skip / continue */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onDone}
        className="absolute bottom-8 px-10 py-3 rounded-full font-bold text-lg text-black"
        style={{ background: color }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}

export function PackOpening({ pack, onComplete, user }) {
  const [cards, setCards] = useState([]);
  const [isOpening, setIsOpening] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [speed, setSpeed] = useState(1);
  // Cinematic reveal queue: indices of legendary/mythic cards waiting to be shown
  const [cinematicQueue, setCinematicQueue] = useState([]);
  const [currentCinematic, setCurrentCinematic] = useState(null); // card object
  // Prestige conversion tracking
  const [convertedIndices, setConvertedIndices] = useState(new Set());
  const [totalPrestigeCrystals, setTotalPrestigeCrystals] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const generated = [];
    for (let i = 0; i < pack.cards; i++) {
      generated.push(pickCard(pack, i));
    }
    // Sort by rarity for reveal order
    const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
    generated.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
    setCards(generated);
    const timer = setTimeout(() => setIsOpening(true), 500);
    return () => clearTimeout(timer);
  }, [pack]);

  const handleCardClick = (index) => {
    if (isOpening) return;
    setSelectedIndex(index);
  };

  const revealAll = () => {
    setSpeed(1);
    setShowResult(true);

    // Check which pulled cards would be excess (player already has enough to fully max out)
    const key = user ? (typeof user === 'string' ? user : (user.id || user.username)) : null;
    const collection = key ? JSON.parse(localStorage.getItem(`collection_${key}`) || '[]') : [];
    let crystals = 0;
    const converted = new Set();
    cards.forEach((card, i) => {
      const sameCopies = collection.filter(
        c => c.baseId === card.baseId && c.rarity === card.rarity
      );
      // Already owns a maxed copy
      const hasMaxedCopy = sameCopies.some(c => !VERSION_PROGRESSION[c.version]);
      // Has enough dupes to fully upgrade the best copy to max (dupes = copies - 1)
      const hasEnoughToMax = sameCopies.length > 0 && (() => {
        // Find the copy closest to max (fewest upgrades remaining)
        let minNeeded = Infinity;
        sameCopies.forEach(c => {
          const needed = getTotalDupesNeededToMax(c);
          if (needed < minNeeded) minNeeded = needed;
        });
        // Available dupes = all same copies (the pulled card counts as an extra)
        return (sameCopies.length) >= minNeeded;
      })();
      if (hasMaxedCopy || hasEnoughToMax) {
        converted.add(i);
        crystals += PRESTIGE_CRYSTAL_VALUES[card.rarity] || 0;
      }
    });
    setConvertedIndices(converted);
    setTotalPrestigeCrystals(crystals);

    // Queue cinematic reveals only for non-converted legendary/mythic
    const queue = cards
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card, index }) => !converted.has(index) && (card.rarity === 'LEGENDARY' || card.rarity === 'MYTHIC'));
    if (queue.length > 0) {
      setCinematicQueue(queue.map(q => q.card));
      setCurrentCinematic(queue[0].card);
    }
  };

  const advanceCinematic = () => {
    const next = cinematicQueue.slice(1);
    setCinematicQueue(next);
    setCurrentCinematic(next.length > 0 ? next[0] : null);
  };

  const handleDone = () => {
    const keptCards = cards.filter((_, i) => !convertedIndices.has(i));
    onComplete(keptCards, totalPrestigeCrystals);
  };

  // Card reveal component ──────────────────────────────────────────────────────
  const CardReveal = ({ card, index, isRevealed, isConverted, crystalAmount }) => {
    const isSpecial = card.rarity === 'LEGENDARY' || card.rarity === 'MYTHIC';

    // Prestige tile — shown when a maxed copy was already owned
    if (isConverted && isRevealed) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * (0.1 / speed), type: 'spring', stiffness: 300 }}
          className="relative w-48 h-64 md:w-56 md:h-80"
        >
          <div
            className="w-full h-full rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center gap-2 text-center p-4"
            style={{
              background: 'linear-gradient(135deg, #4c1d9530 0%, #1e1b4b 100%)',
              borderColor: '#818cf8',
              boxShadow: '0 0 30px #818cf860, inset 0 0 20px rgba(0,0,0,0.4)'
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl"
            >💎</motion.div>
            <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Prestige</div>
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-2xl font-black text-white"
            >+{crystalAmount}</motion.div>
            <div className="text-indigo-400 text-xs">Crystals</div>
            <div
              className="mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: card.rarityInfo.color + '30', color: card.rarityInfo.color, border: `1px solid ${card.rarityInfo.color}50` }}
            >
              {card.rarityInfo.name} maxed
            </div>
            <div className="text-xs text-gray-500">{card.name}</div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: isRevealed ? 1 : 0.3, scale: isRevealed ? 1 : 0.85, y: isRevealed ? 0 : 20 }}
        transition={{ duration: 0.6, delay: index * (0.1 / speed), type: 'spring', stiffness: 300 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-48 h-64 md:w-56 md:h-80 cursor-pointer"
        onClick={() => !isOpening && handleCardClick(index)}
      >
        <div
          className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${isRevealed ? 'ring-2 ring-yellow-400/50' : ''}`}
          style={{
            background: `linear-gradient(135deg, ${card.rarityInfo.color}20 0%, rgba(15, 15, 35, 0.95) 100%)`,
            borderColor: card.rarityInfo.color,
            boxShadow: isRevealed
              ? `0 0 30px ${RARITIES[card.rarity].glow}60, inset 0 0 30px rgba(0,0,0,0.4)`
              : `0 0 15px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="w-full h-full relative flex flex-col">
            {/* Icon area */}
            <div className="flex-1 flex items-center justify-center">
              {isRevealed
                ? <span className="text-6xl drop-shadow-lg">{card.providerInfo.icon}</span>
                : <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full animate-pulse" />
              }
            </div>
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full px-3 pb-2"
                >
                  {/* Name / version */}
                  <div className="text-center mb-1.5">
                    <h3 className="font-bold text-base leading-tight">{card.name}</h3>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                      <span>{card.provider}</span><span>•</span>
                      <span style={{ color: card.rarityInfo.color }}>v{card.version}</span>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-gray-300 mb-1.5">
                    <span>💥 {card.stats.power}</span>
                    <span>⚡ {card.stats.speed}</span>
                    <span>🧠 {card.stats.intelligence}</span>
                    <span>✨ {card.stats.creativity}</span>
                  </div>
                  {/* Rarity badge */}
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: card.rarityInfo.color, color: 'white' }}>
                      <Star className="w-3 h-3 fill-current" />{card.rarityInfo.name}
                    </div>
                  </div>
                  {isSpecial && (
                    <motion.div
                      animate={{ boxShadow: [`0 0 10px ${card.rarityInfo.color}`, `0 0 30px ${card.rarityInfo.color}`, `0 0 10px ${card.rarityInfo.color}`] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ boxShadow: `inset 0 0 20px ${card.rarityInfo.color}80` }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {selectedIndex === index && isRevealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-2xl pointer-events-none" />
            )}
          </div>
          {isRevealed && card.rarity !== 'COMMON' && <div className="card-shine absolute inset-0 pointer-events-none" />}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" ref={containerRef}>
      {/* Cinematic overlay */}
      <AnimatePresence>
        {currentCinematic && (
          <CinematicReveal card={currentCinematic} onDone={advanceCinematic} />
        )}
      </AnimatePresence>

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
        {cards.map((card, index) => {
          const isConverted = convertedIndices.has(index);
          return (
            <CardReveal
              key={card.id}
              card={card}
              index={index}
              isRevealed={showResult || selectedIndex === index}
              isConverted={isConverted}
              crystalAmount={isConverted ? (PRESTIGE_CRYSTAL_VALUES[card.rarity] || 0) : 0}
            />
          );
        })}
      </div>

      {/* Prestige crystal earnings banner */}
      <AnimatePresence>
        {showResult && totalPrestigeCrystals > 0 && (
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 px-6 py-3 bg-indigo-900/40 border border-indigo-500/50 rounded-2xl flex items-center gap-3"
          >
            <span className="text-2xl">💎</span>
            <div>
              <div className="font-bold text-indigo-300">Prestige Crystals Earned!</div>
              <div className="text-sm text-gray-400">
                {convertedIndices.size} maxed card{convertedIndices.size > 1 ? 's' : ''} converted to{' '}
                <span className="text-white font-bold">+{totalPrestigeCrystals} 💎</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            onClick={handleDone}
            className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-bold shadow-lg flex items-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Done ({cards.length - convertedIndices.size} Cards{totalPrestigeCrystals > 0 ? ` · 💎 ${totalPrestigeCrystals}` : ''})
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

    </div>
  );
}

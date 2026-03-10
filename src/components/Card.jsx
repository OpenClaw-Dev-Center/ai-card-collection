import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Star, ArrowUp } from 'lucide-react';

export function Card({ card, onClick, selected, showUpgrade }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(card);
    }
  };

  const maxStat = 100;
  const rarityColors = {
    COMMON: 'from-gray-400 to-gray-500',
    RARE: 'from-blue-400 to-blue-600',
    EPIC: 'from-purple-400 to-purple-600',
    LEGENDARY: 'from-yellow-400 to-orange-500',
    MYTHIC: 'from-red-400 to-red-600'
  };

  const rarityGlow = {
    COMMON: 'rgba(156, 163, 175, 0.5)',
    RARE: 'rgba(59, 130, 246, 0.6)',
    EPIC: 'rgba(168, 85, 247, 0.6)',
    LEGENDARY: 'rgba(245, 158, 11, 0.7)',
    MYTHIC: 'rgba(239, 68, 68, 0.8)'
  };

  const statsConfig = [
    { key: 'power', label: 'Power' },
    { key: 'speed', label: 'Speed' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'creativity', label: 'Creativity' }
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className={`relative w-64 h-96 cursor-pointer perspective-1000 ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{
          rotateY: isFlipped ? 180 : 0
        }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* Front */}
        <div
          className={`absolute w-full h-full backface-hidden rounded-2xl overflow-hidden border-2 transition-all duration-300 ${card.shiny ? 'shimmer' : ''}`}
          style={{
            background: `linear-gradient(135deg, ${card.rarityInfo.color}20 0%, rgba(15, 15, 35, 0.9) 100%)`,
            borderColor: card.rarityInfo.color,
            boxShadow: `0 0 20px ${rarityGlow[card.rarity]}, inset 0 0 20px rgba(0,0,0,0.3)`
          }}
        >
          {/* Card image / gradient background */}
          <div className="relative h-48 bg-gradient-to-br from-gray-800/50 to-gray-900/50 overflow-hidden">
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback gradient if image fails */}
            <div
              className="absolute inset-0 items-center justify-center text-4xl font-bold"
              style={{
                display: 'none',
                background: `linear-gradient(135deg, ${card.rarityInfo.color}40, ${card.providerInfo.color}40)`
              }}
            >
              {card.providerInfo.icon}
            </div>

            {/* Rarity indicator */}
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg"
              >
                <Star className="w-4 h-4 text-white fill-current" />
              </motion.div>
            </div>

            {/* Provider badge */}
            <div className="absolute bottom-2 left-2">
              <span
                className="px-2 py-1 rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: card.providerInfo.color }}
              >
                {card.provider}
              </span>
            </div>
          </div>

          {/* Card content */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Title */}
            <div className="mb-2">
              <h3 className="font-bold text-lg truncate">{card.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>v{card.version}</span>
                <span>•</span>
                <span style={{ color: card.rarityInfo.color }}>{card.rarityInfo.name}</span>
              </div>
            </div>

            {/* Stats bars */}
            <div className="flex-1 space-y-2 py-2">
              {statsConfig.map(stat => (
                <div key={stat.key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16">{stat.label}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, card.stats[stat.key])}%` }}
                      transition={{ duration: 0.8, delay: Math.random() * 0.5 }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${card.rarityInfo.color}, ${card.providerInfo.color})`
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">{card.stats[stat.key]}</span>
                </div>
              ))}
            </div>

            {/* Card ID version */}
            <div className="mt-2 text-xs text-gray-500 font-mono">
              #{card.id.split('-')[1]}
            </div>
          </div>

          {/* Glow effect on hover */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                boxShadow: `inset 0 0 30px ${rarityGlow[card.rarity]}`,
                border: `2px solid ${card.rarityInfo.color}`,
                animation: 'pulse-glow 2s infinite'
              }}
            />
          )}

          {/* Scanline effect for rare+ cards */}
          {card.rarity !== 'COMMON' && (
            <div className="absolute inset-0 pointer-events-none scanline" style={{ color: card.rarityInfo.color, opacity: 0.3 }} />
          )}
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden rotate-y-180"
          style={{
            background: `linear-gradient(135deg, #1a1a3e 0%, #0f0f23 100%)`,
            border: `2px solid ${card.rarityInfo.color}`,
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${card.rarityInfo.color} 10px, ${card.rarityInfo.color} 11px)`
            }} />

            {/* Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10"
            >
              <div className="text-6xl mb-4">{card.providerInfo.icon}</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: card.rarityInfo.color }}>
                {card.version}
              </h3>
              <p className="text-gray-400 text-sm">{card.name}</p>
              <p className="text-gray-500 text-xs mt-4 max-w-xs">
                {card.description}
              </p>
            </motion.div>

            {/* Stats summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 mt-8 grid grid-cols-2 gap-2 w-full"
            >
              {Object.entries(card.stats).map(([key, val]) => (
                <div key={key} className="bg-gray-800/50 rounded p-2">
                  <div className="text-xs text-gray-400 capitalize">{key}</div>
                  <div className="font-bold" style={{ color: card.rarityInfo.color }}>{val}</div>
                </div>
              ))}
            </motion.div>

            {/* Flip prompt */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-4 text-xs text-gray-500"
            >
              Tap to flip back
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      {showUpgrade && (
        <div className="absolute bottom-2 right-2 z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-full shadow-lg"
            title="Upgrade"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

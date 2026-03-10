import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Lock, Gift, Unlock, Star, Zap } from 'lucide-react';
import { LEVEL_REWARDS, xpForLevel, xpToNextLevel } from '../data/cards';

// All levels we show on the road (1 to 30)
const ALL_LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const PACK_LABELS = {
  basic: 'Basic Pack',
  premium: 'Premium Pack',
  mega: 'Mega Pack',
  legendary: 'Legendary Pack',
  claude_pack: 'Claude Pack 🤖',
  gpt_pack: 'GPT Pack 🧠',
  gemini_pack: 'Gemini Pack ✨',
  opensource_pack: 'Open Source Pack 🦙',
  rivals_pack: 'Rivals Pack ⚔️',
};

function packSummary(packs) {
  return Object.entries(packs)
    .map(([k, v]) => `${v}x ${PACK_LABELS[k] ?? k}`)
    .join(', ');
}

export function ExperienceRoad({ user, xp, level, claimedLevels, onClaimReward, onBack }) {
  const currentLevelRef = useRef(null);

  const xpInLevel = xp - xpForLevel(level);
  const xpNeeded = xpToNextLevel(level);
  const progressPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-2xl mx-auto flex items-center justify-between mb-6">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </motion.button>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent"
        >
          ✨ Experience Road
        </motion.h1>

        <div className="w-20" />
      </header>

      {/* Level + XP bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-8 bg-gray-900/70 backdrop-blur rounded-2xl p-5 border border-purple-500/30"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-500/30">
              {level}
            </div>
            <div>
              <div className="font-bold text-lg">Level {level}</div>
              <div className="text-sm text-gray-400">{xp.toLocaleString()} total XP</div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div className="font-medium text-white">{xpInLevel} / {xpNeeded} XP</div>
            <div>to Level {level + 1}</div>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lv {level}</span>
          <span>{progressPct}%</span>
          <span>Lv {level + 1}</span>
        </div>
      </motion.div>

      {/* The Road */}
      <div className="max-w-2xl mx-auto space-y-3 pb-20">
        {ALL_LEVELS.map((lvl, idx) => {
          const reward = LEVEL_REWARDS[lvl];
          const isUnlocked = lvl <= level;
          const isCurrent = lvl === level;
          const claimed = claimedLevels.includes(lvl);
          const canClaim = isUnlocked && reward && !claimed;

          let nodeStyle = '';
          let borderStyle = '';
          if (isCurrent) {
            nodeStyle = 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg shadow-orange-500/40';
            borderStyle = 'border-orange-500/60 bg-orange-900/20';
          } else if (claimed) {
            nodeStyle = 'bg-gradient-to-br from-green-600 to-teal-600 text-white';
            borderStyle = 'border-green-800/40 bg-green-900/10';
          } else if (isUnlocked) {
            nodeStyle = 'bg-gradient-to-br from-blue-600 to-purple-600 text-white';
            borderStyle = 'border-blue-700/40 bg-blue-900/20';
          } else {
            nodeStyle = 'bg-gray-800 text-gray-500';
            borderStyle = 'border-gray-800/50 bg-gray-900/30';
          }

          return (
            <motion.div
              key={lvl}
              ref={isCurrent ? currentLevelRef : undefined}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.4) }}
              className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur transition-all ${borderStyle}`}
            >
              {/* Level bubble */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${nodeStyle}`}>
                {claimed ? <CheckCircle className="w-6 h-6" /> : isUnlocked ? lvl : <Lock className="w-5 h-5" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold ${isCurrent ? 'text-orange-300' : isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    Level {lvl}
                  </span>
                  {reward?.label && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-purple-800/60 text-purple-200' : 'bg-gray-800 text-gray-600'}`}>
                      {reward.label}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-600/60 text-orange-200 animate-pulse">
                      ← Current
                    </span>
                  )}
                </div>

                {reward ? (
                  <div className={`text-sm mt-0.5 ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Gift className="w-3 h-3 inline mr-1" />
                    {packSummary(reward.packs)}
                    {reward.unlock && (
                      <span className={`ml-2 text-xs font-bold ${isUnlocked ? 'text-yellow-400' : 'text-gray-600'}`}>
                        {reward.unlockLabel}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={`text-sm mt-0.5 ${isUnlocked ? 'text-gray-400' : 'text-gray-700'}`}>
                    No reward this level
                  </div>
                )}
              </div>

              {/* Claim / Status */}
              <div className="flex-shrink-0">
                {canClaim ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ boxShadow: ['0 0 0px #22c55e00', '0 0 12px #22c55e80', '0 0 0px #22c55e00'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    onClick={() => onClaimReward(lvl)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold text-sm text-white shadow-lg shadow-green-500/30"
                  >
                    <Gift className="w-4 h-4" />
                    Claim
                  </motion.button>
                ) : claimed ? (
                  <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Claimed
                  </span>
                ) : !isUnlocked ? (
                  <span className="flex items-center gap-1 text-gray-600 text-sm">
                    <Lock className="w-4 h-4" />
                    Locked
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Beyond Level 30 teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 p-4 rounded-2xl border border-gray-800/30 bg-gray-900/20 opacity-60"
        >
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <Star className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <div className="text-gray-500 font-bold">Level 31+</div>
            <div className="text-gray-600 text-sm">More rewards coming soon…</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

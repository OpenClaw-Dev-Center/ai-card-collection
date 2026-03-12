import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  LogOut as LogOutIcon,
  Play as PlayIcon,
  Grid3x3 as GridIcon,
  Package as PackageIcon,
  Crown as CrownIcon,
  ChevronRight as ChevronIcon,
  Sparkles as SparklesIcon,
  Zap as ZapIcon,
  Trophy as TrophyIcon,
  Swords as SwordsIcon,
  Layers as LayersIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  Star as StarIcon,
  Castle as CastleIcon,
  BarChart2 as BarChart2Icon
} from 'lucide-react';
import { PACK_TYPES, xpForLevel, xpToNextLevel } from '../data/cards';

export function Dashboard({
  user, currency, packs, prestigeCrystals = 0,
  xp = 0, level = 1, unclaimedCount = 0, unlockedFeatures = ['game'],
  onLogout, onNavigate, onPackOpen,
}) {
  // Split packs into purchasable and earned reward packs
  const purchasableEntries = Object.entries(PACK_TYPES).filter(([, p]) => !p.rewardOnly);
  const earnedPackEntries = Object.entries(PACK_TYPES).filter(
    ([key, p]) => p.rewardOnly && (packs[key.toLowerCase()] || 0) > 0
  );

  const deckBattleUnlocked = unlockedFeatures.includes('deck-battle');
  const towerDefenseUnlocked = unlockedFeatures.includes('tower-defense');

  // XP bar
  const xpInLevel = xp - xpForLevel(level);
  const xpNeeded = xpToNextLevel(level);
  const xpPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  // Total earned packs across all types
  const totalEarnedPacks = Object.entries(packs).reduce((sum, [key]) => {
    const pt = PACK_TYPES[key.toUpperCase()];
    return pt ? sum + (packs[key] || 0) : sum;
  }, 0);

  // Get user stats from localStorage
  const userStats = useMemo(() => {
    if (!user) return { wins: 0, playtimeHours: 0 };
    const userKey = typeof user === 'string' ? user : user.username;
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const stats = users[userKey] || {};
    return {
      wins: stats.wins || 0,
      playtimeHours: stats.playtimeHours || 0
    };
  }, [user]);

  const key = user ? (typeof user === 'string' ? user : (user.id || user.username)) : null;
  const collection = key ? JSON.parse(localStorage.getItem(`collection_${key}`) || '[]') : [];
  const collectionCount = collection.length;
  const totalWins = userStats.wins;

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <SparklesIcon className="w-8 h-8 text-yellow-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Card Collection
          </h1>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4"
        >
          {/* Currency */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/30 to-orange-600/30 px-4 py-2 rounded-full border border-yellow-500/30">
            <WalletIcon className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-300">{currency.toLocaleString()}</span>
          </div>

          {/* Prestige crystals */}
          {prestigeCrystals > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 px-4 py-2 rounded-full border border-indigo-500/30">
              <span className="text-base">💎</span>
              <span className="font-bold text-indigo-300">{prestigeCrystals.toLocaleString()}</span>
            </div>
          )}

          {/* User + level */}
          <div className="flex items-center gap-3">
            {/* Level badge */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-600/30 to-orange-600/30 px-3 py-1.5 rounded-full border border-yellow-600/30">
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-300">Lv {level}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{typeof user === 'string' ? user : user?.username}</div>
              <div className="text-xs text-green-400">● Online</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-red-500/20 rounded-full transition-colors group"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
            </button>
          </div>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-purple-500/30 p-8"
        >
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {typeof user === 'string' ? user : user?.username}! 👋</h2>
            <p className="text-gray-300 mb-4">
              Collect AI models, battle through challenges, and upgrade your collection to legendary status.
            </p>

            {/* XP Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-yellow-300 font-medium">Level {level}</span>
                <span className="text-gray-400">{xpInLevel} / {xpNeeded} XP  ({xpPct}%)</span>
                <span className="text-gray-400">Level {level + 1}</span>
              </div>
              <div className="h-2.5 bg-gray-800/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('game')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold shadow-lg"
              >
                <PlayIcon className="w-5 h-5" />
                1v1 Battle
              </motion.button>

              {deckBattleUnlocked ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('deck-battle')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold shadow-lg"
                >
                  <SwordsIcon className="w-5 h-5" />
                  Deck Battle
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-700/60 rounded-xl font-bold text-gray-400 border border-gray-600/40 cursor-default select-none" title="Reach Level 3 to unlock">
                  <LockIcon className="w-5 h-5" />
                  Deck Battle
                  <span className="text-xs bg-gray-600/60 px-2 py-0.5 rounded-full">Lv 3</span>
                </div>
              )}

              {towerDefenseUnlocked ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('tower-defense')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold shadow-lg"
                >
                  <CastleIcon className="w-5 h-5" />
                  Tower Defense
                </motion.button>
              ) : (
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-700/60 rounded-xl font-bold text-gray-400 border border-gray-600/40 cursor-default select-none" title="Reach Level 5 to unlock">
                  <LockIcon className="w-5 h-5" />
                  Tower Defense
                  <span className="text-xs bg-gray-600/60 px-2 py-0.5 rounded-full">Lv 5</span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-4 left-4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Cards Owned', value: collectionCount.toString(), icon: GridIcon, color: 'from-blue-500 to-cyan-500' },
            { label: 'Earned Packs', value: totalEarnedPacks.toString(), icon: PackageIcon, color: 'from-purple-500 to-pink-500' },
            { label: 'Wins', value: totalWins.toString(), icon: TrophyIcon, color: 'from-yellow-500 to-orange-500' },
            { label: 'Prestige 💎', value: prestigeCrystals.toLocaleString(), icon: CrownIcon, color: 'from-indigo-500 to-purple-500' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx }}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-900/60 backdrop-blur rounded-2xl p-4 border border-gray-700/50 cursor-pointer"
            >
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.color} mb-2`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Packs Section – Purchasable */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PackageIcon className="w-6 h-6 text-purple-400" />
            Pack Shop
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {purchasableEntries.map(([key, pack]) => {
              const ownedCount = packs[key.toLowerCase()] || 0;
              const canAfford = currency >= pack.cost;
              const canOpen = ownedCount > 0 || canAfford;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, boxShadow: `0 10px 30px -10px ${pack.probabilityOverrides?.MYTHIC > 0.05 ? '#ef4444' : '#8b5cf6'}40` }}
                  className="relative bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700/50 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 opacity-50" />
                  {ownedCount > 0 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      x{ownedCount}
                    </div>
                  )}
                  <div className="relative z-10 mb-4 flex justify-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-32 bg-gradient-to-b from-purple-600 via-pink-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <PackageIcon className="w-12 h-12 text-white/80" />
                    </motion.div>
                  </div>
                  <div className="relative z-10 text-center">
                    <h4 className="font-bold text-lg mb-1">{pack.name}</h4>
                    <div className="text-sm text-gray-400 mb-4">
                      {pack.cards} cards • Guaranteed {pack.guaranteedRarity}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <WalletIcon className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-yellow-300">{pack.cost.toLocaleString()}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPackOpen(pack, key.toLowerCase())}
                      disabled={!canOpen}
                      className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${
                        canOpen
                          ? ownedCount > 0
                            ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {ownedCount > 0 ? `Open (${ownedCount} owned)` : canAfford ? 'Buy & Open' : 'Not Enough'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Earned Reward Packs (show only if any owned) */}
        {earnedPackEntries.length > 0 && (
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-yellow-400" />
              Reward Packs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {earnedPackEntries.map(([key, pack]) => {
                const ownedCount = packs[key.toLowerCase()] || 0;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="relative bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-yellow-700/40 overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      x{ownedCount}
                    </div>
                    <div className="relative z-10 mb-4 flex justify-center">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-32 bg-gradient-to-b from-yellow-600 via-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20"
                      >
                        <SparklesIcon className="w-12 h-12 text-white/80" />
                      </motion.div>
                    </div>
                    <div className="relative z-10 text-center">
                      <h4 className="font-bold text-lg mb-1">{pack.name}</h4>
                      <div className="text-sm text-gray-400 mb-4">
                        {pack.cards} cards • {pack.providerFilter?.join(' / ')} only
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPackOpen(pack, key.toLowerCase())}
                        className="w-full py-2 px-4 rounded-xl font-medium bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg"
                      >
                        Open Pack
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('collection')}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <GridIcon className="w-8 h-8 text-blue-400" />
              <ChevronIcon className="w-6 h-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">My Collection</h3>
            <p className="text-gray-400 text-sm">View and upgrade cards</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('leaderboard')}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <TrophyIcon className="w-8 h-8 text-yellow-400" />
              <ChevronIcon className="w-6 h-6 text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">Leaderboard</h3>
            <p className="text-gray-400 text-sm">See top players</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('game')}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <PlayIcon className="w-8 h-8 text-green-400" />
              <ChevronIcon className="w-6 h-6 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">1v1 Battle</h3>
            <p className="text-gray-400 text-sm">Classic card battle</p>
          </motion.button>

          {/* Experience Road – with unclaimed badge */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('experience')}
            className="relative bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all text-left group"
          >
            {unclaimedCount > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center z-10">
                {unclaimedCount}
              </span>
            )}
            <div className="flex items-center justify-between mb-3">
              <TrendingUpIcon className="w-8 h-8 text-orange-400" />
              <ChevronIcon className="w-6 h-6 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">Experience Road</h3>
            <p className="text-gray-400 text-sm">Level rewards &amp; unlocks</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('type-chart')}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <BarChart2Icon className="w-8 h-8 text-purple-400" />
              <ChevronIcon className="w-6 h-6 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">Type Chart</h3>
            <p className="text-gray-400 text-sm">Model matchup guide</p>
          </motion.button>
        </section>
      </main>
    </div>
  );
}

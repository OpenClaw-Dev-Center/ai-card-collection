import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, LogOut, Play, Grid3X3, Package, Crown,
  ChevronRight, Sparkles, Zap, Trophy
} from 'lucide-react';
import { PACK_TYPES } from '../data/cards';

export function Dashboard({ user, currency, packs, onLogout, onNavigate, onPackOpen }) {
  const packEntries = Object.entries(PACK_TYPES);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <Sparkles className="w-8 h-8 text-yellow-400" />
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
            <Wallet className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-yellow-300">{currency.toLocaleString()}</span>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{user}</div>
              <div className="text-xs text-green-400">● Online</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-red-500/20 rounded-full transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
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
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user}! 👋</h2>
            <p className="text-gray-300 mb-6">
              Collect AI models, battle through challenges, and upgrade your collection to legendary status.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('game')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold shadow-lg"
            >
              <Play className="w-5 h-5" />
              Play Now
            </motion.button>
          </div>
          {/* Decorative particles */}
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
            { label: 'Cards Owned', value: '47', icon: Grid3X3, color: 'from-blue-500 to-cyan-500' },
            { label: 'Packs', value: packs.basic + packs.premium + packs.mega + packs.legendary, icon: Package, color: 'from-purple-500 to-pink-500' },
            { label: 'Unique Models', value: '12', icon: Zap, color: 'from-yellow-500 to-orange-500' },
            { label: 'Playtime', value: '2h 15m', icon: Trophy, color: 'from-green-500 to-teal-500' }
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

        {/* Packs Section */}
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            Available Packs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packEntries.map(([key, pack]) => {
              const ownedCount = packs[key.toLowerCase()];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, boxShadow: `0 10px 30px -10px ${pack.probabilityOverrides?.MYTHIC ? '#ef4444' : '#8b5cf6'}40` }}
                  className="relative bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700/50 overflow-hidden group"
                >
                  {/* Pack gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 opacity-50" />

                  {/* Pack count badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    x{ownedCount}
                  </div>

                  {/* Pack image placeholder */}
                  <div className="relative z-10 mb-4 flex justify-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-32 bg-gradient-to-b from-purple-600 via-pink-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <Package className="w-12 h-12 text-white/80" />
                    </motion.div>
                  </div>

                  <div className="relative z-10 text-center">
                    <h4 className="font-bold text-lg mb-1">{pack.name}</h4>
                    <div className="text-sm text-gray-400 mb-4">
                      {pack.cards} cards • Guaranteed {pack.guaranteedRarity}
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Wallet className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-yellow-300">{pack.cost.toLocaleString()}</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPackOpen(pack)}
                      disabled={currency < pack.cost}
                      className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${
                        currency >= pack.cost
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {currency >= pack.cost ? 'Open Pack' : 'Not Enough'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('collection')}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <Grid3X3 className="w-8 h-8 text-blue-400" />
              <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">My Collection</h3>
            <p className="text-gray-400 text-sm">View and manage all your AI model cards</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('game')}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-8 h-8 text-green-400" />
              <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">Play Game</h3>
            <p className="text-gray-400 text-sm">Battle AI models to earn packs and currency</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            className="bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold mb-1">Leaderboard</h3>
            <p className="text-gray-400 text-sm">Compete with other players (coming soon)</p>
          </motion.button>
        </section>
      </main>
    </div>
  );
}

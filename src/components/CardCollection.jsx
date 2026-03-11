import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, Grid3X3, Copy, ArrowUp, Lock } from 'lucide-react';
import { Card } from './Card';
import { RARITIES, VERSION_PROGRESSION, getDuplicatesRequired, getDuplicateCount, upgradeCardWithDupes } from '../data/cards';

export function CardCollection({ user, onBack, onXpGain = () => {} }) {
  const [collection, setCollection] = useState([]);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [upgradingCard, setUpgradingCard] = useState(null);
  const [sortBy, setSortBy] = useState('rarity'); // rarity, power, name, version

  useEffect(() => {
    if (user) {
      const key = typeof user === 'string' ? user : user.username;
      const saved = JSON.parse(localStorage.getItem(`collection_${key}`) || '[]');
      setCollection(saved);
    }
  }, [user]);

  const filteredCards = collection
    .filter(card => {
      if (search && !card.name.toLowerCase().includes(search.toLowerCase()) &&
          !card.provider.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (rarityFilter !== 'ALL' && card.rarity !== rarityFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'power':
          return b.stats.power - a.stats.power;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'version':
          return b.version.localeCompare(a.version);
        case 'rarity':
        default:
          const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
    });

  const groupedCards = filteredCards.reduce((acc, card) => {
    const key = `${card.provider} - ${card.name}`;
    if (!acc[key]) {
      acc[key] = { baseName: card.name, provider: card.provider, providerInfo: card.providerInfo, versions: [] };
    }
    acc[key].versions.push(card);
    return acc;
  }, {});

  const handleUpgrade = (card) => {
    const result = upgradeCardWithDupes(card, collection);
    if (!result) return;
    const { newCollection } = result;
    const key = typeof user === 'string' ? user : user.username;
    localStorage.setItem(`collection_${key}`, JSON.stringify(newCollection));
    setCollection(newCollection);
    setUpgradingCard(null);
    onXpGain(20);
  };

  const statsTotal = (card) => Object.values(card.stats).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen p-6">
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

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          My Collection
        </motion.h1>

        <div className="w-24" /> {/* Spacer for center alignment */}
      </header>

      {/* Filters */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-4"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Rarity filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Rarities</option>
            {Object.entries(RARITIES).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="rarity">Sort by Rarity</option>
          <option value="power">Sort by Power</option>
          <option value="name">Sort by Name</option>
          <option value="version">Sort by Version</option>
        </select>
      </motion.div>

      {/* Collection grid */}
      <div className="max-w-6xl mx-auto">
        {Object.keys(groupedCards).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Grid3X3 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Collection Empty</h3>
            <p className="text-gray-400">Open packs to start collecting AI models!</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedCards).map(([key, group], idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center text-xl">
                    {group.providerInfo.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{group.baseName}</h3>
                    <p className="text-sm text-gray-400">{group.provider}</p>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">
                    {group.versions.length} version{group.versions.length > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.versions
                    .sort((a, b) => {
                      switch (sortBy) {
                        case 'power': return b.stats.power - a.stats.power;
                        case 'name': {
                          const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
                          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                        }
                        case 'version': return b.version.localeCompare(a.version);
                        case 'rarity':
                        default: {
                          const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
                          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                        }
                      }
                    })
                    .map(card => {
                      const required = getDuplicatesRequired(card);
                      const dupeCount = getDuplicateCount(card, collection);
                      const canUpgrade = required !== null && dupeCount >= required;
                      const isMaxLevel = required === null;
                      return (
                        <div key={card.id} className="relative group">
                          <Card
                            card={card}
                            onClick={() => {}}
                            selected={false}
                            showUpgrade={!isMaxLevel}
                          />

                          {/* Duplicate / upgrade badge */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <div className="bg-black/70 backdrop-blur px-2 py-0.5 rounded text-xs font-bold">
                              {statsTotal(card)} pts
                            </div>
                            {!isMaxLevel && (
                              <div
                                className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                                  canUpgrade
                                    ? 'bg-green-700/80 text-green-200'
                                    : 'bg-gray-800/80 text-gray-400'
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                                {dupeCount}/{required}
                              </div>
                            )}
                            {isMaxLevel && (
                              <div className="bg-yellow-700/80 px-2 py-0.5 rounded text-xs font-bold text-yellow-200">
                                MAX
                              </div>
                            )}
                          </div>

                          {/* Upgrade button */}
                          {!isMaxLevel && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); setUpgradingCard(card); }}
                              disabled={!canUpgrade}
                              className={`absolute bottom-8 right-2 z-10 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-opacity flex items-center gap-1 ${
                                canUpgrade
                                  ? 'bg-gradient-to-r from-green-600 to-teal-600 opacity-0 group-hover:opacity-100'
                                  : 'bg-gray-700 text-gray-500 opacity-0 group-hover:opacity-100 cursor-not-allowed'
                              }`}
                            >
                              {canUpgrade ? <><ArrowUp className="w-3 h-3" /> Upgrade</> : <><Lock className="w-3 h-3" /> Need {required - dupeCount} more</>}
                            </motion.button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {upgradingCard && (() => {
          const required = getDuplicatesRequired(upgradingCard);
          const dupeCount = getDuplicateCount(upgradingCard, collection);
          const canUpgrade = required !== null && dupeCount >= required;
          const nextVersion = VERSION_PROGRESSION[upgradingCard.version]?.next;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setUpgradingCard(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
              >
                <h3 className="text-2xl font-bold mb-4 text-center">Upgrade Card</h3>

                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Current</div>
                    <div className="text-xl font-bold">{upgradingCard.version}</div>
                    <div className="text-3xl mt-2">{upgradingCard.providerInfo.icon}</div>
                  </div>
                  <div className="text-3xl text-gray-500">→</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">New Version</div>
                    <div className="text-xl font-bold text-green-400">{nextVersion}</div>
                    <div className="text-3xl mt-2 text-green-400">{upgradingCard.providerInfo.icon}</div>
                  </div>
                </div>

                {/* Duplicate cost */}
                <div className="bg-gray-800/50 rounded-xl p-4 mb-3">
                  <div className="text-center text-sm text-gray-400 mb-2">Duplicate copies required</div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex gap-1">
                      {Array.from({ length: required }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`w-8 h-10 rounded-lg border-2 flex items-center justify-center text-sm ${
                            i < dupeCount
                              ? 'border-green-500 bg-green-900/40 text-green-300'
                              : 'border-gray-600 bg-gray-800/40 text-gray-600'
                          }`}
                        >
                          {i < dupeCount ? upgradingCard.providerInfo.icon : '?'}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center mt-2 text-sm">
                    <span className={dupeCount >= required ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {dupeCount}/{required} copies
                    </span>
                    {dupeCount < required && (
                      <span className="text-gray-500 ml-2">(need {required - dupeCount} more)</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center mb-4">
                  {required} duplicate{required > 1 ? 's' : ''} of <span style={{ color: upgradingCard.rarityInfo.color }}>{upgradingCard.rarityInfo.name} {upgradingCard.name}</span> will be consumed.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradingCard(null)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpgrade(upgradingCard)}
                    disabled={!canUpgrade}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 ${
                      canUpgrade
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    {canUpgrade ? 'Upgrade!' : `Need ${required - dupeCount} more`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, Grid3x3 } from 'lucide-react';
import { Card } from './Card';
import { CARD_POOL, RARITIES, VERSION_PROGRESSION, getUpgradeCost, upgradeCard } from '../data/cards';

export function CardCollection({ user, onBack }) {
  const [collection, setCollection] = useState([]);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [upgradingCard, setUpgradingCard] = useState(null);
  const [sortBy, setSortBy] = useState('rarity'); // rarity, power, name, version

  useEffect(() => {
    if (user) {
      const saved = JSON.parse(localStorage.getItem(`collection_${user}`) || '[]');
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
    const upgradeCost = getUpgradeCost(card);
    if (upgradeCost === null) {
      alert('This card is already at max level!');
      return;
    }

    const currency = JSON.parse(localStorage.getItem(`currency_${user}`) || '0');
    if (currency < upgradeCost) {
      alert(`Not enough currency! Need ${upgradeCost} credits.`);
      return;
    }

    const upgraded = upgradeCard(card);
    if (!upgraded) return;

    // Deduct cost
    localStorage.setItem(`currency_${user}`, JSON.stringify(currency - upgradeCost));

    // Update collection
    const newCollection = collection.map(c => c.id === card.id ? upgraded : c);
    localStorage.setItem(`collection_${user}`, JSON.stringify(newCollection));
    setCollection(newCollection);
    setUpgradingCard(null);

    alert(`Successfully upgraded ${card.name} to version ${upgraded.version}!`);
  };

  const statsTotal = (card) => {
    return Object.values(card.stats).reduce((a, b) => a + b, 0);
  };

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
            <Grid3x3 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
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
                    .sort((a, b) => b.version.localeCompare(a.version))
                    .map(card => (
                      <div key={card.id} className="relative group">
                        <Card
                          card={card}
                          onClick={() => {}} // Handle from main card click
                          selected={false}
                          showUpgrade={getUpgradeCost(card) !== null}
                        />

                        {/* Upgrage overlay */}
                        {getUpgradeCost(card) !== null && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpgradingCard(card);
                            }}
                            className="absolute bottom-8 right-2 z-10 px-3 py-1.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                          >
                            <span>Upgrade</span>
                            <span className="text-yellow-300">{getUpgradeCost(card)}</span>
                          </motion.button>
                        )}

                        {/* Total stat badge */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold">
                          {statsTotal(card)} Total
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {upgradingCard && (
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
                {/* Before */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Current</div>
                  <div className="text-xl font-bold">{upgradingCard.version}</div>
                  <div className="text-3xl mt-2">{upgradingCard.providerInfo.icon}</div>
                </div>

                <div className="text-3xl text-gray-500">→</div>

                {/* After */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">New Version</div>
                  <div className="text-xl font-bold text-green-400">
                    {VERSION_PROGRESSION[upgradingCard.version]?.next}
                  </div>
                  <div className="text-3xl mt-2 text-green-400">{upgradingCard.providerInfo.icon}</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="text-center text-sm text-gray-400 mb-2">Upgrade Cost</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-yellow-400">{getUpgradeCost(upgradingCard)}</span>
                  <span className="text-gray-300">Credits</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setUpgradingCard(null)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpgrade(upgradingCard)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 rounded-xl font-medium transition-all shadow-lg"
                >
                  Upgrade Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

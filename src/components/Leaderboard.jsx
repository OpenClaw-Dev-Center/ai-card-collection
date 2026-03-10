import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Swords, Award } from 'lucide-react';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'wins', 'playtime'

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const entries = Object.entries(users).map(([username, data]) => ({
      username,
      wins: data.wins || 0,
      losses: data.losses || 0,
      totalBattles: data.totalBattles || 0,
      playtimeHours: data.playtimeHours || 0,
      winRate: data.totalBattles > 0 ? ((data.wins || 0) / data.totalBattles * 100).toFixed(1) : 0
    }));

    // Sort by totalBattles first (most active), then by win rate, then by wins
    const sorted = entries.sort((a, b) => {
      if (b.totalBattles !== a.totalBattles) return b.totalBattles - a.totalBattles;
      if (b.winRate !== a.winRate) return parseFloat(b.winRate) - parseFloat(a.winRate);
      return b.wins - a.wins;
    });

    setLeaderboard(sorted);
  };

  const filteredLeaderboard = [...leaderboard].sort((a, b) => {
    if (filter === 'wins') return b.wins - a.wins;
    if (filter === 'playtime') return b.playtimeHours - a.playtimeHours;
    return 0; // Already sorted for 'all'
  });

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="text-gray-500 font-bold">#{index + 1}</span>;
  };

  const getWinRateColor = (rate) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-gray-400 mt-2">Top players ranked by activity and performance</p>
        </motion.div>

        {/* Filters */}
        <div className="flex justify-center gap-2 mb-6">
          {['all', 'wins', 'playtime'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Most Active' : f === 'wins' ? 'Most Wins' : 'Playtime'}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-700"
        >
          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2 text-gray-400">No players yet</h3>
              <p className="text-gray-500">Be the first to battle and claim the top spot!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeaderboard.map((entry, idx) => (
                <motion.div
                  key={entry.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30' :
                    idx === 1 ? 'bg-gray-800/80 border border-gray-600' :
                    idx === 2 ? 'bg-gray-800/60 border border-orange-500/20' :
                    'bg-gray-900/50 border border-gray-800'
                  }`}
                >
                  <div className="text-2xl font-bold w-10 text-center">
                    {getMedal(idx)}
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-lg">{entry.username}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Swords className="w-4 h-4" />
                        {entry.totalBattles} battles
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {entry.wins}W / {entry.losses}L
                      </span>
                      <span className={`font-bold ${getWinRateColor(parseFloat(entry.winRate))}`}>
                        {entry.winRate}% win rate
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-blue-400">
                      <Calendar className="w-4 h-4" />
                      {entry.playtimeHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500 mt-1">playtime</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats summary */}
        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 grid grid-cols-3 gap-4"
          >
            <div className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-blue-400">{leaderboard.length}</div>
              <div className="text-sm text-gray-400 mt-1">Total Players</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-green-400">
                {leaderboard.reduce((sum, p) => sum + p.totalBattles, 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Battles</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {leaderboard.reduce((sum, p) => sum + (p.wins || 0), 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Victories</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, TrendingUp, Clock, Swords } from 'lucide-react';

export function Leaderboard({ user, onBack }) {
  const [users, setUsers] = useState([]);
  const [sortBy, setSortBy] = useState('active'); // active, wins, playtime

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '{}');
    const userList = Object.keys(allUsers).map(username => ({
      username,
      ...allUsers[username]
    }));

    // Sort based on criteria
    userList.sort((a, b) => {
      switch (sortBy) {
        case 'wins':
          return b.wins - a.wins;
        case 'playtime':
          return b.playtimeHours - a.playtimeHours;
        case 'active':
        default:
          return b.totalBattles - a.totalBattles;
      }
    });

    setUsers(userList);
  }, [sortBy]);

  const totalPlayers = users.length;
  const totalBattles = users.reduce((sum, u) => sum + u.totalBattles, 0);
  const totalWins = users.reduce((sum, u) => sum + u.wins, 0);

  const getMedal = (index) => {
    switch (index) {
      case 0: return { icon: '🥇', color: 'from-yellow-400 to-yellow-600' };
      case 1: return { icon: '🥈', color: 'from-gray-300 to-gray-500' };
      case 2: return { icon: '🥉', color: 'from-orange-400 to-orange-600' };
      default: return null;
    }
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 0.7) return 'text-green-400';
    if (winRate >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

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

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
        >
          Leaderboard
        </motion.h1>

        <div className="w-24" />
      </header>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8 grid grid-cols-3 gap-4"
      >
        <div className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-700/50 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalPlayers}</div>
          <div className="text-sm text-gray-400">Players</div>
        </div>
        <div className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-700/50 text-center">
          <div className="text-2xl font-bold text-green-400">{totalBattles}</div>
          <div className="text-sm text-gray-400">Battles</div>
        </div>
        <div className="bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-700/50 text-center">
          <div className="text-2xl font-bold text-yellow-400">{totalWins}</div>
          <div className="text-sm text-gray-400">Total Wins</div>
        </div>
      </motion.div>

      {/* Sort Options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto mb-6 flex justify-center gap-2"
      >
        {[
          { key: 'active', label: 'Most Active', icon: TrendingUp },
          { key: 'wins', label: 'Most Wins', icon: Trophy },
          { key: 'playtime', label: 'Playtime', icon: Clock }
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setSortBy(option.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              sortBy === option.key
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-gray-900/60 text-gray-300 hover:bg-gray-800 border border-gray-700/50'
            }`}
          >
            <option.icon className="w-4 h-4" />
            {option.label}
          </button>
        ))}
      </motion.div>

      {/* Leaderboard List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-3"
      >
        {users.slice(0, 50).map((player, index) => {
          const winRate = player.totalBattles > 0 ? player.wins / player.totalBattles : 0;
          const medal = getMedal(index);
          const isCurrentUser = player.username === user;

          return (
            <motion.div
              key={player.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur border transition-all ${
                isCurrentUser
                  ? 'bg-blue-900/30 border-blue-500/50'
                  : 'bg-gray-900/60 border-gray-700/50 hover:border-gray-600'
              }`}
            >
              {/* Rank */}
              <div className="w-12 text-center">
                {medal ? (
                  <span className="text-2xl">{medal.icon}</span>
                ) : (
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">
                  {player.username}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-600 rounded-full">You</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Swords className="w-3 h-3" />
                    {player.totalBattles} battles
                  </span>
                  <span className={`font-bold ${getWinRateColor(winRate)}`}>
                    {Math.round(winRate * 100)}% win rate
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="font-bold text-yellow-400">{player.wins} W</div>
                <div className="text-sm text-gray-400">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {player.playtimeHours.toFixed(1)}h
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {users.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Trophy className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Players Yet</h3>
          <p className="text-gray-400">Be the first to battle and claim the top spot!</p>
        </motion.div>
      )}
    </div>
  );
}

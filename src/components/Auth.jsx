import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, User, Lock, Sparkles } from 'lucide-react';

export function Auth({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isLogin) {
      const result = onLogin(username, password);
      if (!result.success) {
        setError(result.error);
      }
    } else {
      const result = onRegister(username, password);
      if (!result.success) {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent glow-text">
            AI Card Collection
          </h1>
          <p className="text-gray-400 mt-2">Collect, Upgrade, Dominate</p>
        </div>

        {/* Auth Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gray-900/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl"
        >
          {/* Tab切换 */}
          <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </motion.button>
          </form>

          {/* Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? (
              <p>Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)} className="text-blue-400 hover:underline">
                  Register
                </button>
              </p>
            ) : (
              <p>Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="text-green-400 hover:underline">
                  Login
                </button>
              </p>
            )}
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-4 text-center"
        >
          <div>
            <div className="text-2xl mb-1">🎴</div>
            <div className="text-xs text-gray-400">Collect Models</div>
          </div>
          <div>
            <div className="text-2xl mb-1">⚔️</div>
            <div className="text-xs text-gray-400">Play to Earn</div>
          </div>
          <div>
            <div className="text-2xl mb-1">⬆️</div>
            <div className="text-xs text-gray-400">Upgrade</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

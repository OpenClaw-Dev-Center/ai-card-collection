import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  User as UserIcon,
  LogOut as LogOutIcon,
  Play as PlayIcon,
  Grid3x3 as GridIcon,
  Package as PackageIcon,
  Crown as CrownIcon,
  Settings as SettingsIcon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LoginRegister } from './components/LoginRegister';
import { Dashboard } from './components/Dashboard';
import { CardCollection } from './components/CardCollection';
import { PackOpening } from './components/PackOpening';
import { GameMode } from './components/GameMode';
import { DeckBattle } from './components/DeckBattle';
import { Leaderboard } from './components/Leaderboard';
import { ExperienceRoad } from './components/ExperienceRoad';
import { useAuth } from './hooks/useAuth';
import { useGame } from './hooks/useGame';
import { api } from './services/api';
import { battleSocket } from './services/battleSocket';

function App() {
  const { user, login, register, logout, setUser } = useAuth();
  const {
    currency, packs, updateCurrency, updatePacks,
    prestigeCrystals, updatePrestigeCrystals,
    xp, level, unlockedFeatures, claimedLevels, unclaimedCount,
    addXp, claimReward,
  } = useGame(user);
  const [view, setView] = useState(user ? 'dashboard' : 'auth');
  const [openingPack, setOpeningPack] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncError, setSyncError] = useState(null);

  // Check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL || 'http://localhost:3001/health');
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize WebSocket when user logs in
  useEffect(() => {
    if (user && user.id) {
      battleSocket.connect(user.id);
      battleSocket.on('battle_found', (battleId, opponent) => {
        console.log('Battle found:', battleId, opponent);
        // TODO: Navigate to battle view with battleId
      });
      return () => battleSocket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setView('dashboard');
      // Sync user data from backend when online
      if (isOnline) {
        syncFromBackend(user.id);
      }
    } else {
      setView('auth');
    }
  }, [user]);

  const syncFromBackend = async (userId) => {
    try {
      const profile = await api.getProfile(userId);
      // Apply backend data to local state
      localStorage.setItem(`user_${userId}`, JSON.stringify(profile));
      // Could also update auth/user store with latest
    } catch (err) {
      console.error('Failed to sync from backend:', err);
      setSyncError('Using offline data');
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const result = await api.login(email, password);
      setUser({
        id: result.user.id,
        username: result.user.username,
        email: result.user.email
      });
    } catch (err) {
      throw err;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const result = await api.register(username, email, password);
      setUser({
        id: result.user.id,
        username: result.user.username,
        email: result.user.email
      });
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    battleSocket.leaveQueue();
    api.logout();
    setUser(null);
  };

  const handlePackComplete = async (newCards, crystalsEarned = 0) => {
    const finishing = openingPack;
    setOpeningPack(null);
    setView('dashboard');

    if (finishing.fromStock) {
      updatePacks(finishing.packKey, -1);
    } else {
      updateCurrency(-finishing.cost);
    }

    // Save to backend if user is logged in and online
    if (user && user.id) {
      try {
        // Update profile with new collection and crystals
        const collectionKey = `collection_${user.id}`;
        const savedCollectionStr = localStorage.getItem(collectionKey) || '[]';
        const savedCollection = JSON.parse(savedCollectionStr);
        const updatedCollection = [...savedCollection, ...newCards];
        localStorage.setItem(collectionKey, JSON.stringify(updatedCollection));

        if (crystalsEarned > 0) {
          updatePrestigeCrystals(crystalsEarned);
        }

        if (isOnline) {
          await api.updateProfile(user.id, {
            collection: updatedCollection,
            packs: packs,
            prestigeCrystals: prestigeCrystals + crystalsEarned
          });
        }
      } catch (err) {
        console.error('Failed to sync pack complete:', err);
        setSyncError('Changes saved locally only');
      }
    } else {
      // Offline/local only
      const savedCollectionStr = localStorage.getItem(`collection_${user.username}`) || '[]';
      const savedCollection = JSON.parse(savedCollectionStr);
      const updatedCollection = [...savedCollection, ...newCards];
      localStorage.setItem(`collection_${user.username}`, JSON.stringify(updatedCollection));
    }
  };

  const navigateTo = (target) => {
    if (target === 'deck-battle' && !unlockedFeatures.includes('deck-battle')) {
      setView('dashboard');
      return;
    }
    setView(target);
  };

  const viewContent = () => {
    switch (view) {
      case 'auth':
        return <LoginRegister onLogin={handleLogin} onRegister={handleRegister} />;
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            currency={currency}
            packs={packs}
            prestigeCrystals={prestigeCrystals}
            xp={xp}
            level={level}
            unclaimedCount={unclaimedCount}
            unlockedFeatures={unlockedFeatures}
            onLogout={handleLogout}
            onNavigate={navigateTo}
            onPackOpen={handlePackOpen}
            isOnline={isOnline}
          />
        );
      case 'collection':
        return (
          <CardCollection
            user={user}
            onBack={() => setView('dashboard')}
            onXpGain={addXp}
          />
        );
      case 'game':
        return (
          <GameMode
            user={user}
            currency={currency}
            onComplete={(reward) => {
              updateCurrency(reward);
              updatePacks('basic', 1);
              if (user && user.id && isOnline) {
                api.recordBattleResult(user.id, 'win', 0, null); // simplified
              }
              setView('dashboard');
            }}
            onBack={() => setView('dashboard')}
            onXpGain={addXp}
          />
        );
      case 'deck-battle':
        return (
          <DeckBattle
            user={user}
            onComplete={(reward) => {
              updateCurrency(reward);
              if (user && user.id && isOnline) {
                api.recordBattleResult(user.id, 'win', 0, null);
              }
              setView('dashboard');
            }}
            onBack={() => setView('dashboard')}
            onXpGain={addXp}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard
            user={user}
            unlockedFeatures={unlockedFeatures}
            onBack={() => setView('dashboard')}
            isOnline={isOnline}
          />
        );
      case 'experience':
        return (
          <ExperienceRoad
            user={user}
            xp={xp}
            level={level}
            claimedLevels={claimedLevels}
            onClaimReward={claimReward}
            onBack={() => setView('dashboard')}
          />
        );
      case 'pack-opening':
        return openingPack && (
          <PackOpening
            pack={openingPack}
            onComplete={handlePackComplete}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3e] to-[#0a0a1a] text-white relative overflow-hidden">
      {/* Backend status indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {isOnline ? (
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <Wifi size={16} /> Online
          </span>
        ) : (
          <span className="flex items-center gap-1 text-yellow-400 text-sm">
            <WifiOff size={16} /> Offline (local only)
          </span>
        )}
      </div>

      {syncError && (
        <div className="fixed top-12 right-4 z-50 bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-3 py-2 rounded-lg text-sm max-w-sm">
          {syncError}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {viewContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;

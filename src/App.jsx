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
import { TowerDefense } from './components/TowerDefense';
import { BossFight } from './components/BossFight';
import { Leaderboard } from './components/Leaderboard';
import { ExperienceRoad } from './components/ExperienceRoad';
import { TypeChart } from './components/TypeChart';
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
    addXp, claimReward, loadFromBackend,
  } = useGame(user);
  const [view, setView] = useState(user ? 'dashboard' : 'auth');
  const [openingPack, setOpeningPack] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncError, setSyncError] = useState(null);

  // Check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(apiBase.replace('/api', '/health'));
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize WebSocket only when entering deck-battle
  useEffect(() => {
    if (user && user.id && view === 'deck-battle') {
      battleSocket.connect(user.id);
      battleSocket.on('battle_found', (battleId, opponent) => {
        console.log('Battle found:', battleId, opponent);
      });
      return () => battleSocket.disconnect();
    }
  }, [user, view]);

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
      loadFromBackend(profile);
      // Cache collection for CardCollection component
      if (profile.collection) {
        localStorage.setItem(`collection_${userId}`, JSON.stringify(profile.collection));
      }
    } catch (err) {
      // 404 just means no server-side state yet — keep local data silently
      if (!err.message?.includes('Profile not found') && !err.message?.includes('404')) {
        console.error('Failed to sync from backend:', err);
        setSyncError('Using offline data');
      }
    }
  };

  const handleLogin = (user) => {
    setUser({
      id: user.id,
      username: user.username,
      email: user.email
    });
  };

  const handleRegister = (user) => {
    setUser({
      id: user.id,
      username: user.username,
      email: user.email
    });
  };

  const handleLogout = async () => {
    battleSocket.leaveQueue();
    battleSocket.disconnect();
    api.logout();
    setUser(null);
  };

  const handlePackOpen = (packType, packKey) => {
    const ownedCount = packs[packKey] || 0;
    if (ownedCount > 0) {
      setOpeningPack({ ...packType, packKey, fromStock: true });
      setView('pack-opening');
    } else if (!packType.rewardOnly && currency >= packType.cost) {
      setOpeningPack({ ...packType, packKey, fromStock: false });
      setView('pack-opening');
    }
  };

  const handlePackComplete = async (newCards, crystalsEarned = 0) => {
    const finishing = openingPack;
    setOpeningPack(null);
    setView('dashboard');

    // Save to backend if user is logged in and online
    if (user && user.id) {
      try {
        // Backend-authoritative: open pack server-side and trust only returned state.
        if (isOnline) {
          const serverOpen = await api.openPack(user.id, finishing.packKey, finishing.fromStock);
          const serverCards = serverOpen.cards || [];

          // Keep local cache synced for collection-heavy UI reads.
          const collectionKey = `collection_${user.id}`;
          localStorage.setItem(collectionKey, JSON.stringify(serverOpen.profile?.collection || []));

          // Apply authoritative profile to game state
          if (serverOpen.profile) {
            loadFromBackend(serverOpen.profile);
          }

          // Add XP for pack opening based on server-returned actual cards
          addXp(serverCards.length * 10);
          return;
        }

        // Offline fallback (local-only mode)
        const collectionKey = `collection_${user.id}`;
        const savedCollectionStr = localStorage.getItem(collectionKey) || '[]';
        const savedCollection = JSON.parse(savedCollectionStr);
        const updatedCollection = [...savedCollection, ...newCards];
        localStorage.setItem(collectionKey, JSON.stringify(updatedCollection));

        if (crystalsEarned > 0) {
          updatePrestigeCrystals(crystalsEarned);
        }
        if (finishing.fromStock) updatePacks(finishing.packKey, -1);
        else updateCurrency(-finishing.cost);
      } catch (err) {
        console.error('Failed to sync pack complete:', err);
        setSyncError('Changes saved locally only');
      }
    } else {
      // Offline/local only
      const offlineKey = user.id || user.username;
      const savedCollectionStr = localStorage.getItem(`collection_${offlineKey}`) || '[]';
      const savedCollection = JSON.parse(savedCollectionStr);
      const updatedCollection = [...savedCollection, ...newCards];
      localStorage.setItem(`collection_${offlineKey}`, JSON.stringify(updatedCollection));
    }
  };

  const navigateTo = (target) => {
    if (target === 'deck-battle' && !unlockedFeatures.includes('deck-battle')) {
      setView('dashboard');
      return;
    }
    if (target === 'tower-defense' && !unlockedFeatures.includes('tower-defense')) {
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
              setView('dashboard');
            }}
            onBack={() => setView('dashboard')}
            onXpGain={addXp}
          />
        );
      case 'tower-defense':
        return (
          <TowerDefense
            user={user}
            onComplete={(reward) => {
              updateCurrency(reward);
              setView('dashboard');
            }}
            onBack={() => setView('dashboard')}
            onXpGain={addXp}
          />
        );
      case 'boss-fight':
        return (
          <BossFight
            user={user}
            onBack={() => setView('dashboard')}
            onProfileSync={(profile) => {
              loadFromBackend(profile);
              if (profile?.collection && user?.id) {
                localStorage.setItem(`collection_${user.id}`, JSON.stringify(profile.collection));
              }
            }}
          />
        );
      case 'deck-battle':
        return (
          <DeckBattle
            user={user}
            onComplete={(reward) => {
              updateCurrency(reward);
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
      case 'type-chart':
        return <TypeChart onBack={() => setView('dashboard')} />;
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

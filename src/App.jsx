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
  Settings as SettingsIcon
} from 'lucide-react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CardCollection } from './components/CardCollection';
import { PackOpening } from './components/PackOpening';
import { GameMode } from './components/GameMode';
import { DeckBattle } from './components/DeckBattle';
import { Leaderboard } from './components/Leaderboard';
import { ExperienceRoad } from './components/ExperienceRoad';
import { useAuth } from './hooks/useAuth';
import { useGame } from './hooks/useGame';

function App() {
  const { user, login, register, logout } = useAuth();
  const {
    currency, packs, updateCurrency, updatePacks,
    prestigeCrystals, updatePrestigeCrystals,
    xp, level, unlockedFeatures, claimedLevels, unclaimedCount,
    addXp, claimReward,
  } = useGame(user);
  const [view, setView] = useState(user ? 'dashboard' : 'auth');
  // Track which pack key is being opened so we can deduct earned packs
  const [openingPack, setOpeningPack] = useState(null); // { ...packType, packKey }

  useEffect(() => {
    if (user) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  }, [user]);

  const handlePackOpen = (packType, packKey) => {
    const ownedCount = packs[packKey] || 0;
    if (ownedCount > 0) {
      // Consume a pre-owned copy (free — works for both reward-only and regular packs)
      setOpeningPack({ ...packType, packKey, fromStock: true });
      setView('pack-opening');
    } else if (!packType.rewardOnly && currency >= packType.cost) {
      // Buy fresh with currency
      setOpeningPack({ ...packType, packKey, fromStock: false });
      setView('pack-opening');
    }
  };

  const handlePackComplete = (newCards, crystalsEarned = 0) => {
    const finishing = openingPack;
    setOpeningPack(null);
    setView('dashboard');

    if (finishing.fromStock) {
      // Consume one pre-owned pack token
      updatePacks(finishing.packKey, -1);
    } else {
      // Deduct purchase cost (no stock was used)
      updateCurrency(-finishing.cost);
    }

    if (user) {
      const savedCollection = JSON.parse(localStorage.getItem(`collection_${user}`) || '[]');
      const updatedCollection = [...savedCollection, ...newCards];
      localStorage.setItem(`collection_${user}`, JSON.stringify(updatedCollection));
    }

    if (crystalsEarned > 0) {
      updatePrestigeCrystals(crystalsEarned);
    }
  };

  const navigateTo = (target) => {
    if (target === 'deck-battle' && !unlockedFeatures.includes('deck-battle')) {
      // Not yet unlocked – bounce back with a message handled in dashboard
      setView('dashboard');
      return;
    }
    setView(target);
  };

  const viewContent = () => {
    switch (view) {
      case 'auth':
        return <Auth onLogin={login} onRegister={register} />;
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
            onLogout={logout}
            onNavigate={navigateTo}
            onPackOpen={handlePackOpen}
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
              updatePacks('premium', 1);
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
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-500/20 rounded-full particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, User, LogOut, Play, Grid3X3, Package, Crown, Settings } from 'lucide-react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CardCollection } from './components/CardCollection';
import { PackOpening } from './components/PackOpening';
import { GameMode } from './components/GameMode';
import { useAuth } from './hooks/useAuth';
import { useGame } from './hooks/useGame';

function App() {
  const { user, login, register, logout } = useAuth();
  const { currency, packs, updateCurrency, updatePacks } = useGame(user);
  const [view, setView] = useState(user ? 'dashboard' : 'auth');
  const [openingPack, setOpeningPack] = useState(null);

  useEffect(() => {
    if (user) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  }, [user]);

  const handlePackOpen = (packType) => {
    if (currency >= packType.cost) {
      setOpeningPack(packType);
      setView('pack-opening');
    }
  };

  const handlePackComplete = (newCards) => {
    setOpeningPack(null);
    setView('dashboard');

    // Deduct cost
    updateCurrency(-openingPack.cost);

    // Add cards to collection
    if (user) {
      const savedCollection = JSON.parse(localStorage.getItem(`collection_${user}`) || '[]');
      const updatedCollection = [...savedCollection];
      newCards.forEach(card => {
        const existingIndex = updatedCollection.findIndex(c => c.id === card.id);
        if (existingIndex >= 0) {
          updatedCollection[existingIndex] = card;
        } else {
          updatedCollection.push(card);
        }
      });
      localStorage.setItem(`collection_${user}`, JSON.stringify(updatedCollection));
    }
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
            onLogout={logout}
            onNavigate={setView}
            onPackOpen={handlePackOpen}
          />
        );
      case 'collection':
        return <CardCollection user={user} onBack={() => setView('dashboard')} />;
      case 'game':
        return <GameMode user={user} currency={currency} onComplete={(reward) => {
          updateCurrency(reward);
          updatePacks('basic', 1);
          setView('dashboard');
        }} onBack={() => setView('dashboard')} />;
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

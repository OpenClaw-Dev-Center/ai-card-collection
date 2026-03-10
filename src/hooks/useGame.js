import { useState, useEffect } from 'react';
import { levelFromXp, xpToNextLevel, xpForLevel, LEVEL_REWARDS } from '../data/cards';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setUser(saved);
    }
  }, []);

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] && users[username].password === password) {
      setUser(username);
      localStorage.setItem('currentUser', username);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const register = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
      return { success: false, error: 'User already exists' };
    }
    users[username] = { password, createdAt: Date.now() };
    localStorage.setItem('users', JSON.stringify(users));
    setUser(username);
    localStorage.setItem('currentUser', username);
    // Give starting packs
    const collection = [];
    localStorage.setItem(`collection_${username}`, JSON.stringify(collection));
    localStorage.setItem(`currency_${username}`, JSON.stringify(1000));
    localStorage.setItem(`packs_${username}`, JSON.stringify({ basic: 3, premium: 0, mega: 0, legendary: 0 }));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return { user, login, register, logout };
}

export function useGame(user) {
  const [currency, setCurrency] = useState(0);
  const [packs, setPacks] = useState({ basic: 0, premium: 0, mega: 0, legendary: 0 });
  const [prestigeCrystals, setPrestigeCrystals] = useState(0);
  const [xp, setXp] = useState(0);
  const [unlockedFeatures, setUnlockedFeatures] = useState(['game']); // deck-battle, leaderboard added via rewards
  const [claimedLevels, setClaimedLevels] = useState([]); // list of level numbers already claimed

  useEffect(() => {
    if (user) {
      const savedCurrency = JSON.parse(localStorage.getItem(`currency_${user}`) || '1000');
      const savedPacks = JSON.parse(localStorage.getItem(`packs_${user}`) || '{"basic":3,"premium":0,"mega":0,"legendary":0}');
      const savedCrystals = JSON.parse(localStorage.getItem(`prestige_${user}`) || '0');
      const savedXp = JSON.parse(localStorage.getItem(`xp_${user}`) || '0');
      const savedUnlocks = JSON.parse(localStorage.getItem(`unlocks_${user}`) || '["game"]');
      const savedClaimed = JSON.parse(localStorage.getItem(`claimedLevels_${user}`) || '[]');
      setCurrency(savedCurrency);
      setPacks(savedPacks);
      setPrestigeCrystals(savedCrystals);
      setXp(savedXp);
      setUnlockedFeatures(savedUnlocks);
      setClaimedLevels(savedClaimed);
    } else {
      setCurrency(0);
      setPacks({ basic: 0, premium: 0, mega: 0, legendary: 0 });
      setPrestigeCrystals(0);
      setXp(0);
      setUnlockedFeatures(['game']);
      setClaimedLevels([]);
    }
  }, [user]);

  const updateCurrency = (amount) => {
    const newCurrency = Math.max(0, currency + amount);
    setCurrency(newCurrency);
    if (user) {
      localStorage.setItem(`currency_${user}`, JSON.stringify(newCurrency));
    }
  };

  const updatePacks = (type, amount) => {
    const newPacks = { ...packs, [type]: Math.max(0, (packs[type] || 0) + amount) };
    setPacks(newPacks);
    if (user) {
      localStorage.setItem(`packs_${user}`, JSON.stringify(newPacks));
    }
  };

  const updatePrestigeCrystals = (amount) => {
    const newVal = Math.max(0, prestigeCrystals + amount);
    setPrestigeCrystals(newVal);
    if (user) {
      localStorage.setItem(`prestige_${user}`, JSON.stringify(newVal));
    }
  };

  const level = levelFromXp(xp);

  const addXp = (amount) => {
    const prevLevel = levelFromXp(xp);
    const newXp = xp + amount;
    const newLevel = levelFromXp(newXp);
    setXp(newXp);
    if (user) localStorage.setItem(`xp_${user}`, JSON.stringify(newXp));
    if (newLevel > prevLevel) {
      const newUnlocks = [...unlockedFeatures];
      for (let l = prevLevel + 1; l <= newLevel; l++) {
        const reward = LEVEL_REWARDS[l];
        if (reward?.unlock && !newUnlocks.includes(reward.unlock)) {
          newUnlocks.push(reward.unlock);
        }
      }
      if (newUnlocks.length !== unlockedFeatures.length) {
        setUnlockedFeatures(newUnlocks);
        if (user) localStorage.setItem(`unlocks_${user}`, JSON.stringify(newUnlocks));
      }
    }
  };

  const claimReward = (rewardLevel) => {
    if (claimedLevels.includes(rewardLevel)) return false;
    const reward = LEVEL_REWARDS[rewardLevel];
    if (!reward || level < rewardLevel) return false;
    const newPacks = { ...packs };
    Object.entries(reward.packs || {}).forEach(([packType, count]) => {
      newPacks[packType] = (newPacks[packType] || 0) + count;
    });
    setPacks(newPacks);
    if (user) localStorage.setItem(`packs_${user}`, JSON.stringify(newPacks));
    const newClaimed = [...claimedLevels, rewardLevel];
    setClaimedLevels(newClaimed);
    if (user) localStorage.setItem(`claimedLevels_${user}`, JSON.stringify(newClaimed));
    return true;
  };

  const unclaimedCount = Object.keys(LEVEL_REWARDS).filter(
    l => Number(l) <= level && !claimedLevels.includes(Number(l))
  ).length;

  return {
    currency, packs, updateCurrency, updatePacks,
    prestigeCrystals, updatePrestigeCrystals,
    xp, level, unlockedFeatures, claimedLevels, unclaimedCount,
    addXp, claimReward,
  };
}

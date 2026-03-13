import { useState, useEffect } from 'react';
import { levelFromXp, xpToNextLevel, xpForLevel, LEVEL_REWARDS } from '../data/cards';
import { api } from '../services/api';

function getUserKey(user) {
  // Accept either string username or user object with username
  return typeof user === 'string' ? user : user?.username;
}

export function useGame(user) {
  const [currency, setCurrency] = useState(0);
  const [packs, setPacks] = useState({ basic: 0, premium: 0, mega: 0, legendary: 0 });
  const [prestigeCrystals, setPrestigeCrystals] = useState(0);
  const [xp, setXp] = useState(0);
  const [unlockedFeatures, setUnlockedFeatures] = useState(['game']);
  const [claimedLevels, setClaimedLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const key = getUserKey(user);
    if (key) {
      try {
        const savedCurrency = JSON.parse(localStorage.getItem(`currency_${key}`) || '0');
        const savedPacks = JSON.parse(localStorage.getItem(`packs_${key}`) || '{"basic":0,"premium":0,"mega":0,"legendary":0}');
        const savedCrystals = JSON.parse(localStorage.getItem(`prestige_${key}`) || '0');
        const savedXp = JSON.parse(localStorage.getItem(`xp_${key}`) || '0');
        const savedUnlocks = JSON.parse(localStorage.getItem(`unlocks_${key}`) || '["game"]');
        const savedClaimed = JSON.parse(localStorage.getItem(`claimedLevels_${key}`) || '[]');
        setCurrency(savedCurrency);
        setPacks(savedPacks);
        setPrestigeCrystals(savedCrystals);
        setXp(savedXp);
        setUnlockedFeatures(savedUnlocks);
        setClaimedLevels(savedClaimed);
      } catch (e) {
        console.error('Failed to load game state from localStorage:', e);
      }
    } else {
      // Reset when logged out
      setCurrency(0);
      setPacks({ basic: 0, premium: 0, mega: 0, legendary: 0 });
      setPrestigeCrystals(0);
      setXp(0);
      setUnlockedFeatures(['game']);
      setClaimedLevels([]);
    }
    setLoading(false);
  }, [user]);

  const updateCurrency = (amount) => {
    const newCurrency = Math.max(0, currency + amount);
    setCurrency(newCurrency);
    const key = getUserKey(user);
    if (key) {
      localStorage.setItem(`currency_${key}`, JSON.stringify(newCurrency));
    }
  };

  const updatePacks = (type, amount) => {
    const newPacks = { ...packs, [type]: Math.max(0, (packs[type] || 0) + amount) };
    setPacks(newPacks);
    const key = getUserKey(user);
    if (key) {
      localStorage.setItem(`packs_${key}`, JSON.stringify(newPacks));
    }
  };

  const updatePrestigeCrystals = (amount) => {
    const newVal = Math.max(0, prestigeCrystals + amount);
    setPrestigeCrystals(newVal);
    const key = getUserKey(user);
    if (key) {
      localStorage.setItem(`prestige_${key}`, JSON.stringify(newVal));
    }
  };

  const level = levelFromXp(xp);

  const addXp = (amount) => {
    const prevLevel = levelFromXp(xp);
    const newXp = xp + amount;
    const newLevel = levelFromXp(newXp);
    setXp(newXp);
    const key = getUserKey(user);
    if (key) {
      localStorage.setItem(`xp_${key}`, JSON.stringify(newXp));
      if (user?.id) {
        api.syncProgression(user.id, { xp: newXp }).catch(() => {});
      }
    }
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
        if (key) localStorage.setItem(`unlocks_${key}`, JSON.stringify(newUnlocks));
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
    const key = getUserKey(user);
    if (key) localStorage.setItem(`packs_${key}`, JSON.stringify(newPacks));
    // Grant prestige crystals if the reward includes them
    if (reward.crystals) {
      const newCrystals = prestigeCrystals + reward.crystals;
      setPrestigeCrystals(newCrystals);
      if (key) localStorage.setItem(`prestige_${key}`, JSON.stringify(newCrystals));
    }
    const newClaimed = [...claimedLevels, rewardLevel];
    setClaimedLevels(newClaimed);
    if (key) localStorage.setItem(`claimedLevels_${key}`, JSON.stringify(newClaimed));
    if (user?.id) {
      const syncPayload = {
        xp,
        unlockedFeatures,
        claimedLevels: newClaimed,
      };
      api.syncProgression(user.id, syncPayload).catch(() => {});
    }
    return true;
  };

  // Load authoritative state from backend profile response
  const loadFromBackend = (profile) => {
    const key = getUserKey(user);
    if (!profile || !key) return;
    const newCurrency = profile.credits ?? currency;
    const newPacks = profile.packs ? { basic: 0, premium: 0, mega: 0, legendary: 0, ...profile.packs } : packs;
    const newCrystals = profile.prestigeCrystals ?? prestigeCrystals;
    const backendXp = Number(profile.stats?.xp ?? 0);
    const newXp = Math.max(backendXp, Number(xp || 0));
    const backendUnlocks = Array.isArray(profile.stats?.unlockedFeatures) ? profile.stats.unlockedFeatures : null;
    const backendClaimed = Array.isArray(profile.stats?.claimedLevels) ? profile.stats.claimedLevels : null;
    setCurrency(newCurrency);
    setPacks(newPacks);
    setPrestigeCrystals(newCrystals);
    setXp(newXp);
    if (backendUnlocks) setUnlockedFeatures(backendUnlocks);
    if (backendClaimed) setClaimedLevels(backendClaimed);
    localStorage.setItem(`currency_${key}`, JSON.stringify(newCurrency));
    localStorage.setItem(`packs_${key}`, JSON.stringify(newPacks));
    localStorage.setItem(`prestige_${key}`, JSON.stringify(newCrystals));
    localStorage.setItem(`xp_${key}`, JSON.stringify(newXp));
    if (backendUnlocks) localStorage.setItem(`unlocks_${key}`, JSON.stringify(backendUnlocks));
    if (backendClaimed) localStorage.setItem(`claimedLevels_${key}`, JSON.stringify(backendClaimed));

    // Heal stale backend progression forward once per sync when local is ahead.
    if (user?.id && backendXp < newXp) {
      api.syncProgression(user.id, {
        xp: newXp,
        unlockedFeatures: backendUnlocks || unlockedFeatures,
        claimedLevels: backendClaimed || claimedLevels,
      }).catch(() => {});
    }
    // Restore wins/playtime into the 'users' key that Dashboard reads
    if (profile.stats) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      users[key] = {
        ...(users[key] || {}),
        wins: profile.stats.wins ?? (users[key]?.wins || 0),
        playtimeHours: profile.stats.playtimeHours ?? (users[key]?.playtimeHours || 0),
      };
      localStorage.setItem('users', JSON.stringify(users));
    }
  };

  const unclaimedCount = Object.keys(LEVEL_REWARDS).filter(
    l => Number(l) <= level && !claimedLevels.includes(Number(l))
  ).length;

  return {
    currency, packs, updateCurrency, updatePacks,
    prestigeCrystals, updatePrestigeCrystals,
    xp, level, unlockedFeatures, claimedLevels, unclaimedCount, loading,
    addXp, claimReward, loadFromBackend,
  };
}

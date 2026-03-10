import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (user) {
      const savedCurrency = JSON.parse(localStorage.getItem(`currency_${user}`) || '1000');
      const savedPacks = JSON.parse(localStorage.getItem(`packs_${user}`) || '{"basic":3,"premium":0,"mega":0,"legendary":0}');
      const savedCrystals = JSON.parse(localStorage.getItem(`prestige_${user}`) || '0');
      setCurrency(savedCurrency);
      setPacks(savedPacks);
      setPrestigeCrystals(savedCrystals);
    } else {
      setCurrency(0);
      setPacks({ basic: 0, premium: 0, mega: 0, legendary: 0 });
      setPrestigeCrystals(0);
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
    const newPacks = { ...packs, [type]: Math.max(0, packs[type] + amount) };
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

  return { currency, packs, updateCurrency, updatePacks, prestigeCrystals, updatePrestigeCrystals };
}

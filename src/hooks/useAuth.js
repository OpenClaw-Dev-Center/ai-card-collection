import { useState, useEffect } from 'react';
import { CARD_POOL } from '../data/cards';

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
    // Give 3 random starter cards (prefer Common/Rare, avoid low-tier duplicates too much)
    const starterRarities = ['COMMON', 'COMMON', 'RARE'];
    for (let i = 0; i < 3; i++) {
      const rarity = starterRarities[i];
      const eligible = CARD_POOL.filter(c => c.rarity === rarity);
      const randomCard = eligible[Math.floor(Math.random() * eligible.length)];
      if (randomCard) {
        collection.push({
          ...randomCard,
          id: `${randomCard.baseId}-starter-${Date.now()}-${i}`
        });
      }
    }

    localStorage.setItem(`collection_${username}`, JSON.stringify(collection));
    localStorage.setItem(`currency_${username}`, JSON.stringify(500));
    localStorage.setItem(`packs_${username}`, JSON.stringify({ basic: 2, premium: 0, mega: 0, legendary: 0 }));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return { user, login, register, logout };
}

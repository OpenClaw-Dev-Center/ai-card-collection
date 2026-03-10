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
    users[username] = { password, createdAt: Date.now(), playtimeHours: 0 };
    localStorage.setItem('users', JSON.stringify(users));
    setUser(username);
    localStorage.setItem('currentUser', username);

    // New accounts start with almost nothing - must play to earn
    const collection = [];

    // Give 1 random Common card (the absolute basics)
    const commonCards = CARD_POOL.filter(c => c.rarity === 'COMMON');
    if (commonCards.length > 0) {
      const randomCard = commonCards[Math.floor(Math.random() * commonCards.length)];
      collection.push({
        ...randomCard,
        id: `${randomCard.baseId}-starter-${Date.now()}`
      });
    }

    localStorage.setItem(`collection_${username}`, JSON.stringify(collection));
    localStorage.setItem(`currency_${username}`, JSON.stringify(0)); // No starting credits
    localStorage.setItem(`packs_${username}`, JSON.stringify({ basic: 0, premium: 0, mega: 0, legendary: 0 }));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return { user, login, register, logout };
}

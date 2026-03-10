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
    users[username] = {
      password,
      createdAt: Date.now(),
      playtimeHours: 0,
      wins: 0,
      losses: 0,
      totalBattles: 0
    };
    localStorage.setItem('users', JSON.stringify(users));
    setUser(username);
    localStorage.setItem('currentUser', username);

    // Give 3 distinct starter Common cards so the player can battle immediately
    const collection = [];
    const commonCards = CARD_POOL.filter(c => c.rarity === 'COMMON');
    const shuffled = [...commonCards].sort(() => Math.random() - 0.5);
    const starterCards = shuffled.slice(0, Math.min(3, shuffled.length));
    starterCards.forEach((card, i) => {
      collection.push({
        ...card,
        id: `${card.baseId}-starter-${Date.now()}-${i}`
      });
    });

    localStorage.setItem(`collection_${username}`, JSON.stringify(collection));
    localStorage.setItem(`currency_${username}`, JSON.stringify(0));
    // Give 1 basic pack so the player can expand their collection right away
    localStorage.setItem(`packs_${username}`, JSON.stringify({ basic: 1, premium: 0, mega: 0, legendary: 0 }));
    return { success: true };
  };

  const recordBattle = (result) => {
    if (!user) return;
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[user]) {
      users[user].totalBattles = (users[user].totalBattles || 0) + 1;
      users[user].playtimeHours = (users[user].playtimeHours || 0) + 0.1;
      if (result === 'win') {
        users[user].wins = (users[user].wins || 0) + 1;
      } else if (result === 'loss') {
        users[user].losses = (users[user].losses || 0) + 1;
      }
      localStorage.setItem('users', JSON.stringify(users));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return { user, login, register, logout, recordBattle };
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { battleSocket } from '../services/battleSocket';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Check for legacy localStorage user (offline fallback)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
          } catch {
            localStorage.removeItem('currentUser');
          }
        }
        setLoading(false);
        return;
      }

      // Validate token with backend
      try {
        const res = await api.me();
        setUser(res.user);
      } catch (err) {
        console.error('Auth validation failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const result = await api.register(username, email, password);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    battleSocket.leaveQueue();
    setUser(null);
  }, []);

  // Helper: extract userId from JWT (for quick validation before API call)
  // This is a simple base64 decode - in production might need verification
  const userIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  return { user, loading, login, register, logout };
}

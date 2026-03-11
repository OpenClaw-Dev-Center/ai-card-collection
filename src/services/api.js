import { get } from 'svelte/store';
import { user } from '../stores/auth.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired or invalid
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(username, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    this.setToken(res.token);
    return res;
  }

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  async logout() {
    this.setToken(null);
  }

  // User profile
  async getProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(userId, updates) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async recordBattleResult(userId, result, turnCount, opponentId) {
    return this.request(`/users/${userId}/battle/result`, {
      method: 'POST',
      body: JSON.stringify({ result, turnCount, opponentId })
    });
  }

  // Leaderboard
  async getLeaderboard(sort = 'active', limit = 100) {
    return this.request(`/leaderboard?sort=${sort}&limit=${limit}`);
  }
}

export const api = new ApiClient();

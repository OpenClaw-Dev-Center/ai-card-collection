class BattleSocket {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  connect(userId) {
    this.userId = userId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}/socket`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
      // Join matchmaking queue automatically
      this.joinQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      this.emit('error', err);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => {
        this.connect(this.userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'queued':
        this.emit('queued', data.position);
        break;
      case 'battle_found':
        this.emit('battle_found', data.battleId, data.opponent);
        break;
      case 'battle_update':
        this.emit('opponent_move', data.battleId, data.playerMove);
        break;
      case 'turn_update':
        this.emit('turn_update', data);
        break;
      case 'error':
        this.emit('error', data.message);
        break;
    }
  }

  joinQueue(deckId = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'join_queue',
        userId: this.userId
      });
    }
  }

  leaveQueue() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'leave_queue',
        userId: this.userId
      });
    }
  }

  sendMove(battleId, move) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'battle_move',
        battleId,
        userId: this.userId,
        move
      });
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(...args));
    }
  }
}

export const battleSocket = new BattleSocket();

// Minimal REST + WebSocket client for Homely / Onesti SDK.
const axios = require('axios');
const io = require('socket.io-client');

class HomelyClient {
  constructor(log, { username, password, baseUrl, wsUrl, logVerbose }) {
    this.log = log;
    this.username = username;
    this.password = password;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.wsUrl = wsUrl;
    this.logVerbose = !!logVerbose;

    this.token = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    this.ws = null;
  }

  // Get access token
  async login() {
    const url = `${this.baseUrl}/oauth/token`;
    const { data } = await axios.post(url, { username: this.username, password: this.password }, { timeout: 10000 });
    this.token = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = Date.now() + (data.expires_in - 5) * 1000;
    if (this.logVerbose) this.log('[Homely] Logged in');
  }

  // Ensure token is valid
  async ensureAuth() {
    if (!this.token || Date.now() >= this.expiresAt) {
      if (this.refreshToken) {
        try {
          const url = `${this.baseUrl}/oauth/refresh-token`;
          const { data } = await axios.post(url, { refresh_token: this.refreshToken }, { timeout: 10000 });
          this.token = data.access_token;
          this.refreshToken = data.refresh_token;
          this.expiresAt = Date.now() + (data.expires_in - 5) * 1000;
          if (this.logVerbose) this.log('[Homely] Token refreshed');
          return;
        } catch (e) {
          this.log('[Homely] Refresh failed, logging in again');
        }
      }
      await this.login();
    }
  }

  // List locations
  async getLocations() {
    await this.ensureAuth();
    const url = `${this.baseUrl}/locations`;
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${this.token}` }, timeout: 10000 });
    return data;
  }

  // Location details: devices and states
  async getHome(locationId) {
    await this.ensureAuth();
    const url = `${this.baseUrl}/home/${encodeURIComponent(locationId)}`;
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${this.token}` }, timeout: 15000 });
    return data;
  }

  // Live updates
  connectWebSocket(locationId, onEvent) {
    const socket = io(this.wsUrl, {
      transports: ['polling', 'websocket'],
      transportOptions: { polling: { extraHeaders: { Authorization: `Bearer ${this.token}` } } },
      query: { locationId }
    });

    socket.on('connect', () => this.log('[Homely] WS connected'));
    socket.on('disconnect', (r) => this.log('[Homely] WS disconnected:', r));
    socket.on('event', (data) => { if (this.logVerbose) this.log('[Homely] WS event:', JSON.stringify(data).slice(0, 300)); onEvent && onEvent(data); });
    socket.on('connect_error', (err) => this.log('[Homely] WS error:', err.message));
    this.ws = socket;
  }

  // Close WS
  closeWebSocket() {
    if (this.ws) { this.ws.close(); this.ws = null; }
  }
}

module.exports = { HomelyClient };
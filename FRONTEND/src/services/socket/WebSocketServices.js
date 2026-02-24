// ─── services/socket/WebSocketService.js ─────────────────────────────────────
class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
  }

  connect(url) {
    // In production with socket.io-client:
    // import io from 'socket.io-client';
    // this.socket = io(url, { transports: ['websocket'] });
    console.log('[WebSocket] Connecting to', url);
    this.connected = true;
    this._simulateConnection();
  }

  _simulateConnection() {
    // Simulates real-time vehicle position updates for demo
    this.simulationInterval = setInterval(() => {
      const fakePosition = {
        lat: 28.6139 + (Math.random() - 0.5) * 0.01,
        lng: 77.2090 + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(40 + Math.random() * 40),
        heading: Math.floor(Math.random() * 360),
        timestamp: Date.now(),
      };
      this._emit('vehicle_position', fakePosition);
    }, 2000);
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    // In production: this.socket.emit(event, data);
    console.log('[WebSocket] Emitting:', event, data);
  }

  disconnect() {
    clearInterval(this.simulationInterval);
    this.connected = false;
    console.log('[WebSocket] Disconnected');
  }

  // Track a specific booking
  trackBooking(bookingId, type = 'medical') {
    this.emit('track_booking', { bookingId, type });
  }

  // Send driver location (from driver app)
  updateDriverLocation(position) {
    this.emit('driver_location_update', position);
  }

  // Subscribe to lane-clear notifications
  subscribeToLaneClear(lat, lng, radius = 2000) {
    this.emit('subscribe_lane_clear', { lat, lng, radius });
  }
}

// Singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
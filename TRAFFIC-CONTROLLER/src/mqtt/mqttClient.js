const mqtt = require('mqtt');
const logger = require('../utils/logger');
const signalController = require('../controllers/signalController');

class MQTTClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  /**
   * Connect to MQTT broker
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const options = {
        clientId: process.env.MQTT_CLIENT_ID || 'traffic-controller-001',
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD) || 5000,
        clean: true,
        keepalive: 60
      };

      this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

      this.client.on('connect', () => {
        logger.info('✅ MQTT Client connected to broker');
        this.connected = true;
        this.subscribeToTopics();
        resolve();
      });

      this.client.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.client.on('offline', () => {
        logger.warn('MQTT client offline');
        this.connected = false;
      });

      this.client.on('reconnect', () => {
        logger.info('MQTT client reconnecting...');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });
    });
  }

  /**
   * Subscribe to all necessary topics
   */
  subscribeToTopics() {
    const topics = [
      'traffic/signals/+/status',      // Individual signal status
      'traffic/signals/+/feedback',    // Signal feedback
      'emergency/vehicles/+/location', // Emergency vehicle locations
      'emergency/corridor/+/request',  // Green corridor requests
      'traffic/network/status'         // Network-wide status
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          logger.info(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  /**
   * Subscribe to emergency vehicle updates
   */
  subscribeToEmergencyVehicles() {
    this.client.subscribe('emergency/vehicles/#', { qos: 1 });
    logger.info('Subscribed to emergency vehicle topics');
  }

  /**
   * Handle incoming MQTT messages
   */
  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      logger.debug(`Received message on ${topic}:`, payload);

      if (topic.startsWith('traffic/signals/')) {
        this.handleSignalMessage(topic, payload);
      } else if (topic.startsWith('emergency/vehicles/')) {
        this.handleEmergencyVehicleMessage(topic, payload);
      } else if (topic.startsWith('emergency/corridor/')) {
        this.handleCorridorRequest(topic, payload);
      }
    } catch (error) {
      logger.error(`Error handling message from ${topic}:`, error);
    }
  }

  /**
   * Handle traffic signal status messages
   */
  handleSignalMessage(topic, payload) {
    const signalId = topic.split('/')[2];
    
    if (topic.endsWith('/status')) {
      signalController.updateSignalStatus(signalId, payload);
    } else if (topic.endsWith('/feedback')) {
      logger.info(`Signal ${signalId} feedback:`, payload);
    }
  }

  /**
   * Handle emergency vehicle location updates
   */
  handleEmergencyVehicleMessage(topic, payload) {
    const vehicleId = topic.split('/')[2];
    logger.info(`Emergency vehicle ${vehicleId} location update:`, payload);
    
    // Process vehicle location and update green corridor if needed
    signalController.processVehicleLocation(vehicleId, payload);
  }

  /**
   * Handle green corridor requests
   */
  handleCorridorRequest(topic, payload) {
    logger.info('Green corridor request received:', payload);
    signalController.processCorridorRequest(payload);
  }

  /**
   * Send signal control command
   */
  sendSignalCommand(signalId, command) {
    if (!this.connected) {
      logger.error('Cannot send command - MQTT client not connected');
      return false;
    }

    const topic = `traffic/signals/${signalId}/command`;
    const payload = JSON.stringify({
      command: command.action,
      duration: command.duration,
      priority: command.priority,
      timestamp: new Date().toISOString(),
      source: 'traffic-controller'
    });

    this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
      if (err) {
        logger.error(`Failed to send command to signal ${signalId}:`, err);
      } else {
        logger.info(`Command sent to signal ${signalId}:`, command);
      }
    });

    return true;
  }

  /**
   * Create green corridor by sending commands to multiple signals
   */
  createGreenCorridor(signalIds, duration) {
    const corridor = {
      id: `corridor-${Date.now()}`,
      signals: signalIds,
      duration,
      createdAt: new Date().toISOString()
    };

    signalIds.forEach(signalId => {
      this.sendSignalCommand(signalId, {
        action: 'GREEN_OVERRIDE',
        duration: duration || parseInt(process.env.EMERGENCY_GREEN_CORRIDOR_DURATION),
        priority: 10
      });
    });

    // Publish corridor creation event
    this.client.publish('emergency/corridor/created', JSON.stringify(corridor), { qos: 1 });

    return corridor;
  }

  /**
   * Clear green corridor
   */
  clearGreenCorridor(signalIds) {
    signalIds.forEach(signalId => {
      this.sendSignalCommand(signalId, {
        action: 'RESET_TO_NORMAL',
        priority: 0
      });
    });

    // Publish corridor cleared event
    this.client.publish('emergency/corridor/cleared', JSON.stringify({
      signals: signalIds,
      timestamp: new Date().toISOString()
    }), { qos: 1 });

    logger.info(`Green corridor cleared for ${signalIds.length} signals`);
  }

  /**
   * Send emergency alert to all signals in area
   */
  broadcastEmergencyAlert(area, vehicleType) {
    const alert = {
      type: 'EMERGENCY_ALERT',
      vehicleType,
      area,
      timestamp: new Date().toISOString()
    };

    this.client.publish('traffic/emergency/alert', JSON.stringify(alert), { qos: 1 });
    logger.info('Emergency alert broadcasted:', alert);
  }

  /**
   * Request signal status update
   */
  requestSignalStatus(signalId) {
    const topic = `traffic/signals/${signalId}/request-status`;
    this.client.publish(topic, JSON.stringify({ requestId: Date.now() }), { qos: 1 });
  }

  /**
   * Publish vehicle tracking update
   */
  publishVehicleTracking(vehicleId, location, eta) {
    const topic = `emergency/vehicles/${vehicleId}/tracking`;
    const payload = {
      vehicleId,
      location,
      eta,
      timestamp: new Date().toISOString()
    };

    this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }

  /**
   * Check if client is connected
   */
  isConnected() {
    return this.connected && this.client && !this.client.disconnecting;
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end(() => {
        logger.info('MQTT client disconnected');
        this.connected = false;
      });
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connected: this.connected,
      subscriptions: this.subscriptions.size,
      broker: process.env.MQTT_BROKER_URL
    };
  }
}

// Export singleton instance
module.exports = new MQTTClient();
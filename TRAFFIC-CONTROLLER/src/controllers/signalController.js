const mqttClient = require('../mqtt/mqttClient');
const logger = require('../utils/logger');
const geoUtils = require('../utils/geoUtils');

// In-memory storage for signal states
const signalStates = new Map();
const overrideHistory = [];
const activeOverrides = new Map();

class SignalController {
  constructor() {
    this.signals = new Map();
    this.initializeSignals();
  }

  /**
   * Initialize traffic signals with default configuration
   */
  initializeSignals() {
    // This would normally load from database
    // For now, we'll create sample signals
    logger.info('Initializing traffic signals...');
  }

  /**
   * Register a new traffic signal
   */
  registerSignal(signalId, location, config) {
    const signal = {
      id: signalId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      state: 'RED',
      normalCycle: {
        green: config.greenDuration || 45000,
        yellow: config.yellowDuration || 3000,
        red: config.redDuration || 60000
      },
      currentOverride: null,
      lastUpdate: new Date(),
      status: 'ONLINE'
    };

    this.signals.set(signalId, signal);
    signalStates.set(signalId, signal);
    
    logger.info(`Signal registered: ${signalId} at (${location.latitude}, ${location.longitude})`);
    
    return signal;
  }

  /**
   * Update signal status from MQTT feedback
   */
  updateSignalStatus(signalId, status) {
    const signal = this.signals.get(signalId) || signalStates.get(signalId);
    
    if (signal) {
      signal.state = status.state || signal.state;
      signal.lastUpdate = new Date();
      signal.status = status.status || 'ONLINE';
      
      this.signals.set(signalId, signal);
      signalStates.set(signalId, signal);
      
      logger.debug(`Signal ${signalId} status updated:`, status);
    }
  }

  /**
   * Get signal status
   */
  async getSignalStatus(req, res) {
    try {
      const { signalId } = req.params;
      
      const signal = signalStates.get(signalId);
      
      if (!signal) {
        return res.status(404).json({
          success: false,
          message: 'Signal not found'
        });
      }

      // Request fresh status from signal
      mqttClient.requestSignalStatus(signalId);

      res.json({
        success: true,
        data: {
          signal: {
            id: signal.id,
            state: signal.state,
            location: signal.location,
            status: signal.status,
            lastUpdate: signal.lastUpdate,
            override: signal.currentOverride
          }
        }
      });
    } catch (error) {
      logger.error('Get signal status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get signal status'
      });
    }
  }

  /**
   * Get all signals
   */
  async getAllSignals(req, res) {
    try {
      const signals = Array.from(signalStates.values()).map(signal => ({
        id: signal.id,
        state: signal.state,
        location: signal.location,
        status: signal.status,
        override: signal.currentOverride !== null
      }));

      res.json({
        success: true,
        count: signals.length,
        data: { signals }
      });
    } catch (error) {
      logger.error('Get all signals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get signals'
      });
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(req, res) {
    try {
      const signals = Array.from(signalStates.values());
      
      const stats = {
        total: signals.length,
        online: signals.filter(s => s.status === 'ONLINE').length,
        offline: signals.filter(s => s.status === 'OFFLINE').length,
        overridden: signals.filter(s => s.currentOverride !== null).length,
        states: {
          green: signals.filter(s => s.state === 'GREEN').length,
          yellow: signals.filter(s => s.state === 'YELLOW').length,
          red: signals.filter(s => s.state === 'RED').length
        }
      };

      res.json({
        success: true,
        data: {
          network: stats,
          mqttConnected: mqttClient.isConnected(),
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      logger.error('Get network status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get network status'
      });
    }
  }

  /**
   * Get override statistics
   */
  async getOverrideStats(req, res) {
    try {
      const stats = {
        totalOverrides: overrideHistory.length,
        activeOverrides: activeOverrides.size,
        last24Hours: overrideHistory.filter(o => 
          Date.now() - new Date(o.timestamp).getTime() < 24 * 60 * 60 * 1000
        ).length,
        byType: {}
      };

      // Count by override type
      overrideHistory.forEach(override => {
        stats.byType[override.reason] = (stats.byType[override.reason] || 0) + 1;
      });

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Get override stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get stats'
      });
    }
  }

  /**
   * Override signal manually
   */
  overrideSignal(signalId, command, reason, duration) {
    const signal = signalStates.get(signalId);
    
    if (!signal) {
      logger.error(`Signal ${signalId} not found`);
      return false;
    }

    // Create override record
    const override = {
      signalId,
      command,
      reason,
      duration,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + (duration || 60000))
    };

    // Store override
    signal.currentOverride = override;
    activeOverrides.set(signalId, override);
    overrideHistory.push(override);

    // Send MQTT command
    mqttClient.sendSignalCommand(signalId, {
      action: command,
      duration,
      priority: 10
    });

    // Auto-clear override after duration
    setTimeout(() => {
      this.clearOverride(signalId);
    }, duration || 60000);

    logger.info(`Signal ${signalId} overridden: ${command} for ${duration}ms`);
    
    return true;
  }

  /**
   * Clear signal override
   */
  clearOverride(signalId) {
    const signal = signalStates.get(signalId);
    
    if (signal && signal.currentOverride) {
      signal.currentOverride = null;
      activeOverrides.delete(signalId);
      
      // Reset to normal operation
      mqttClient.sendSignalCommand(signalId, {
        action: 'RESET_TO_NORMAL',
        priority: 0
      });

      logger.info(`Override cleared for signal ${signalId}`);
    }
  }

  /**
   * Process emergency vehicle location and adjust signals
   */
  processVehicleLocation(vehicleId, locationData) {
    const { latitude, longitude, heading, speed, eta } = locationData;
    
    // Find signals within range of vehicle's path
    const nearbySignals = this.findSignalsInPath(
      { latitude, longitude },
      heading,
      speed,
      eta
    );

    // Override nearby signals to green
    nearbySignals.forEach(signal => {
      this.overrideSignal(
        signal.id,
        'GREEN_OVERRIDE',
        `Emergency vehicle ${vehicleId} approaching`,
        parseInt(process.env.EMERGENCY_GREEN_CORRIDOR_DURATION)
      );
    });

    logger.info(`Processed location for vehicle ${vehicleId}, adjusted ${nearbySignals.length} signals`);
  }

  /**
   * Find signals in vehicle's projected path
   */
  findSignalsInPath(location, heading, speed, eta) {
    const signals = Array.from(signalStates.values());
    const radius = parseInt(process.env.ROUTE_BUFFER_RADIUS) || 500;
    
    return signals.filter(signal => {
      const distance = geoUtils.calculateDistance(
        location,
        signal.location
      );
      
      // Signal is within radius
      return distance <= radius;
    });
  }

  /**
   * Process green corridor request
   */
  processCorridorRequest(requestData) {
    const { vehicleId, route, vehicleType, priority } = requestData;
    
    logger.info(`Processing corridor request for ${vehicleType} ${vehicleId}`);
    
    // Extract signals along route
    const signalsOnRoute = this.extractSignalsFromRoute(route);
    
    // Create green corridor
    signalsOnRoute.forEach(signalId => {
      this.overrideSignal(
        signalId,
        'GREEN_OVERRIDE',
        `Green corridor for ${vehicleType}`,
        parseInt(process.env.EMERGENCY_GREEN_CORRIDOR_DURATION)
      );
    });

    return {
      corridorId: `corridor-${vehicleId}-${Date.now()}`,
      signals: signalsOnRoute,
      vehicleId,
      createdAt: new Date()
    };
  }

  /**
   * Extract signal IDs from route
   */
  extractSignalsFromRoute(route) {
    if (!route || !route.coordinates) {
      return [];
    }

    const signalIds = [];
    const signals = Array.from(signalStates.values());
    const buffer = parseInt(process.env.ROUTE_BUFFER_RADIUS) || 500;

    route.coordinates.forEach(coord => {
      signals.forEach(signal => {
        const distance = geoUtils.calculateDistance(
          { latitude: coord.latitude, longitude: coord.longitude },
          signal.location
        );

        if (distance <= buffer && !signalIds.includes(signal.id)) {
          signalIds.push(signal.id);
        }
      });
    });

    return signalIds;
  }

  /**
   * Emergency override for immediate response
   */
  emergencyOverride(signalIds, duration) {
    logger.warn(`EMERGENCY OVERRIDE activated for ${signalIds.length} signals`);
    
    signalIds.forEach(signalId => {
      this.overrideSignal(
        signalId,
        'GREEN_OVERRIDE',
        'EMERGENCY_OVERRIDE',
        duration
      );
    });

    return {
      overriddenSignals: signalIds,
      duration,
      timestamp: new Date()
    };
  }
}

module.exports = new SignalController();
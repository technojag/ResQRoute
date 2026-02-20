const signalController = require('./signalController');
const greenCorridorService = require('../services/greenCorridorService');
const priorityService = require('../services/priorityService');
const mqttClient = require('../mqtt/mqttClient');
const logger = require('../utils/logger');

// In-memory storage for active corridors and vehicles
const activeCorridors = new Map();
const activeVehicles = new Map();
const corridorStats = {
  total: 0,
  active: 0,
  completed: 0,
  averageDuration: 0
};

/**
 * Override a specific signal
 */
exports.overrideSignal = async (req, res) => {
  try {
    const { signalId } = req.params;
    const { action, duration, reason, priority } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required (GREEN_OVERRIDE, RED_HOLD, RESET_TO_NORMAL)'
      });
    }

    const success = signalController.overrideSignal(
      signalId,
      action,
      reason || 'Manual override',
      duration || 60000
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Signal not found or override failed'
      });
    }

    logger.info(`Signal ${signalId} manually overridden: ${action}`);

    res.json({
      success: true,
      message: 'Signal override successful',
      data: {
        signalId,
        action,
        duration,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Override signal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override signal'
    });
  }
};

/**
 * Reset signal to normal operation
 */
exports.resetSignal = async (req, res) => {
  try {
    const { signalId } = req.params;

    signalController.clearOverride(signalId);

    res.json({
      success: true,
      message: 'Signal reset to normal operation',
      data: {
        signalId,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Reset signal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset signal'
    });
  }
};

/**
 * Create green corridor for emergency vehicle
 */
exports.createGreenCorridor = async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleType,
      route,
      origin,
      destination,
      priority,
      estimatedDuration
    } = req.body;

    if (!vehicleId || !route) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID and route are required'
      });
    }

    // Determine vehicle priority
    const vehiclePriority = priorityService.getPriority(vehicleType, priority);

    // Create green corridor
    const corridor = await greenCorridorService.createCorridor({
      vehicleId,
      vehicleType,
      route,
      origin,
      destination,
      priority: vehiclePriority,
      duration: estimatedDuration
    });

    // Store active corridor
    activeCorridors.set(corridor.id, corridor);
    corridorStats.total++;
    corridorStats.active++;

    logger.info(`Green corridor created: ${corridor.id} for vehicle ${vehicleId}`);

    res.json({
      success: true,
      message: 'Green corridor created successfully',
      data: {
        corridor: {
          id: corridor.id,
          vehicleId: corridor.vehicleId,
          signalsOverridden: corridor.signals.length,
          estimatedClearTime: corridor.estimatedClearTime,
          createdAt: corridor.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Create green corridor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create green corridor'
    });
  }
};

/**
 * Clear green corridor
 */
exports.clearGreenCorridor = async (req, res) => {
  try {
    const { corridorId, vehicleId } = req.body;

    let corridor;
    
    if (corridorId) {
      corridor = activeCorridors.get(corridorId);
    } else if (vehicleId) {
      // Find corridor by vehicle ID
      corridor = Array.from(activeCorridors.values()).find(
        c => c.vehicleId === vehicleId
      );
    }

    if (!corridor) {
      return res.status(404).json({
        success: false,
        message: 'Green corridor not found'
      });
    }

    // Clear corridor
    await greenCorridorService.clearCorridor(corridor.id);
    
    activeCorridors.delete(corridor.id);
    corridorStats.active--;
    corridorStats.completed++;

    logger.info(`Green corridor cleared: ${corridor.id}`);

    res.json({
      success: true,
      message: 'Green corridor cleared',
      data: {
        corridorId: corridor.id,
        duration: Date.now() - new Date(corridor.createdAt).getTime(),
        clearedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Clear green corridor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear green corridor'
    });
  }
};

/**
 * Get active green corridors
 */
exports.getActiveCorridors = async (req, res) => {
  try {
    const corridors = Array.from(activeCorridors.values()).map(corridor => ({
      id: corridor.id,
      vehicleId: corridor.vehicleId,
      vehicleType: corridor.vehicleType,
      signals: corridor.signals.length,
      createdAt: corridor.createdAt,
      estimatedClearTime: corridor.estimatedClearTime
    }));

    res.json({
      success: true,
      count: corridors.length,
      data: { corridors }
    });
  } catch (error) {
    logger.error('Get active corridors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active corridors'
    });
  }
};

/**
 * Update emergency vehicle location
 */
exports.updateVehicleLocation = async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleType,
      location,
      heading,
      speed,
      destination,
      eta
    } = req.body;

    if (!vehicleId || !location) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID and location are required'
      });
    }

    // Update vehicle tracking
    const vehicle = {
      id: vehicleId,
      type: vehicleType,
      location,
      heading,
      speed,
      destination,
      eta,
      lastUpdate: new Date()
    };

    activeVehicles.set(vehicleId, vehicle);

    // Process location for signal adjustments
    signalController.processVehicleLocation(vehicleId, {
      latitude: location.latitude,
      longitude: location.longitude,
      heading,
      speed,
      eta
    });

    // Publish vehicle tracking via MQTT
    mqttClient.publishVehicleTracking(vehicleId, location, eta);

    // Update green corridor if exists
    const corridor = Array.from(activeCorridors.values()).find(
      c => c.vehicleId === vehicleId
    );

    if (corridor) {
      await greenCorridorService.updateCorridorForVehicle(corridor.id, location, eta);
    }

    logger.debug(`Vehicle ${vehicleId} location updated`);

    res.json({
      success: true,
      message: 'Vehicle location updated',
      data: {
        vehicleId,
        signalsAdjusted: corridor ? corridor.signals.length : 0
      }
    });
  } catch (error) {
    logger.error('Update vehicle location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle location'
    });
  }
};

/**
 * Get active emergency vehicles
 */
exports.getActiveVehicles = async (req, res) => {
  try {
    const vehicles = Array.from(activeVehicles.values()).map(vehicle => ({
      id: vehicle.id,
      type: vehicle.type,
      location: vehicle.location,
      heading: vehicle.heading,
      speed: vehicle.speed,
      eta: vehicle.eta,
      lastUpdate: vehicle.lastUpdate,
      hasGreenCorridor: Array.from(activeCorridors.values()).some(
        c => c.vehicleId === vehicle.id
      )
    }));

    res.json({
      success: true,
      count: vehicles.length,
      data: { vehicles }
    });
  } catch (error) {
    logger.error('Get active vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active vehicles'
    });
  }
};

/**
 * Get corridor statistics
 */
exports.getCorridorStats = async (req, res) => {
  try {
    const stats = {
      ...corridorStats,
      activeCorridors: activeCorridors.size,
      activeVehicles: activeVehicles.size,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Get corridor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
};

/**
 * Emergency broadcast - override all signals in area
 */
exports.emergencyBroadcast = async (req, res) => {
  try {
    const { area, vehicleType, reason, duration } = req.body;

    if (!area || !area.center || !area.radius) {
      return res.status(400).json({
        success: false,
        message: 'Area with center and radius is required'
      });
    }

    // Broadcast emergency alert
    mqttClient.broadcastEmergencyAlert(area, vehicleType);

    logger.warn(`Emergency broadcast sent for area: ${JSON.stringify(area)}`);

    res.json({
      success: true,
      message: 'Emergency broadcast sent',
      data: {
        area,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Emergency broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency broadcast'
    });
  }
};
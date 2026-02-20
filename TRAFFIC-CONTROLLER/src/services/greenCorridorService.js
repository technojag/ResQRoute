const signalController = require('../controllers/signalController');
const mqttClient = require('../mqtt/mqttClient');
const logger = require('../utils/logger');

class GreenCorridorService {
  constructor() {
    this.corridors = new Map();
  }

  initialize() {
    logger.info('Green Corridor Service initialized');
    this.startCleanupInterval();
  }

  async createCorridor(options) {
    const { vehicleId, vehicleType, route, duration } = options;
    const corridorId = `corridor-${vehicleId}-${Date.now()}`;
    const signalIds = this.extractSignalsFromRoute(route);
    
    const corridor = {
      id: corridorId,
      vehicleId,
      vehicleType,
      route,
      signals: signalIds,
      duration: duration || 120000,
      createdAt: new Date().toISOString(),
      estimatedClearTime: new Date(Date.now() + (duration || 120000)).toISOString(),
      status: 'ACTIVE'
    };

    this.corridors.set(corridorId, corridor);
    mqttClient.createGreenCorridor(signalIds, corridor.duration);
    
    setTimeout(() => this.clearCorridor(corridorId), corridor.duration);
    
    return corridor;
  }

  async clearCorridor(corridorId) {
    const corridor = this.corridors.get(corridorId);
    if (!corridor) return false;
    
    mqttClient.clearGreenCorridor(corridor.signals);
    corridor.status = 'CLEARED';
    this.corridors.delete(corridorId);
    logger.info(`Green corridor ${corridorId} cleared`);
    return true;
  }

  async updateCorridorForVehicle(corridorId, location, eta) {
    const corridor = this.corridors.get(corridorId);
    if (corridor) {
      corridor.currentLocation = location;
      corridor.eta = eta;
      corridor.lastUpdate = new Date().toISOString();
    }
  }

  extractSignalsFromRoute(route) {
    return signalController.extractSignalsFromRoute(route);
  }

  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [corridorId, corridor] of this.corridors.entries()) {
        const expiryTime = new Date(corridor.estimatedClearTime).getTime();
        if (now > expiryTime) this.clearCorridor(corridorId);
      }
    }, 60000);
  }
}

module.exports = new GreenCorridorService();
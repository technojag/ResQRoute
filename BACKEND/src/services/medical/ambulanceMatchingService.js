const Ambulance = require('../../models/medical/Ambulance');
const geoUtils = require('../../utils/geoUtils');
const { cacheHelpers } = require('../../config/redis');
const logger = require('../../utils/logger');

class AmbulanceMatchingService {
  /**
   * Find best ambulance for emergency
   */
  async findBestAmbulance(pickupLocation, hospitalLocation, emergencyType, severity) {
    try {
      // Get all available ambulances
      const ambulances = await Ambulance.find({
        isActive: true,
        isAvailable: true,
        status: 'available'
      }).populate('hospitalId');

      if (ambulances.length === 0) {
        return null;
      }

      // Calculate scores for each ambulance
      const scoredAmbulances = ambulances.map(ambulance => {
        const score = this.calculateScore(
          ambulance,
          pickupLocation,
          hospitalLocation,
          emergencyType,
          severity
        );

        const distance = geoUtils.calculateDistance(
          { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
          { latitude: ambulance.currentLocation.coordinates[1], longitude: ambulance.currentLocation.coordinates[0] }
        );

        return {
          ambulance,
          score,
          distance: distance / 1000 // Convert to km
        };
      });

      // Sort by score (highest first)
      scoredAmbulances.sort((a, b) => b.score - a.score);

      logger.info(`Found ${scoredAmbulances.length} ambulances, best score: ${scoredAmbulances[0].score.toFixed(2)}`);

      return scoredAmbulances[0].ambulance;
    } catch (error) {
      logger.error('Ambulance matching error:', error);
      throw error;
    }
  }

  /**
   * Calculate match score for ambulance
   */
  calculateScore(ambulance, pickupLocation, hospitalLocation, emergencyType, severity) {
    let score = 100;

    // Distance to pickup (40 points max penalty)
    const distanceToPickup = geoUtils.calculateDistanceInKm(
      { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
      { latitude: ambulance.currentLocation.coordinates[1], longitude: ambulance.currentLocation.coordinates[0] }
    );
    score -= Math.min(40, distanceToPickup * 3);

    // Vehicle type suitability (30 points)
    const typeScore = this.getVehicleTypeScore(ambulance.vehicleType, severity);
    score += typeScore;

    // Equipment availability (20 points)
    const equipmentScore = this.getEquipmentScore(ambulance.equipment, emergencyType, severity);
    score += equipmentScore;

    // Performance history (10 points)
    score += ambulance.metrics.averageRating * 2;

    // Hospital proximity bonus (5 points)
    if (ambulance.hospitalId && hospitalLocation) {
      const hospitalDistance = geoUtils.calculateDistanceInKm(
        { latitude: ambulance.hospitalId.location.coordinates[1], longitude: ambulance.hospitalId.location.coordinates[0] },
        { latitude: hospitalLocation.coordinates[1], longitude: hospitalLocation.coordinates[0] }
      );
      if (hospitalDistance < 5) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  getVehicleTypeScore(vehicleType, severity) {
    const scores = {
      'critical': { 'als': 30, 'bls': 15, 'basic': 0, 'neonatal': 10, 'air': 30 },
      'high': { 'als': 25, 'bls': 25, 'basic': 10, 'neonatal': 15, 'air': 20 },
      'medium': { 'als': 15, 'bls': 30, 'basic': 20, 'neonatal': 10, 'air': 10 },
      'low': { 'als': 10, 'bls': 25, 'basic': 30, 'neonatal': 15, 'air': 5 }
    };
    return scores[severity]?.[vehicleType] || 15;
  }

  getEquipmentScore(equipment, emergencyType, severity) {
    let score = 0;

    const criticalEquipment = {
      'cardiac_arrest': ['defibrillator', 'ecgMonitor', 'oxygen'],
      'breathing_difficulty': ['ventilator', 'oxygen'],
      'severe_bleeding': ['firstAidKit'],
      'stroke': ['oxygen', 'ecgMonitor'],
      'accident': ['stretcher', 'firstAidKit'],
      'burns': ['firstAidKit', 'oxygen'],
      'poisoning': ['firstAidKit', 'suction'],
      'pregnancy_emergency': ['stretcher', 'oxygen'],
      'unconscious': ['oxygen', 'stretcher']
    };

    const required = criticalEquipment[emergencyType] || [];
    
    required.forEach(item => {
      if (equipment[item]) score += 5;
    });

    // Bonus for advanced equipment in critical cases
    if (severity === 'critical') {
      if (equipment.ventilator) score += 5;
      if (equipment.defibrillator) score += 5;
    }

    return Math.min(20, score);
  }

  /**
   * Get ETA for ambulance to reach location
   */
  async calculateETA(ambulance, destination, trafficFactor = 1.0) {
    const distance = geoUtils.calculateDistance(
      { latitude: ambulance.currentLocation.coordinates[1], longitude: ambulance.currentLocation.coordinates[0] },
      { latitude: destination.coordinates[1], longitude: destination.coordinates[0] }
    );

    const averageSpeed = 40 * trafficFactor; // km/h adjusted for traffic
    const distanceInKm = distance / 1000;
    const timeInMinutes = Math.ceil((distanceInKm / averageSpeed) * 60);

    return {
      distance,
      distanceInKm: parseFloat(distanceInKm.toFixed(2)),
      estimatedMinutes: timeInMinutes,
      estimatedTime: `${timeInMinutes} min`,
      estimatedArrival: new Date(Date.now() + timeInMinutes * 60000)
    };
  }

  /**
   * Find multiple ambulances for mass casualty
   */
  async findMultipleAmbulances(pickupLocation, hospitalLocation, count = 2) {
    try {
      const ambulances = await Ambulance.find({
        isActive: true,
        isAvailable: true,
        status: 'available'
      }).limit(count * 2); // Get extra in case some are not suitable

      if (ambulances.length === 0) {
        return [];
      }

      const scoredAmbulances = ambulances.map(ambulance => ({
        ambulance,
        score: this.calculateScore(ambulance, pickupLocation, hospitalLocation, 'accident', 'high')
      }));

      scoredAmbulances.sort((a, b) => b.score - a.score);

      return scoredAmbulances.slice(0, count).map(sa => sa.ambulance);
    } catch (error) {
      logger.error('Find multiple ambulances error:', error);
      throw error;
    }
  }

  /**
   * Check if specific ambulance can handle emergency
   */
  canHandleEmergency(ambulance, emergencyType, severity) {
    // Check basic availability
    if (!ambulance.isActive || !ambulance.isAvailable) {
      return { canHandle: false, reason: 'Ambulance not available' };
    }

    // Check vehicle type for critical emergencies
    if (severity === 'critical' && ambulance.vehicleType === 'basic') {
      return { canHandle: false, reason: 'Basic ambulance cannot handle critical emergencies' };
    }

    // Check fuel level
    if (ambulance.fuelLevel < 20) {
      return { canHandle: false, reason: 'Low fuel' };
    }

    // Check equipment for specific emergencies
    const requiredEquipment = {
      'cardiac_arrest': ['defibrillator'],
      'breathing_difficulty': ['oxygen'],
      'pregnancy_emergency': ['stretcher']
    };

    const required = requiredEquipment[emergencyType] || [];
    for (const equipment of required) {
      if (!ambulance.equipment[equipment]) {
        return { canHandle: false, reason: `Missing required equipment: ${equipment}` };
      }
    }

    return { canHandle: true, reason: 'Suitable' };
  }

  /**
   * Get ambulance availability statistics
   */
  async getAvailabilityStats(hospitalId = null) {
    try {
      const query = { isActive: true };
      if (hospitalId) query.hospitalId = hospitalId;

      const total = await Ambulance.countDocuments(query);
      const available = await Ambulance.countDocuments({ ...query, isAvailable: true, status: 'available' });
      const onDuty = await Ambulance.countDocuments({ ...query, status: 'on_duty' });
      const maintenance = await Ambulance.countDocuments({ ...query, status: 'maintenance' });

      return {
        total,
        available,
        onDuty,
        maintenance,
        availabilityRate: total > 0 ? ((available / total) * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Get availability stats error:', error);
      throw error;
    }
  }
}

module.exports = new AmbulanceMatchingService();
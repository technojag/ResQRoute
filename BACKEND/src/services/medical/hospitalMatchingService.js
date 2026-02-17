const Hospital = require('../../models/medical/Hospital');
const geoUtils = require('../../utils/geoUtils');
const logger = require('../../utils/logger');

class HospitalMatchingService {
  /**
   * Find nearest capable government hospital
   */
  async findNearestGovernmentHospital(pickupLocation, emergencyType, severity) {
    try {
      const hospitals = await Hospital.find({
        type: 'government',
        isActive: true,
        acceptingEmergencies: true,
        availableBeds: { $gt: 0 }
      });

      if (hospitals.length === 0) {
        logger.warn('No government hospitals available');
        return null;
      }

      // Calculate scores
      const scoredHospitals = hospitals.map(hospital => {
        const score = this.calculateHospitalScore(
          hospital,
          pickupLocation,
          emergencyType,
          severity
        );

        const distance = geoUtils.calculateDistanceInKm(
          { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
          { latitude: hospital.location.coordinates[1], longitude: hospital.location.coordinates[0] }
        );

        return { hospital, score, distance };
      });

      // Sort by score
      scoredHospitals.sort((a, b) => b.score - a.score);

      logger.info(`Found ${scoredHospitals.length} government hospitals, best: ${scoredHospitals[0].hospital.name}`);

      return scoredHospitals[0].hospital;
    } catch (error) {
      logger.error('Government hospital matching error:', error);
      throw error;
    }
  }

  /**
   * Calculate hospital match score
   */
  calculateHospitalScore(hospital, pickupLocation, emergencyType, severity) {
    let score = 100;

    // Distance (30 points max penalty)
    const distance = geoUtils.calculateDistanceInKm(
      { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
      { latitude: hospital.location.coordinates[1], longitude: hospital.location.coordinates[0] }
    );
    score -= Math.min(30, distance * 2);

    // Bed availability (20 points)
    if (hospital.availableBeds === 0) {
      score -= 20;
    } else if (hospital.availableBeds < 5) {
      score -= 10;
    } else if (hospital.availableBeds >= 10) {
      score += 5;
    }

    // Specialty match (20 points)
    const specialtyMatch = this.checkSpecialtyMatch(hospital, emergencyType);
    if (specialtyMatch) score += 20;

    // Facilities (20 points)
    const facilityScore = this.getFacilityScore(hospital, emergencyType, severity);
    score += facilityScore;

    // Rating (10 points)
    score += hospital.rating * 2;

    // Government schemes (bonus 5 points)
    if (hospital.governmentSchemes.ayushmanBharat) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  checkSpecialtyMatch(hospital, emergencyType) {
    const specialtyMap = {
      'cardiac_arrest': 'Cardiology',
      'stroke': 'Neurology',
      'fracture': 'Orthopedics',
      'burns': 'Burn Care',
      'pregnancy_emergency': 'Obstetrics',
      'breathing_difficulty': 'Pulmonology',
      'poisoning': 'Toxicology',
      'unconscious': 'Emergency Medicine'
    };

    const requiredSpecialty = specialtyMap[emergencyType];
    return requiredSpecialty && hospital.specialties.includes(requiredSpecialty);
  }

  getFacilityScore(hospital, emergencyType, severity) {
    let score = 0;

    // Essential facilities
    if (hospital.facilities.emergencyRoom) score += 5;
    if (hospital.facilities.icu && severity === 'critical') score += 10;
    else if (hospital.facilities.icu) score += 5;
    
    if (hospital.facilities.operationTheater) score += 5;

    // Emergency-specific facilities
    const facilityRequirements = {
      'cardiac_arrest': ['icu', 'defibrillator'],
      'stroke': ['icu', 'ctScan', 'mri'],
      'breathing_difficulty': ['icu', 'ventilators'],
      'severe_bleeding': ['bloodBank', 'operationTheater'],
      'burns': ['icu', 'operationTheater'],
      'pregnancy_emergency': ['operationTheater'],
      'fracture': ['xray', 'operationTheater']
    };

    const required = facilityRequirements[emergencyType] || [];
    required.forEach(facility => {
      if (hospital.facilities[facility]) score += 3;
    });

    return Math.min(20, score);
  }

  /**
   * Find government hospitals with specific capability
   */
  async findGovernmentHospitalsWithCapability(pickupLocation, capability, maxDistance = 50) {
    try {
      const maxDistanceMeters = maxDistance * 1000;

      const hospitals = await Hospital.find({
        type: 'government',
        isActive: true,
        acceptingEmergencies: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: pickupLocation.coordinates
            },
            $maxDistance: maxDistanceMeters
          }
        }
      });

      // Filter by capability
      const capableHospitals = hospitals.filter(hospital => {
        switch(capability) {
          case 'trauma':
            return hospital.facilities.emergencyRoom && hospital.facilities.operationTheater;
          case 'cardiac':
            return hospital.specialties.includes('Cardiology') && hospital.facilities.icu;
          case 'neuro':
            return hospital.specialties.includes('Neurology') && hospital.facilities.ctScan;
          case 'maternity':
            return hospital.specialties.includes('Obstetrics') && hospital.facilities.operationTheater;
          default:
            return true;
        }
      });

      return capableHospitals;
    } catch (error) {
      logger.error('Find hospitals with capability error:', error);
      throw error;
    }
  }

  /**
   * Check if hospital can accept patient
   */
  canAcceptPatient(hospital, emergencyType, severity, requiresICU = false) {
    // Basic checks
    if (!hospital.isActive || !hospital.acceptingEmergencies) {
      return { canAccept: false, reason: 'Hospital not accepting emergencies' };
    }

    // Bed availability
    if (hospital.availableBeds === 0) {
      return { canAccept: false, reason: 'No beds available' };
    }

    // ICU requirement
    if (requiresICU || severity === 'critical') {
      if (!hospital.facilities.icu) {
        return { canAccept: false, reason: 'No ICU facility' };
      }
      if (hospital.icuBedsAvailable === 0) {
        return { canAccept: false, reason: 'No ICU beds available' };
      }
    }

    // Emergency room capacity
    if (hospital.emergencyBedsAvailable === 0 && severity !== 'low') {
      return { canAccept: false, reason: 'Emergency room full' };
    }

    // Specialty check for critical cases
    if (severity === 'critical') {
      const hasSpecialty = this.checkSpecialtyMatch(hospital, emergencyType);
      if (!hasSpecialty) {
        return { canAccept: true, reason: 'Can accept but may lack specialty', warning: true };
      }
    }

    return { canAccept: true, reason: 'Hospital ready to accept patient' };
  }

  /**
   * Get hospital statistics
   */
  async getGovernmentHospitalStats() {
    try {
      const total = await Hospital.countDocuments({ type: 'government', isActive: true });
      const accepting = await Hospital.countDocuments({ 
        type: 'government', 
        isActive: true, 
        acceptingEmergencies: true 
      });
      
      const hospitals = await Hospital.find({ 
        type: 'government', 
        isActive: true 
      });

      const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
      const availableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
      const occupancy = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds * 100).toFixed(2) : 0;

      return {
        total,
        accepting,
        totalBeds,
        availableBeds,
        occupancyRate: occupancy,
        averageRating: hospitals.reduce((sum, h) => sum + h.rating, 0) / hospitals.length || 0
      };
    } catch (error) {
      logger.error('Get hospital stats error:', error);
      throw error;
    }
  }

  /**
   * Find alternative government hospital if first choice unavailable
   */
  async findAlternativeHospital(originalHospitalId, pickupLocation, emergencyType, severity) {
    try {
      const hospitals = await Hospital.find({
        _id: { $ne: originalHospitalId },
        type: 'government',
        isActive: true,
        acceptingEmergencies: true,
        availableBeds: { $gt: 0 }
      });

      if (hospitals.length === 0) {
        return null;
      }

      const scoredHospitals = hospitals.map(hospital => ({
        hospital,
        score: this.calculateHospitalScore(hospital, pickupLocation, emergencyType, severity)
      }));

      scoredHospitals.sort((a, b) => b.score - a.score);

      return scoredHospitals[0].hospital;
    } catch (error) {
      logger.error('Find alternative hospital error:', error);
      throw error;
    }
  }
}

module.exports = new HospitalMatchingService();
const Hospital = require('../../../models/medical/Hospital');
const geoUtils = require('../../../utils/geoUtils');
const logger = require('../../../utils/logger');
const { cacheHelpers } = require('../../../config/redis');

// @desc    Get all hospitals
// @route   GET /api/v1/medical/hospitals
// @access  Public
exports.getHospitals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, city, specialty } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (type) query.type = type;
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (specialty) query.specialties = specialty;

    // Try cache first
    const cacheKey = `hospitals:${JSON.stringify(query)}:${page}:${limit}`;
    const cached = await cacheHelpers.get(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const hospitals = await Hospital.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 })
      .select('-__v');

    const total = await Hospital.countDocuments(query);

    const result = {
      hospitals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache for 5 minutes
    await cacheHelpers.set(cacheKey, result, 300);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get hospitals error:', error);
    next(error);
  }
};

// @desc    Get government hospitals
// @route   GET /api/v1/medical/hospitals/government
// @access  Public
exports.getGovernmentHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({
      type: 'government',
      isActive: true,
      acceptingEmergencies: true
    })
    .sort({ rating: -1 })
    .select('name address location availableBeds facilities governmentSchemes rating');

    res.json({
      success: true,
      count: hospitals.length,
      data: { hospitals }
    });
  } catch (error) {
    logger.error('Get government hospitals error:', error);
    next(error);
  }
};

// @desc    Get private hospitals
// @route   GET /api/v1/medical/hospitals/private
// @access  Public
exports.getPrivateHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({
      type: 'private',
      isActive: true,
      acceptingEmergencies: true
    })
    .sort({ rating: -1 })
    .select('name address location availableBeds facilities pricing insurance rating specialties');

    res.json({
      success: true,
      count: hospitals.length,
      data: { hospitals }
    });
  } catch (error) {
    logger.error('Get private hospitals error:', error);
    next(error);
  }
};

// @desc    Get nearby hospitals
// @route   GET /api/v1/medical/hospitals/nearby
// @access  Public
exports.getNearbyHospitals = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10000, type } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const query = {
      isActive: true,
      acceptingEmergencies: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    };

    if (type) query.type = type;

    const hospitals = await Hospital.find(query).limit(20);

    // Calculate distances and ETAs
    const hospitalsWithDetails = hospitals.map(hospital => {
      const distance = geoUtils.calculateDistance(
        { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        { latitude: hospital.location.coordinates[1], longitude: hospital.location.coordinates[0] }
      );

      const eta = geoUtils.calculateETA(distance);

      return {
        ...hospital.toObject(),
        distance: distance,
        distanceInKm: (distance / 1000).toFixed(2),
        estimatedTime: eta.estimatedMinutes
      };
    });

    res.json({
      success: true,
      count: hospitalsWithDetails.length,
      data: { hospitals: hospitalsWithDetails }
    });
  } catch (error) {
    logger.error('Get nearby hospitals error:', error);
    next(error);
  }
};

// @desc    Get hospital by ID
// @route   GET /api/v1/medical/hospitals/:id
// @access  Public
exports.getHospitalById = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      data: { hospital }
    });
  } catch (error) {
    logger.error('Get hospital error:', error);
    next(error);
  }
};

// @desc    Update hospital bed availability
// @route   PATCH /api/v1/medical/hospitals/:id/beds
// @access  Private (Hospital Admin)
exports.updateBedAvailability = async (req, res, next) => {
  try {
    const { availableBeds, emergencyBedsAvailable, icuBedsAvailable } = req.body;

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        (!req.user.organizationId || req.user.organizationId.toString() !== hospital._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (availableBeds !== undefined) hospital.availableBeds = availableBeds;
    if (emergencyBedsAvailable !== undefined) hospital.emergencyBedsAvailable = emergencyBedsAvailable;
    if (icuBedsAvailable !== undefined) hospital.icuBedsAvailable = icuBedsAvailable;
    hospital.lastBedUpdate = Date.now();

    await hospital.save();

    logger.info(`Hospital beds updated: ${hospital.name}`);

    res.json({
      success: true,
      message: 'Bed availability updated',
      data: { hospital }
    });
  } catch (error) {
    logger.error('Update bed availability error:', error);
    next(error);
  }
};

// @desc    Toggle hospital emergency acceptance
// @route   PATCH /api/v1/medical/hospitals/:id/emergency-status
// @access  Private (Hospital Admin)
exports.toggleEmergencyStatus = async (req, res, next) => {
  try {
    const { acceptingEmergencies } = req.body;

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        (!req.user.organizationId || req.user.organizationId.toString() !== hospital._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    hospital.acceptingEmergencies = acceptingEmergencies;
    await hospital.save();

    logger.info(`Hospital emergency status updated: ${hospital.name} - ${acceptingEmergencies}`);

    res.json({
      success: true,
      message: `Emergency status updated to ${acceptingEmergencies ? 'accepting' : 'not accepting'}`,
      data: { 
        hospitalId: hospital._id,
        acceptingEmergencies: hospital.acceptingEmergencies 
      }
    });
  } catch (error) {
    logger.error('Toggle emergency status error:', error);
    next(error);
  }
};

// @desc    Search hospitals by specialty
// @route   GET /api/v1/medical/hospitals/search/specialty
// @access  Public
exports.searchBySpecialty = async (req, res, next) => {
  try {
    const { specialty, latitude, longitude } = req.query;

    if (!specialty) {
      return res.status(400).json({
        success: false,
        message: 'Specialty is required'
      });
    }

    const query = {
      isActive: true,
      specialties: new RegExp(specialty, 'i')
    };

    // If location provided, sort by distance
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          }
        }
      };
    }

    const hospitals = await Hospital.find(query).limit(10);

    res.json({
      success: true,
      count: hospitals.length,
      data: { hospitals }
    });
  } catch (error) {
    logger.error('Search by specialty error:', error);
    next(error);
  }
};
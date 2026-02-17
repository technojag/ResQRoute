const Ambulance = require('../../../models/medical/Ambulance');
const logger = require('../../../utils/logger');

// @desc    Get all ambulances
// @route   GET /api/v1/medical/ambulances
// @access  Public
exports.getAmbulances = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, hospitalId, status, vehicleType } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (hospitalId) query.hospitalId = hospitalId;
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;

    const ambulances = await Ambulance.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('hospitalId', 'name address phone')
      .populate('driver', 'name phone')
      .sort({ 'metrics.averageRating': -1 });

    const total = await Ambulance.countDocuments(query);

    res.json({
      success: true,
      data: {
        ambulances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get ambulances error:', error);
    next(error);
  }
};

// @desc    Get available ambulances
// @route   GET /api/v1/medical/ambulances/available
// @access  Public
exports.getAvailableAmbulances = async (req, res, next) => {
  try {
    const { latitude, longitude, vehicleType } = req.query;

    const query = {
      isActive: true,
      isAvailable: true,
      status: 'available'
    };

    if (vehicleType) query.vehicleType = vehicleType;

    // If location provided, sort by distance
    if (latitude && longitude) {
      query.currentLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          }
        }
      };
    }

    const ambulances = await Ambulance.find(query)
      .limit(10)
      .populate('hospitalId', 'name address')
      .populate('driver', 'name phone');

    res.json({
      success: true,
      count: ambulances.length,
      data: { ambulances }
    });
  } catch (error) {
    logger.error('Get available ambulances error:', error);
    next(error);
  }
};

// @desc    Get ambulance by ID
// @route   GET /api/v1/medical/ambulances/:id
// @access  Public
exports.getAmbulanceById = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id)
      .populate('hospitalId', 'name address phone')
      .populate('driver', 'name phone email')
      .populate('currentBooking');

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.json({
      success: true,
      data: { ambulance }
    });
  } catch (error) {
    logger.error('Get ambulance error:', error);
    next(error);
  }
};

// @desc    Update ambulance location (for drivers)
// @route   PATCH /api/v1/medical/ambulances/:id/location
// @access  Private (Driver)
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        (!ambulance.driver || ambulance.driver.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await ambulance.updateLocation(latitude, longitude);

    res.json({
      success: true,
      message: 'Location updated',
      data: {
        location: {
          latitude,
          longitude
        }
      }
    });
  } catch (error) {
    logger.error('Update ambulance location error:', error);
    next(error);
  }
};

// @desc    Update ambulance status
// @route   PATCH /api/v1/medical/ambulances/:id/status
// @access  Private (Driver/Admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['available', 'on_duty', 'maintenance', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        (!ambulance.driver || ambulance.driver.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await ambulance.updateStatus(status);

    logger.info(`Ambulance status updated: ${ambulance.vehicleNumber} -> ${status}`);

    res.json({
      success: true,
      message: 'Status updated',
      data: { 
        ambulanceId: ambulance._id,
        status: ambulance.status,
        isAvailable: ambulance.isAvailable
      }
    });
  } catch (error) {
    logger.error('Update ambulance status error:', error);
    next(error);
  }
};

// @desc    Get ambulance statistics
// @route   GET /api/v1/medical/ambulances/:id/stats
// @access  Private (Driver/Hospital Admin)
exports.getAmbulanceStats = async (req, res, next) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.json({
      success: true,
      data: {
        vehicleNumber: ambulance.vehicleNumber,
        metrics: ambulance.metrics,
        maintenanceSchedule: {
          lastMaintenance: ambulance.lastMaintenanceDate,
          nextMaintenance: ambulance.nextMaintenanceDate
        },
        resourceLevels: {
          fuelLevel: ambulance.fuelLevel
        }
      }
    });
  } catch (error) {
    logger.error('Get ambulance stats error:', error);
    next(error);
  }
};

// @desc    Get nearby ambulances
// @route   GET /api/v1/medical/ambulances/nearby
// @access  Public
exports.getNearbyAmbulances = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const ambulances = await Ambulance.find({
      isActive: true,
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .limit(10)
    .populate('hospitalId', 'name')
    .populate('driver', 'name phone');

    res.json({
      success: true,
      count: ambulances.length,
      data: { ambulances }
    });
  } catch (error) {
    logger.error('Get nearby ambulances error:', error);
    next(error);
  }
};
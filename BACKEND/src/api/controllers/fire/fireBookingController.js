const FireBooking = require('../../../models/fire/FireBooking');
const FireTruck = require('../../../models/fire/FireTruck');
const FireStation = require('../../../models/fire/FireStation');
const firetruckMatchingService = require('../../../services/fire/firetruckMatchingService');
const logger = require('../../../utils/logger');
const { sendPushNotification } = require('../../../config/firebase');

// @desc    Create fire incident
// @route   POST /api/v1/fire/incident
// @access  Private
exports.createIncident = async (req, res, next) => {
  try {
    const {
      incidentType,
      severity,
      incidentLocation,
      buildingDetails,
      fireDetails
    } = req.body;

    if (!incidentType || !severity || !incidentLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Find nearest fire station
    const stations = await FireStation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: incidentLocation.coordinates
          },
          $maxDistance: 20000 // 20km
        }
      },
      isActive: true,
      operationalStatus: { $in: ['fully_operational', 'limited'] }
    }).limit(3);

    if (stations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fire station available nearby'
      });
    }

    let station = null;
    let trucks = [];

    // Try each station until we find available trucks
    for (const st of stations) {
      const availableTrucks = await firetruckMatchingService.findBestTrucks(
        incidentLocation,
        incidentType,
        severity,
        st._id
      );

      if (availableTrucks.length > 0) {
        station = st;
        trucks = availableTrucks;
        break;
      }
    }

    if (!station || trucks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fire trucks available at the moment'
      });
    }

    // Calculate priority
    const priorityMap = { 'minor': 3, 'moderate': 5, 'major': 8, 'catastrophic': 10 };
    const priority = priorityMap[severity] || 5;

    // Create incident
    const incident = await FireBooking.create({
      reportedBy: req.user.id,
      incidentType,
      severity,
      incidentLocation,
      buildingDetails,
      fireDetails,
      assignedStation: station._id,
      assignedTrucks: trucks.map(truck => ({
        truck: truck._id,
        assignedAt: Date.now(),
        role: truck.truckType
      })),
      status: 'dispatched',
      priority
    });

    // Update truck statuses
    for (const truck of trucks) {
      await truck.assignIncident(incident._id);
    }

    // Update station stats
    station.stats.activeIncidents += 1;
    await station.save();

    // Send notifications
    if (req.user.fcmTokens && req.user.fcmTokens.length > 0) {
      await sendPushNotification(
        req.user.fcmTokens[0],
        {
          title: 'Fire Trucks Dispatched',
          body: `${trucks.length} fire truck(s) are on the way`
        },
        { incidentId: incident._id.toString() }
      );
    }

    logger.info(`Fire incident created: ${incident.incidentId}`);

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: {
        incident,
        station: {
          _id: station._id,
          name: station.name,
          address: station.address
        },
        trucks: trucks.map(t => ({
          _id: t._id,
          vehicleNumber: t.vehicleNumber,
          truckType: t.truckType,
          currentLocation: t.currentLocation
        }))
      }
    });
  } catch (error) {
    logger.error('Create incident error:', error);
    next(error);
  }
};

// @desc    Get incident by ID
// @route   GET /api/v1/fire/incident/:id
// @access  Private
exports.getIncident = async (req, res, next) => {
  try {
    const incident = await FireBooking.findById(req.params.id)
      .populate('reportedBy', 'name phone')
      .populate('assignedStation')
      .populate('assignedTrucks.truck');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Check authorization
    if (incident.reportedBy._id.toString() !== req.user.id && 
        !['admin', 'dispatcher', 'fire_truck_driver'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: { incident }
    });
  } catch (error) {
    logger.error('Get incident error:', error);
    next(error);
  }
};

// @desc    Get user incidents
// @route   GET /api/v1/fire/incidents
// @access  Private
exports.getUserIncidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = req.user.role === 'admin' ? {} : { reportedBy: req.user.id };

    const incidents = await FireBooking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedStation', 'name address')
      .populate('assignedTrucks.truck', 'vehicleNumber truckType');

    const total = await FireBooking.countDocuments(query);

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get user incidents error:', error);
    next(error);
  }
};

// @desc    Cancel incident
// @route   PATCH /api/v1/fire/incident/:id/cancel
// @access  Private
exports.cancelIncident = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const incident = await FireBooking.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    if (incident.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (['completed', 'cancelled'].includes(incident.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this incident'
      });
    }

    await incident.updateStatus('cancelled', reason || 'Cancelled by reporter');

    // Release trucks
    for (const truckAssignment of incident.assignedTrucks) {
      await FireTruck.findByIdAndUpdate(truckAssignment.truck, {
        status: 'available',
        isAvailable: true,
        currentIncident: null
      });
    }

    // Update station stats
    if (incident.assignedStation) {
      await FireStation.findByIdAndUpdate(incident.assignedStation, {
        $inc: { 'stats.activeIncidents': -1 }
      });
    }

    logger.info(`Incident cancelled: ${incident.incidentId}`);

    res.json({
      success: true,
      message: 'Incident cancelled',
      data: { incident }
    });
  } catch (error) {
    logger.error('Cancel incident error:', error);
    next(error);
  }
};

// @desc    Update incident status
// @route   PATCH /api/v1/fire/incident/:id/status
// @access  Private (Fire Station/Driver)
exports.updateIncidentStatus = async (req, res, next) => {
  try {
    const { status, note, location, resourcesUsed, damageAssessment } = req.body;

    const incident = await FireBooking.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Check authorization
    if (!['admin', 'dispatcher', 'fire_truck_driver', 'fire_station_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await incident.updateStatus(status, note, location);

    if (resourcesUsed) {
      incident.resourcesUsed = resourcesUsed;
    }

    if (damageAssessment) {
      incident.damageAssessment = damageAssessment;
    }

    await incident.save();

    // If completed, release trucks and update stats
    if (status === 'completed') {
      for (const truckAssignment of incident.assignedTrucks) {
        const truck = await FireTruck.findById(truckAssignment.truck);
        if (truck) {
          await truck.completeOperation();
        }
      }

      if (incident.assignedStation) {
        await FireStation.findByIdAndUpdate(incident.assignedStation, {
          $inc: { 
            'stats.activeIncidents': -1,
            'stats.totalIncidents': 1,
            'stats.resolvedIncidents': 1
          }
        });
      }
    }

    logger.info(`Incident status updated: ${incident.incidentId} -> ${status}`);

    res.json({
      success: true,
      message: 'Status updated',
      data: { incident }
    });
  } catch (error) {
    logger.error('Update incident status error:', error);
    next(error);
  }
};

// @desc    Get fire stations
// @route   GET /api/v1/fire/stations
// @access  Public
exports.getFireStations = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    let query = { isActive: true };

    // Sort by distance if coordinates provided
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

    const stations = await FireStation.find(query).limit(20);

    res.json({
      success: true,
      count: stations.length,
      data: { stations }
    });
  } catch (error) {
    logger.error('Get fire stations error:', error);
    next(error);
  }
};

// @desc    Get fire trucks
// @route   GET /api/v1/fire/trucks
// @access  Public
exports.getFireTrucks = async (req, res, next) => {
  try {
    const { stationId, status, truckType } = req.query;

    const query = { isActive: true };
    if (stationId) query.fireStationId = stationId;
    if (status) query.status = status;
    if (truckType) query.truckType = truckType;

    const trucks = await FireTruck.find(query)
      .populate('fireStationId', 'name address')
      .populate('driver', 'name phone');

    res.json({
      success: true,
      count: trucks.length,
      data: { trucks }
    });
  } catch (error) {
    logger.error('Get fire trucks error:', error);
    next(error);
  }
};

// @desc    Get active incidents
// @route   GET /api/v1/fire/incidents/active
// @access  Private (Fire Station)
exports.getActiveIncidents = async (req, res, next) => {
  try {
    const incidents = await FireBooking.find({
      status: { $in: ['reported', 'dispatched', 'enroute', 'on_scene'] }
    })
    .sort({ priority: -1, createdAt: 1 })
    .populate('reportedBy', 'name phone')
    .populate('assignedStation', 'name')
    .populate('assignedTrucks.truck', 'vehicleNumber truckType');

    res.json({
      success: true,
      count: incidents.length,
      data: { incidents }
    });
  } catch (error) {
    logger.error('Get active incidents error:', error);
    next(error);
  }
};
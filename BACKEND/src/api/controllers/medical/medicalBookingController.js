const MedicalBooking = require('../../../models/medical/MedicalBooking');
const Ambulance = require('../../../models/medical/Ambulance');
const Hospital = require('../../../models/medical/Hospital');
const ambulanceMatchingService = require('../../../services/medical/ambulanceMatchingService');
const hospitalMatchingService = require('../../../services/medical/hospitalMatchingService');
const privateHospitalMatchingService = require('../../../services/medical/privateHospitalMatchingService');
const logger = require('../../../utils/logger');
const { sendPushNotification } = require('../../../config/firebase');

// @desc    Create medical booking
// @route   POST /api/v1/medical/booking
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const {
      patientDetails,
      emergencyType,
      severity,
      symptoms,
      description,
      pickupLocation,
      hospitalPreference,
      selectedHospital,
      additionalServices
    } = req.body;

    // Validate required fields
    if (!patientDetails || !emergencyType || !severity || !pickupLocation || !hospitalPreference) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    let hospital = null;
    let aiRecommendations = [];

    // Match hospital based on preference
    if (hospitalPreference === 'government') {
      hospital = await hospitalMatchingService.findNearestGovernmentHospital(
        pickupLocation,
        emergencyType,
        severity
      );
      
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'No government hospital available nearby'
        });
      }
    } else if (hospitalPreference === 'private') {
      if (selectedHospital) {
        hospital = await Hospital.findById(selectedHospital);
      } else {
        // Get AI recommendations
        aiRecommendations = await privateHospitalMatchingService.getRecommendations(
          pickupLocation,
          emergencyType,
          severity,
          patientDetails
        );
        
        if (aiRecommendations.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No private hospital available nearby'
          });
        }
        
        hospital = await Hospital.findById(aiRecommendations[0].hospital);
      }
    }

    // Find best ambulance
    const ambulance = await ambulanceMatchingService.findBestAmbulance(
      pickupLocation,
      hospital.location,
      emergencyType,
      severity
    );

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'No ambulance available at the moment'
      });
    }

    // Calculate ETAs
    const pickupETA = await ambulanceMatchingService.calculateETA(ambulance, pickupLocation);
    const hospitalETA = await ambulanceMatchingService.calculateETA(
      { currentLocation: pickupLocation },
      hospital.location
    );

    // Create booking
    const booking = await MedicalBooking.create({
      userId: req.user.id,
      patientDetails,
      emergencyType,
      severity,
      symptoms,
      description,
      pickupLocation,
      hospitalPreference,
      selectedHospital: hospital._id,
      hospitalSelectionMethod: selectedHospital ? 'manual' : (hospitalPreference === 'government' ? 'auto' : 'ai_recommended'),
      aiRecommendations: aiRecommendations.map(rec => ({
        hospital: rec.hospital,
        matchScore: rec.matchScore,
        distance: rec.distance,
        estimatedCost: rec.estimatedCost
      })),
      assignedAmbulance: ambulance._id,
      additionalServices,
      status: 'ambulance_assigned',
      estimatedPickupTime: pickupETA.estimatedMinutes,
      estimatedHospitalTime: hospitalETA.estimatedMinutes,
      distanceToPickup: pickupETA.distanceInKm,
      distanceToHospital: hospitalETA.distanceInKm,
      estimatedCost: hospitalPreference === 'government' ? 0 : (aiRecommendations[0]?.estimatedCost || 15000),
      paymentMethod: hospitalPreference === 'government' ? 'free' : 'pending'
    });

    // Update ambulance status
    await ambulance.assignBooking(booking._id);

    // Send notifications
    if (req.user.fcmTokens && req.user.fcmTokens.length > 0) {
      await sendPushNotification(
        req.user.fcmTokens[0],
        {
          title: 'Ambulance Assigned',
          body: `Your ambulance will arrive in ${pickupETA.estimatedMinutes} minutes`
        },
        { bookingId: booking._id.toString() }
      );
    }

    logger.info(`Medical booking created: ${booking.bookingId}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        ambulance: {
          _id: ambulance._id,
          vehicleNumber: ambulance.vehicleNumber,
          vehicleType: ambulance.vehicleType,
          currentLocation: ambulance.currentLocation,
          eta: pickupETA
        },
        hospital: {
          _id: hospital._id,
          name: hospital.name,
          type: hospital.type,
          address: hospital.address,
          location: hospital.location
        }
      }
    });
  } catch (error) {
    logger.error('Create booking error:', error);
    next(error);
  }
};

// @desc    Get booking by ID
// @route   GET /api/v1/medical/booking/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await MedicalBooking.findById(req.params.id)
      .populate('userId', 'name phone email')
      .populate('selectedHospital')
      .populate('assignedAmbulance');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.userId._id.toString() !== req.user.id && 
        !['admin', 'dispatcher', 'ambulance_driver'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    logger.error('Get booking error:', error);
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/v1/medical/bookings
// @access  Private
exports.getUserBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };

    const bookings = await MedicalBooking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('selectedHospital', 'name address type')
      .populate('assignedAmbulance', 'vehicleNumber vehicleType');

    const total = await MedicalBooking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get user bookings error:', error);
    next(error);
  }
};

// @desc    Cancel booking
// @route   PATCH /api/v1/medical/booking/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const booking = await MedicalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if cancellable
    if (['completed', 'cancelled', 'reached_hospital'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this booking'
      });
    }

    await booking.updateStatus('cancelled', reason || 'Cancelled by user');
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user.id;
    booking.cancelledAt = Date.now();
    await booking.save();

    // Release ambulance
    if (booking.assignedAmbulance) {
      await Ambulance.findByIdAndUpdate(booking.assignedAmbulance, {
        status: 'available',
        isAvailable: true,
        currentBooking: null
      });
    }

    logger.info(`Booking cancelled: ${booking.bookingId}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    next(error);
  }
};

// @desc    Update booking status (for drivers/dispatchers)
// @route   PATCH /api/v1/medical/booking/:id/status
// @access  Private (Driver/Dispatcher)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note, location } = req.body;

    const booking = await MedicalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (!['admin', 'dispatcher', 'ambulance_driver'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await booking.updateStatus(status, note, location);

    logger.info(`Booking status updated: ${booking.bookingId} -> ${status}`);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: { booking }
    });
  } catch (error) {
    logger.error('Update booking status error:', error);
    next(error);
  }
};

// @desc    Rate booking
// @route   POST /api/v1/medical/booking/:id/rate
// @access  Private
exports.rateBooking = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    const booking = await MedicalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }

    booking.rating = rating;
    booking.feedback = feedback;
    await booking.save();

    // Update ambulance rating
    if (booking.assignedAmbulance && rating.ambulanceService) {
      await Ambulance.findByIdAndUpdate(booking.assignedAmbulance, {
        $inc: { 'metrics.totalRatings': 1 }
      });
    }

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: { booking }
    });
  } catch (error) {
    logger.error('Rate booking error:', error);
    next(error);
  }
};
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Lazy-load controllers to prevent crash if a file has issues
const getBookingCtrl  = () => require('../controllers/medical/medicalBookingController');
const getHospitalCtrl = () => require('../controllers/medical/hospitalController');
const getAmbCtrl      = () => require('../controllers/medical/ambulanceController');

// ── Booking routes ──────────────────────────────────────────────────
router.post   ('/booking',           protect, (req,res,next) => getBookingCtrl().createBooking(req,res,next));
router.get    ('/booking/:id',       protect, (req,res,next) => getBookingCtrl().getBooking(req,res,next));
router.get    ('/bookings',          protect, (req,res,next) => getBookingCtrl().getUserBookings(req,res,next));
router.patch  ('/booking/:id/cancel',protect, (req,res,next) => getBookingCtrl().cancelBooking(req,res,next));
router.patch  ('/booking/:id/status',protect, (req,res,next) => getBookingCtrl().updateBookingStatus(req,res,next));
router.post   ('/booking/:id/rate',  protect, (req,res,next) => getBookingCtrl().rateBooking(req,res,next));

// ── Hospital routes ─────────────────────────────────────────────────
router.get('/hospitals/government',  (req,res,next) => getHospitalCtrl().getGovernmentHospitals(req,res,next));
router.get('/hospitals/private',     (req,res,next) => getHospitalCtrl().getPrivateHospitals(req,res,next));
router.get('/hospitals/nearby',      (req,res,next) => getHospitalCtrl().getNearbyHospitals(req,res,next));
router.get('/hospitals',             (req,res,next) => getHospitalCtrl().getHospitals(req,res,next));
router.get('/hospitals/:id',         (req,res,next) => getHospitalCtrl().getHospitalById(req,res,next));
router.patch('/hospitals/:id/beds',  protect, (req,res,next) => getHospitalCtrl().updateBedAvailability(req,res,next));
router.patch('/hospitals/:id/emergency-status', protect, (req,res,next) => getHospitalCtrl().toggleEmergencyStatus(req,res,next));

// ── Ambulance routes ────────────────────────────────────────────────
router.get('/ambulances/available',  (req,res,next) => getAmbCtrl().getAvailableAmbulances(req,res,next));
router.get('/ambulances/nearby',     (req,res,next) => getAmbCtrl().getNearbyAmbulances(req,res,next));
router.get('/ambulances',            (req,res,next) => getAmbCtrl().getAmbulances(req,res,next));
router.get('/ambulances/:id',        (req,res,next) => getAmbCtrl().getAmbulanceById(req,res,next));
router.patch('/ambulances/:id/location', protect, (req,res,next) => getAmbCtrl().updateLocation(req,res,next));
router.patch('/ambulances/:id/status',   protect, (req,res,next) => getAmbCtrl().updateStatus(req,res,next));
router.get('/ambulances/:id/stats',  protect, (req,res,next) => getAmbCtrl().getAmbulanceStats(req,res,next));

module.exports = router;
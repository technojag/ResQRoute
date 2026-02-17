const express = require('express');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Lazy-load controllers
const getFireCtrl  = () => require('../controllers/fire/fireBookingController');

// ── Incident routes ─────────────────────────────────────────────────
router.post  ('/incident',            protect, (req,res,next) => getFireCtrl().createIncident(req,res,next));
router.get   ('/incidents/active',    protect, (req,res,next) => getFireCtrl().getActiveIncidents(req,res,next));
router.get   ('/incidents',           protect, (req,res,next) => getFireCtrl().getUserIncidents(req,res,next));
router.get   ('/incident/:id',        protect, (req,res,next) => getFireCtrl().getIncident(req,res,next));
router.patch ('/incident/:id/cancel', protect, (req,res,next) => getFireCtrl().cancelIncident(req,res,next));
router.patch ('/incident/:id/status', protect, (req,res,next) => getFireCtrl().updateIncidentStatus(req,res,next));

// ── Station & Truck routes ──────────────────────────────────────────
router.get('/stations', (req,res,next) => getFireCtrl().getFireStations(req,res,next));
router.get('/trucks',   (req,res,next) => getFireCtrl().getFireTrucks(req,res,next));

module.exports = router;
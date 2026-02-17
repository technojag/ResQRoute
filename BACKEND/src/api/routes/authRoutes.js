const express = require('express');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
const getCtrl = () => require('../controllers/authController');

router.post  ('/register',    (req,res,next) => getCtrl().register(req,res,next));
router.post  ('/login',       (req,res,next) => getCtrl().login(req,res,next));
router.get   ('/me',     protect, (req,res,next) => getCtrl().getMe(req,res,next));
router.put   ('/profile',protect, (req,res,next) => getCtrl().updateProfile(req,res,next));
router.post  ('/fcm-token',   protect, (req,res,next) => getCtrl().updateFcmToken(req,res,next));
router.post  ('/location',    protect, (req,res,next) => getCtrl().updateLocation(req,res,next));
router.post  ('/availability',protect, (req,res,next) => getCtrl().updateAvailability(req,res,next));
router.post  ('/logout',      protect, (req,res,next) => getCtrl().logout(req,res,next));

module.exports = router;
const express = require('express');
const router = express.Router();

const authRoutes    = require('./authRoutes');
const medicalRoutes = require('./medicalRoutes');
const fireRoutes    = require('./fireRoutes');

router.use('/auth',    authRoutes);
router.use('/medical', medicalRoutes);
router.use('/fire',    fireRoutes);

module.exports = router;
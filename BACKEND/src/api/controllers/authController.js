const User = require('../../models/User');
const logger = require('../../utils/logger');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, bloodGroup } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    const user = await User.create({ name, email, phone, password, role: role || 'user', bloodGroup });
    const token = user.generateAuthToken();

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: user.toJSON(), token }
    });
  } catch (error) {
    logger.error('Register error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastActive = Date.now();
    await user.save();

    const token = user.generateAuthToken();
    logger.info(`User logged in: ${email || phone}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toJSON(), token }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'bloodGroup', 'emergencyContact', 'medicalHistory', 'allergies', 'currentMedications'];
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated successfully', data: { user } });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

// @desc    Update FCM token
// @route   POST /api/v1/auth/fcm-token
// @access  Private
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ success: true, message: 'FCM token updated successfully' });
  } catch (error) {
    logger.error('Update FCM token error:', error);
    next(error);
  }
};

// @desc    Update location (for drivers)
// @route   POST /api/v1/auth/location
// @access  Private
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
      lastActive: Date.now()
    }, { new: true });

    res.json({ success: true, message: 'Location updated successfully', data: { location: { latitude, longitude } } });
  } catch (error) {
    logger.error('Update location error:', error);
    next(error);
  }
};

// @desc    Update availability status
// @route   POST /api/v1/auth/availability
// @access  Private
exports.updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    await User.findByIdAndUpdate(req.user.id, { isAvailable }, { new: true });
    res.json({ success: true, message: `Status updated to ${isAvailable ? 'available' : 'unavailable'}`, data: { isAvailable } });
  } catch (error) {
    logger.error('Update availability error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (fcmToken) {
      await User.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: fcmToken } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};